class RobotController {
    constructor(number, robotId, userId, ws) {
        this.number = number;
        if (this.number > 3 || this.number < 1) {
            throw new Error('Robot number must be between 1 and 3');
        }
        this.robotId = robotId;
        this.userId = userId;
        this.ws = ws;
        this.peer = null;
        this.remoteControlDataChannel = null;
        this.isConnected = false;
        this.lastConnectionCheckTime = null;
        this.iceCandidateList = [];

        this.frameCount = 0;
        this.fpsInterval = null;

        this.connectingCheckInterval = null;

        this.ifBroadcast = false;

        this.initializeElements();
        this.initializeButtonEvents();
    }

    initializeElements = () => {
        this.connectedRobotIdElement = document.querySelector(`#connected_robot_${this.number}`)
        this.peerDisconnectButton = document.querySelector(`#peer_disconnect_${this.number}`);

        this.controlBoxElement = document.querySelector(`#controlBox_${this.number}`);
        this.controlUpBtn = this.controlBoxElement.querySelector(`#up_${this.number}`);
        this.controlDownBtn = this.controlBoxElement.querySelector(`#down_${this.number}`);
        this.controlRightBtn = this.controlBoxElement.querySelector(`#right_${this.number}`);
        this.controlLeftBtn = this.controlBoxElement.querySelector(`#left_${this.number}`);
        this.controlBroadcastBtn = document.querySelector(`#control_broadcast_${this.number}`);
        this.controlBroadcastBtn.checked = false;

        this.fpsElement = document.querySelector(`#fps_${this.number}`);
        this.remoteVideoElement = document.querySelector(`#remoteVideo_${this.number}`);
    }

    initializeButtonEvents = () => {
        this.controlUpBtn.addEventListener('click', () => {
            if (this.ifBroadcast) {
                this.broadcastControlData('up');
            } else {
                this.sendControlData('up');
            }
        });

        this.controlDownBtn.addEventListener('click', () => {
            if (this.ifBroadcast) {
                this.broadcastControlData('down');
            } else {
                this.sendControlData('down');
            }
        });

        this.controlRightBtn.addEventListener('click', () => {
            if (this.ifBroadcast) {
                this.broadcastControlData('right');
            } else {
                this.sendControlData('right');
            }
        });

        this.controlLeftBtn.addEventListener('click', () => {
            if (this.ifBroadcast) {
                this.broadcastControlData('left');
            } else {
                this.sendControlData('left');
            }
        });

        this.controlBroadcastBtn.addEventListener('click', () => {
            this.ifBroadcast = this.controlBroadcastBtn.checked;
            if (this.ifBroadcast) {
                this.addToBroadcastList();
            } else {
                this.removeFromBroadcastList();
            }
        });

        this.peerDisconnectButton.addEventListener('click', () => {
            this.disconnect();
        });
    }

    connect = async () => {
        this.peer = this.createPeerConnection();
        this.remoteControlDataChannel = await this.createRemoteControlDataChannel();
        await this.sendSdpOffer()
    }

