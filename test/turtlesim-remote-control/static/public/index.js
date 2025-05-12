let socket;
let userId;
const userIdInputElement = document.querySelector('#user_id_input');
const wsConnectButton = document.querySelector('#ws_connect_btn');
const wsDisconnectButton = document.querySelector('#ws_disconnect_btn');
wsConnectButton.addEventListener('click', async () => {
    userId = userIdInputElement.value;
    socket = new WebSocket("/ws/control/" + userId);
    addSocketEventListener(socket);
});
wsDisconnectButton.addEventListener('click', async () => {
    socket.close();
})

let peer = null;
let connectingCheckInterval = null;
let isConnected = false;
let lastConnectionCheckTime = null;
let remoteControlDataChannel = null;
let selectedRobotId = null;
let robotSelectionDisabled = false;

let peerConnectButton = document.querySelector('#peer-connect');
let positionElement = document.querySelector('#position');

const createPeer = async () => {
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

    peer.onicecandidate = peerOnIceCandidate;
    peer.ondatachannel = peerOnDataChannel;
    peer.ontrack = peerOnTrack;
    peer.onconnectionstatechange = peerOnStateChange;

    return peer;
}

const peerOnIceCandidate = (iceCandidateEvent) => {
    if (iceCandidateEvent.candidate === null) {
        console.log('ICE candidate gathering complete');
        return;
    }

    const sendIceCandidateData = {
        type: 'send_ice_candidate',
        user_id: 'user_1',
        robot_id: selectedRobotId,
        ice_candidate: iceCandidateEvent.candidate
    }
    socket.send(JSON.stringify(sendIceCandidateData))
}

const peerOnDataChannel = (event) => {
    let dataChannel = event.channel;
    if (dataChannel.label === 'position_data_channel') {
        setUpPositionDataChannel(dataChannel);
    } else {
        console.log(dataChannel.label)
    }
}

const remoteVideo = document.querySelector('#remoteVideo');
const fpsElement = document.querySelector('#fps');
let fpsInterval = null;
let frameCount = 0;
const peerOnTrack = (event) => {
    if (!remoteVideo) {
        return;
    }
    console.log(event);
    // WebRTC 로 오는 영상을 remoteVideo element 에 그대로 뿌리기
    remoteVideo.srcObject = event.streams[0];

    // Start FPS monitoring once video starts playing
    remoteVideo.onloadedmetadata = () => {
        console.log('Start')
        // Setup frame counter
        frameCount = 0;

        // Use requestVideoFrameCallback if available
        if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
            function countFrames() {
                frameCount++;
                remoteVideo.requestVideoFrameCallback(countFrames);
            }

            remoteVideo.requestVideoFrameCallback(countFrames);
        } else {
            // Fallback for browsers not supporting requestVideoFrameCallback
            console.warn("requestVideoFrameCallback not supported, FPS monitoring may be less accurate");
            remoteVideo.addEventListener('timeupdate', () => {
                frameCount++;
            });
        }

        fpsInterval = setInterval(updateFPSElement, 1000);
    }

    remoteVideo.onended = () => {
        if (fpsInterval) {
            clearInterval(fpsInterval);
            fpsInterval = null;
        }
    }
}

const updateFPSElement = () => {
    const currentFPS = frameCount;
    console.log(`${currentFPS} fps`);
    frameCount = 0;
    fpsElement.innerHTML = `${currentFPS} fps`;
}

const positionCanvas = document.querySelector('#position_canvas');
const positionCtx = positionCanvas.getContext('2d');
const canvasSize = 300;
positionCanvas.width = canvasSize;
positionCanvas.height = canvasSize;

const MAX_COORDINATE = 12;
const scale = canvasSize / MAX_COORDINATE;

const drawPoint = (x, y, theta) => {
    positionCtx.clearRect(0, 0, positionCanvas.width, positionCanvas.height);

    const canvasX = x * scale;
    const canvasY = y * scale;

    positionCtx.beginPath();
    positionCtx.arc(canvasX, canvasSize - canvasY, 5, 0, Math.PI * 2);
    positionCtx.fillStyle = 'red';
    positionCtx.fill();
    positionCtx.closePath();

    const arrowLength = 30;

    // 화살표 끝점 계산 (theta 방향으로)
    const arrowEndX = canvasX + Math.cos(-theta) * arrowLength;
    const arrowEndY = canvasSize - canvasY + Math.sin(-theta) * arrowLength;

    // 화살표 선 그리기
    positionCtx.beginPath();
    positionCtx.moveTo(canvasX, canvasSize - canvasY);
    positionCtx.lineTo(arrowEndX, arrowEndY);
    positionCtx.strokeStyle = 'blue';
    positionCtx.lineWidth = 2;
    positionCtx.stroke();
    positionCtx.closePath();
}

