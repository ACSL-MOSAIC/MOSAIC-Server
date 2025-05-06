// connect to the signaling server
const socket = new WebSocket("/ws/control/user_1");
let peer = null;
let connectingCheckInterval = null;
let isConnected = false;
let lastConnectionCheckTime = null;
let remoteControlDataChannel = null;
let selectedRobotId = null;
let robotSelectionDisabled = false;

let connectButton = document.querySelector('#connect');

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
        // iceTransportPolicy: "relay"
    });

    // ICE layer
    peer.onicecandidate = (iceCandidateEvent) => {
        if (iceCandidateEvent.candidate === null) {
            console.log('ICE candidate gathering complete');
            return;
        }
        onIceCandidate(iceCandidateEvent.candidate.toJSON());
    }

    return peer;
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

const sendSdpOffer = async (peer, robotId) => {
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
connectButton.addEventListener('click', async () => {
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
        user_id: 'user_1',
        robot_id: selectedRobotId,
    }
    if (remoteControlDataChannel.readyState !== 'open') {
        return;
    }
    remoteControlDataChannel.send(JSON.stringify(connectionCheckData))
}

socket.addEventListener('open', function (event) {
    const getRobotListData = {
        type: 'get_robot_list',
    }
    socket.send(JSON.stringify(getRobotListData))
})

socket.addEventListener('message', async function (event) {
    const data = JSON.parse(event.data)
    if (data.type === 'receive_sdp_answer') {
        await receiveSdpAnswer(data.sdp_answer)
    } else if (data.type === 'receive_ice_candidate') {
        await receiveIceCandidate(data.ice_candidate)
    } else if (data.type === 'robot_list') {
        await updateRobotList(data.robots)
    }
})

const receiveSdpAnswer = async (sdp_answer) => {
    console.log('sdp_answer', sdp_answer);
    await peer.setRemoteDescription(new RTCSessionDescription({sdp: sdp_answer, type: "answer"}));
}

const receiveIceCandidate = async (ice_candidate) => {
    try {
        const candidate = new RTCIceCandidate({
            candidate: ice_candidate.candidate,
            sdpMLineIndex: ice_candidate.sdpMLineIndex,
            sdpMid: ice_candidate.sdpMid
        })
        await peer.addIceCandidate(candidate);
    } catch (error) {
        console.error('Error adding received ice candidate', error);
    }
}

const updateRobotList = async (robots) => {
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

const closePeerConnection = () => {
    try {
        clearInterval(connectingCheckInterval);
        peer.close();
        isConnected = false;
        lastConnectionCheckTime = null;
        remoteControlDataChannel = null;
        selectedRobotId = null;
        robotSelectionDisabled = false;
    } catch (e) {
        console.log(e);
    }
}
const onIceCandidate = (candidate) => {
    const sendIceCandidateData = {
        type: 'send_ice_candidate',
        user_id: 'user_1',
        robot_id: selectedRobotId,
        ice_candidate: candidate
    }
    socket.send(JSON.stringify(sendIceCandidateData))
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
    // if (!isConnected || !remoteControlDataChannel) {
    //     console.error('remoteControlDataChannel is not initialized');
    //     return;
    // }

    const controlData = {
        direction: direction
    }
    console.log(JSON.stringify(controlData));
    remoteControlDataChannel.send(JSON.stringify(controlData));
}

// Handle disconnect button
const disconnectButton = document.querySelector('#disconnect');
disconnectButton.addEventListener('click', () => {
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

    const robotElements = document.querySelectorAll('.robot-item');
    robotElements.forEach((element) => {
        element.classList.remove('robot-item--touched');
    })
})