    createPeerConnection = () => {
        // Creating the peer
        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "turn:turn.acslgcs.com:3478",
                    username: "gistacsl",
                    credential: "qwqw!12321"
                }
            ],
        });

        peer.onicecandidate = this.peerOnIceCandidate;
        peer.ondatachannel = this.peerOnDataChannel;
        peer.ontrack = this.peerOnTrack;
        peer.onconnectionstatechange = this.peerOnStateChange;

        return peer;
    }

    peerOnIceCandidate = (iceCandidateEvent) => {
        if (iceCandidateEvent.candidate === null) {
            console.log('ICE candidate gathering complete');
            return;
        }

        const sendIceCandidateData = {
            type: 'send_ice_candidate',
            user_id: this.userId,
            robot_id: this.robotId,
            ice_candidate: iceCandidateEvent.candidate
        }
        this.ws.send(JSON.stringify(sendIceCandidateData))
    }

    peerOnDataChannel = (event) => {
        let dataChannel = event.channel;
        if (dataChannel.label === 'position_data_channel') {
            this.setPositionDataChannel(dataChannel);
        } else if (dataChannel.label === 'go2_low_state_data_channel') {
            this.setGo2LowStateDataChannel(dataChannel);
        } else {
            console.log(dataChannel.label)
        }
    }

    peerOnTrack = (event) => {
        // WebRTC 로 오는 영상을 remoteVideo element 에 그대로 뿌리기
        this.remoteVideoElement.srcObject = event.streams[0];

        // Start FPS monitoring once video starts playing
        this.remoteVideoElement.onloadedmetadata = () => {
            // Setup frame counter
            this.frameCount = 0;

            // Use requestVideoFrameCallback if available
            if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
                this.remoteVideoElement.requestVideoFrameCallback(this.countFrames);
            } else {
                // Fallback for browsers not supporting requestVideoFrameCallback
                console.warn("requestVideoFrameCallback not supported, FPS monitoring may be less accurate");
                this.remoteVideoElement.addEventListener('timeupdate', () => {
                    this.frameCount++;
                });
            }

            this.fpsInterval = setInterval(this.updateFPSElement, 1000);
        }

        this.remoteVideoElement.onended = () => {
            if (this.fpsInterval) {
                clearInterval(this.fpsInterval);
                this.fpsInterval = null;
            }
        }
    }

    peerOnStateChange = async (e) => {
        const pc = e.currentTarget;
        console.log('connection state: ', pc.connectionState);

        if (pc.connectionState === 'connected') {
            this.isConnected = true;
            this.connectedRobotIdElement.textContent = selectedRobotId;
            this.peerDisconnectButton.disabled = false;

            this.connectingCheckInterval = setInterval(this.connectionCheck, 5000);
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            await this.connect();
        }
    }

    countFrames = () => {
        this.frameCount++;
        this.remoteVideoElement.requestVideoFrameCallback(this.countFrames);
    }

    updateFPSElement = () => {
        const currentFPS = this.frameCount;
        this.frameCount = 0;
        this.fpsElement.innerHTML = `${currentFPS} fps`;
    }

    setPositionDataChannel = (channel) => {
        channel.onopen = () => {
        };

        channel.onmessage = (event) => {
            const message = event.data;

            try {
                const jsonData = JSON.parse(message);
                this.updatePosition(jsonData.x, jsonData.y, jsonData.theta);
            } catch (e) {
                console.log(e);
            }
        }
    }

    setGo2LowStateDataChannel = (channel) => {
        channel.onopen = () => {
            console.log('go2_low_state_data_channel opened');
        };

        channel.onmessage = (event) => {
            const message = event.data;

            try {
                const jsonData = JSON.parse(message);
                const imuState = jsonData.imu_state;
                const q = imuState.quaternion;
                this.updateQ(q[0], q[1], q[2], q[3]);
            } catch (e) {
                console.log(e);
            }
        }

        channel.onerror = (event) => {
            console.error('Error in go2_low_state_data_channel:', event);
        }

        channel.onclose = () => {
            console.log('go2_low_state_data_channel closed');
        }
    }

    connectionCheck = () => {
        const currentTime = new Date().getTime();
        if (this.lastConnectionCheckTime && (currentTime - this.lastConnectionCheckTime) < 10000) {
            this.isConnected = true;
        }

        const connectionCheckData = {
            type: 'connection_check',
            user_id: userId,
            robot_id: selectedRobotId,
        }
        if (this.remoteControlDataChannel.readyState !== 'open') {
            return;
        }
        this.remoteControlDataChannel.send(JSON.stringify(connectionCheckData))
    }

    createRemoteControlDataChannel = async () => {
        let remote_control_data_channel = this.peer.createDataChannel('remote_control')
        remote_control_data_channel.onopen = (event) => {
            console.log('remote_control_data_channel opened');
        }

        remote_control_data_channel.onmessage = (event) => {
            if (event.data.type === 'connection_check') {
                this.lastConnectionCheckTime = new Date().getTime();
            }
        }

        return remote_control_data_channel;
    }

    sendSdpOffer = async () => {
        this.peer.addTransceiver('video', {direction: 'sendrecv'});

        const sdpOffer = await this.peer.createOffer();
        await this.peer.setLocalDescription(new RTCSessionDescription(sdpOffer));

        const sendSdpOfferData = {
            type: 'send_sdp_offer',
            user_id: this.userId,
            robot_id: this.robotId,
            sdp_offer: sdpOffer.sdp
        }

        this.ws.send(JSON.stringify(sendSdpOfferData));
    }

    sendControlData = (direction) => {
        if (!this.isConnected || !this.remoteControlDataChannel) {
            console.error('remoteControlDataChannel is not initialized');
            return;
        }

        this.remoteControlDataChannel.send(JSON.stringify({
            direction: direction
        }));
    }

    receiveSdpAnswer = async (sdp_answer) => {
        await this.peer.setRemoteDescription(new RTCSessionDescription({sdp: sdp_answer, type: "answer"}));
        for (const candidate of this.iceCandidateList) {
            await this.peer.addIceCandidate(candidate);
        }
    }

    receiveIceCandidate = async (ice_candidate) => {
        try {
            const candidate = new RTCIceCandidate({
                candidate: ice_candidate.candidate,
                sdpMLineIndex: ice_candidate.sdpMLineIndex,
                sdpMid: ice_candidate.sdpMid
            })
            // ice candidate 를 받는 시점은 sdpAnswer 보다 먼저일 수 있습니다.
            // 먼저 ice candidate 가 오는 경우 addIceCandidate 를 못해주기 때문에 우선 리스트에 담아둔 후
            // sdpAnswer 가 와서 setRemoteDescription 호출 후에 일괄적으로 addIceCandidate 를 진행해 줍니다. (바로 위 메소드)
            this.iceCandidateList.push(candidate)
        } catch (error) {
            console.error('Error adding received ICE candidate:', error);
        }
    }

    disconnect = () => {
        if (this.connectingCheckInterval) {
            clearInterval(this.connectingCheckInterval);
            this.connectingCheckInterval = null;
        }
        if (this.peer) {
            this.peer.close();
            this.peer = null;
        }
        this.isConnected = false;
        this.lastConnectionCheckTime = null;
        this.remoteControlDataChannel = null;
        this.iceCandidateList = [];

        this.connectedRobotIdElement.textContent = '...';
        this.peerDisconnectButton.disabled = true;

        this.removeFromBroadcastList();
        this.removeFromList();
        this.deletePosition();
    }

    removeFromList = () => {}
    addToBroadcastList = () => {}
    removeFromBroadcastList = () => {}
    updatePosition = (x, y, theta) => {}
    deletePosition = () => {}
    updateQ = (w, x, y, z) => {}
    broadcastControlData = (direction) => {}
}