const setUpPositionDataChannel = (channel) => {
    channel.onopen = () => {
    };

    channel.onmessage = (event) => {
        const message = event.data;

        try {
            const jsonData = JSON.parse(message);
            drawPoint(jsonData.x, jsonData.y, jsonData.theta)
            positionElement.textContent = JSON.stringify(jsonData, null, 2);
        } catch (e) {
            console.log(e);
        }
    }
}

const createRemoteControlDataChannel = async (peer) => {
    let remote_control_data_channel = peer.createDataChannel('remote_control')
    remote_control_data_channel.onopen = (event) => {
        console.log('remote_control_data_channel opened');
    }

    remote_control_data_channel.onmessage = (event) => {
        if (event.data.type === 'connection_check') {
            lastConnectionCheckTime = new Date().getTime();
        }
    }

    return remote_control_data_channel;
}

const connectedRobotIdElement = document.querySelector('#connected_robot');
const peerOnStateChange = async (e) => {
    const pc = e.currentTarget;
    console.log(pc.connectionState);

    if (pc.connectionState === 'connected') {
        isConnected = true;
        connectedRobotIdElement.textContent = selectedRobotId;
        peerConnectButton.disabled = true;
        peerDisconnectButton.disabled = false;
    }
}

const sendSdpOffer = async (peer, robotId) => {
    peer.addTransceiver('video', {direction: 'sendrecv'});

    const sdpOffer = await peer.createOffer();
    await peer.setLocalDescription(new RTCSessionDescription(sdpOffer));

    const sendSdpOfferData = {
        type: 'send_sdp_offer',
        user_id: 'user_1',
        robot_id: robotId,
        sdp_offer: sdpOffer.sdp
    }

    socket.send(JSON.stringify(sendSdpOfferData));
}

// Handle connect button
peerConnectButton.addEventListener('click', async () => {
    if (!selectedRobotId) {
        alert('Please select a robot first');
        return;
    }
    robotSelectionDisabled = true;

    peer = await createPeer();
    remoteControlDataChannel = await createRemoteControlDataChannel(peer);
    await sendSdpOffer(peer, selectedRobotId)

    connectingCheckInterval = setInterval(connectionCheck, 5000);
});

const connectionCheck = () => {
    const currentTime = new Date().getTime();
    if (lastConnectionCheckTime && (currentTime - lastConnectionCheckTime) < 10000) {
        isConnected = true;
    }

    const connectionCheckData = {
        type: 'connection_check',
        user_id: userId,
        robot_id: selectedRobotId,
    }
    if (remoteControlDataChannel.readyState !== 'open') {
        return;
    }
    remoteControlDataChannel.send(JSON.stringify(connectionCheckData))
}

const wsConnectionStatusElement = document.querySelector('#ws_connection_status');
const addSocketEventListener = (ws) => {
    ws.addEventListener('open', function (event) {
        wsConnectionStatusElement.textContent = 'Connected!'
        userIdInputElement.disabled = true;
        wsConnectButton.disabled = true;
        wsDisconnectButton.disabled = false;
        const getRobotListData = {
            type: 'get_robot_list',
        }
        ws.send(JSON.stringify(getRobotListData))
    })

    ws.addEventListener('close', function () {
        wsConnectionStatusElement.textContent = 'Disconnected!'
        userIdInputElement.disabled = false;
        wsConnectButton.disabled = false;
        wsDisconnectButton.disabled = true;
        resetRobotList()
    })

    ws.addEventListener('message', async function (event) {
        const data = JSON.parse(event.data)
        if (data.type === 'receive_sdp_answer') {
            await receiveSdpAnswer(data.sdp_answer)
        } else if (data.type === 'receive_ice_candidate') {
            await receiveIceCandidate(data.ice_candidate)
        } else if (data.type === 'robot_list') {
            updateRobotList(data.robots)
        }
    })
}

