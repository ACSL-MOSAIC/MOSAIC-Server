// Creating the peer
const peer = new RTCPeerConnection({
    iceServers: [
        {
            urls: "turn:turn.acslgcs.com:3478",
            username: "gistacsl",
            credential: "qwqw!12321"
        }
    ]
});

// Connecting to socket (custom path for FastAPI
const socket = io({path: '/ws/socket.io'});

// Variables for FPS calculation
let lastFrameTime = 0;
let frameCount = 0;
let fpsInterval = 1000; // Update FPS every 1 second
let lastFpsUpdateTime = 0;
let currentFps = 0;

let fpsElement = document.querySelector('#fps');

// Track remote video stream and measure its FPS
peer.ontrack = (event) => {
    const remoteStream = event.streams[0];
    const remoteVideo = document.querySelector('#remoteVideo'); // assuming you have a remoteVideo element
    if (remoteVideo) {
        remoteVideo.srcObject = remoteStream;

        // Start FPS monitoring once video starts playing
        remoteVideo.onloadedmetadata = () => {
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

            // Set interval to log FPS every second
            fpsInterval = setInterval(() => {
                currentFps = frameCount;
                fpsElement.innerHTML = `Current FPS: ${currentFps}`;
                frameCount = 0;
            }, 1000);
        };

        // Cleanup when video ends
        remoteVideo.onended = () => {
            if (fpsInterval) {
                clearInterval(fpsInterval);
                fpsInterval = null;
            }
        };
    }
};

const onSocketConnected = async () => {
    try {
        const constraints = {
            audio: true,
            video: {
                frameRate: {
                    ideal: 60,
                    max: 60,
                }
            },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        document.querySelector('#localVideo').srcObject = stream;
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
    } catch (error) {
        console.warn("로컬 미디어를 가져올 수 없습니다:", error.message);
        // 상태 표시 추가
        const localVideo = document.querySelector('#localVideo');
        if (localVideo) {
            // 로컬 비디오 대신 텍스트 표시
            const container = localVideo.parentElement;
            const statusMsg = document.createElement('div');
            statusMsg.textContent = "카메라를 사용할 수 없습니다";
            statusMsg.style.color = "white";
            statusMsg.style.background = "rgba(0,0,0,0.7)";
            statusMsg.style.padding = "10px";
            statusMsg.style.borderRadius = "5px";
            statusMsg.style.position = "absolute";
            statusMsg.style.top = "50%";
            statusMsg.style.left = "50%";
            statusMsg.style.transform = "translate(-50%, -50%)";
            container.style.position = "relative";
            container.appendChild(statusMsg);
        }
        return false;
    }
}

let callButton = document.querySelector('#call');

// Handle call button
callButton.addEventListener('click', async () => {
    const localPeerOffer = await peer.createOffer();
    await peer.setLocalDescription(new RTCSessionDescription(localPeerOffer));

    sendMediaOffer(localPeerOffer);
});

// Create media offer
socket.on('mediaOffer', async (data) => {
    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
    const peerAnswer = await peer.createAnswer();
    await peer.setLocalDescription(new RTCSessionDescription(peerAnswer));

    sendMediaAnswer(peerAnswer, data);
});

// Create media answer
socket.on('mediaAnswer', async (data) => {
    await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// ICE layer
peer.onicecandidate = (event) => {
    sendIceCandidate(event);
}

socket.on('remotePeerIceCandidate', async (data) => {
    try {
        const candidate = new RTCIceCandidate(data.candidate);
        await peer.addIceCandidate(candidate);
    } catch (error) {
        // Handle error, this will be rejected very often
    }
})

let selectedUser;

const sendMediaAnswer = (peerAnswer, data) => {
    console.log('sendMediaAnswer: data.from', data.from);
    selectedUser = data.from;
    socket.emit('mediaAnswer', {
        answer: peerAnswer,
        from: socket.id,
        to: data.from
    })
}

const sendMediaOffer = (localPeerOffer) => {
    console.log('selectedUser', selectedUser);
    socket.emit('mediaOffer', {
        offer: localPeerOffer,
        from: socket.id,
        to: selectedUser
    });
};

const sendIceCandidate = (event) => {
    console.log('selectedUser', selectedUser);
    socket.emit('iceCandidate', {
        to: selectedUser,
        candidate: event.candidate,
    });
}

const onUpdateUserList = ({userIds}) => {
    const usersList = document.querySelector('#usersList');
    const usersToDisplay = userIds.filter(id => id !== socket.id);

    console.log('usersToDisplay', usersToDisplay);

    usersList.innerHTML = '';

    usersToDisplay.forEach(user => {
        const userItem = document.createElement('div');
        userItem.innerHTML = user;
        userItem.className = 'user-item';
        userItem.addEventListener('click', () => {
            const userElements = document.querySelectorAll('.user-item');
            userElements.forEach((element) => {
                element.classList.remove('user-item--touched');
            })
            userItem.classList.add('user-item--touched');
            selectedUser = user;
        });
        usersList.appendChild(userItem);
    });
};
socket.on('update-user-list', onUpdateUserList);

const handleSocketConnected = async () => {
    await onSocketConnected();
    socket.emit('requestUserList');
};

socket.on('connect', handleSocketConnected);
  