iceCandidateList = []
const receiveSdpAnswer = async (sdp_answer) => {
    await peer.setRemoteDescription(new RTCSessionDescription({sdp: sdp_answer, type: "answer"}));
    for (const candidate of iceCandidateList) {
        await peer.addIceCandidate(candidate);
    }
}

const receiveIceCandidate = async (ice_candidate) => {
    try {
        const candidate = new RTCIceCandidate({
            candidate: ice_candidate.candidate,
            sdpMLineIndex: ice_candidate.sdpMLineIndex,
            sdpMid: ice_candidate.sdpMid
        })
        // ice candidate 를 받는 시점은 sdpAnswer 보다 먼저일 수 있습니다.
        // 먼저 ice candidate 가 오는 경우 addIceCandidate 를 못해주기 때문에 우선 리스트에 담아둔 후
        // sdpAnswer 가 와서 setRemoteDescription 호출 후에 일괄적으로 addIceCandidate 를 진행해 줍니다. (바로 위 메소드)
        // await peer.addIceCandidate(candidate);
        iceCandidateList.push(candidate)
    } catch (error) {
        console.error('Error adding received ice candidate', error);
    }
}

const updateRobotList = (robots) => {
    const robotsList = document.querySelector('#robotsList');
    robotsList.innerHTML = '';

    let isSelectedRobotAlive = false;

    robots.forEach(robot => {
        const robotItem = document.createElement('div');
        robotItem.innerHTML = robot;
        robotItem.className = 'robot-item';
        robotItem.addEventListener('click', () => {
            if (robotSelectionDisabled) {
                return;
            }

            const robotElements = document.querySelectorAll('.robot-item');
            robotElements.forEach((element) => {
                element.classList.remove('robot-item--touched');
            })
            robotItem.classList.add('robot-item--touched');
            selectedRobotId = robot;
        });
        if (robot === selectedRobotId) {
            isSelectedRobotAlive = true;
            robotItem.classList.add('robot-item--touched');
        }
        robotsList.appendChild(robotItem);
    });

    if (isSelectedRobotAlive === false) {
        closePeerConnection();
    }
}

const resetRobotList = () => {
    const robotsList = document.querySelector('#robotsList');
    robotsList.innerHTML = 'No robots connected';
}

const closePeerConnection = () => {
    try {
        clearInterval(connectingCheckInterval);
        if (!!peer) {
            peer.close();
        }
        isConnected = false;
        lastConnectionCheckTime = null;
        remoteControlDataChannel = null;
        selectedRobotId = null;
        robotSelectionDisabled = false;
    } catch (e) {
        console.log(e);
    }
}

// register remote control button
const controlBox = document.querySelector('#controlBox');
const controlUpBtn = controlBox.querySelector('#up');
const controlDownBtn = controlBox.querySelector('#down');
const controlRightBtn = controlBox.querySelector('#right');
const controlLeftBtn = controlBox.querySelector('#left');

controlUpBtn.addEventListener('click', () => {
    sendControlData('up');
})
controlDownBtn.addEventListener('click', () => {
    sendControlData('down');
})
controlRightBtn.addEventListener('click', () => {
    sendControlData('right');
})
controlLeftBtn.addEventListener('click', () => {
    sendControlData('left');
})

const sendControlData = (direction) => {
    if (!isConnected || !remoteControlDataChannel) {
        console.error('remoteControlDataChannel is not initialized');
        return;
    }

    remoteControlDataChannel.send(JSON.stringify({
        direction: direction
    }));
}

// Handle disconnect button
const peerDisconnectButton = document.querySelector('#peer_disconnect');
peerDisconnectButton.addEventListener('click', () => {
    if (connectingCheckInterval) {
        clearInterval(connectingCheckInterval);
        connectingCheckInterval = null;
    }
    if (peer) {
        peer.close();
        peer = null;
    }
    isConnected = false;
    lastConnectionCheckTime = null;
    remoteControlDataChannel = null;
    selectedRobotId = null;
    robotSelectionDisabled = false;
    positionElement.textContent = '';

    const robotElements = document.querySelectorAll('.robot-item');
    robotElements.forEach((element) => {
        element.classList.remove('robot-item--touched');
    })

    connectedRobotIdElement.textContent = '...';
    peerConnectButton.disabled = false;
    peerDisconnectButton.disabled = true;
})