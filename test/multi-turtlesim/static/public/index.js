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


let selectedRobotId = null;
const MaxRobotCount = 3;
const robotControllerList = [null, null, null];
const broadcastList = [null, null, null];
const positionList = [null, null, null];
const peerConnectButton = document.querySelector('#peer-connect');
peerConnectButton.addEventListener('click', async () => {
    if (!selectedRobotId) {
        alert('Please select a robot first');
        return;
    }
    for (let i = 0; i < MaxRobotCount; i++) {
        if (robotControllerList[i] !== null && robotControllerList[i].robotId === selectedRobotId) {
            return;
        }
    }
    const robotId = selectedRobotId;
    const robotNumber = retrieveRobotNumber();
    if (robotNumber === -1) {
        alert('No available robot slots');
        return;
    }

    const robotController = new RobotController(robotNumber+1, robotId, userId, socket);
    robotControllerList[robotNumber] = robotController;

    robotController.removeFromList = () => {
        robotControllerList[robotNumber] = null;
        const robotElements = document.querySelectorAll('.robot-item');
        robotElements.forEach((element) => {
            if (element.innerHTML === robotId) {
                element.classList.remove('robot-item--touched');
            }
        })
    }

    robotController.addToBroadcastList = () => {
        broadcastList[robotNumber] = robotController;
    }

    robotController.removeFromBroadcastList = () => {
        broadcastList[robotNumber] = null;
    }

    robotController.updatePosition = (x, y, theta) => {
        positionList[robotNumber] = {
            robotId: robotId,
            x: x,
            y: y,
            theta: theta
        };
    }

    robotController.deletePosition = () => {
        positionList[robotNumber] = null;
    }

    robotController.broadcastControlData = (direction) => {
        for (let i = 0; i < MaxRobotCount; i++) {
            if (broadcastList[i] !== null) {
                broadcastList[i].sendControlData(direction);
            }
        }
    }

    await robotController.connect();
});

const retrieveRobotNumber = () => {
    for (let i = 0; i < MaxRobotCount; i++) {
        if (robotControllerList[i] === null) {
            return i;
        }
    }
    return -1;
}


const positionCanvas = document.querySelector('#position_canvas');
const positionCtx = positionCanvas.getContext('2d');
const canvasSize = 700;
positionCanvas.width = canvasSize;
positionCanvas.height = canvasSize;
positionCanvas.style = `width: ${canvasSize}px; height: ${canvasSize}px; border: 1px solid black;`;

const MAX_COORDINATE = 12;
const scale = canvasSize / MAX_COORDINATE;

setInterval(drawPositions , 50);

function drawPositions() {
    positionCtx.clearRect(0, 0, positionCanvas.width, positionCanvas.height);

    for (let i = 0; i < MaxRobotCount; i++) {
        if (positionList[i] !== null) {
            const { x, y, theta, robotId } = positionList[i];
            drawPoint(x, y, theta, robotId);
        }
    }
}

const drawPoint = (x, y, theta, turtle_name) => {
    const canvasX = x * scale;
    const canvasY = y * scale;

    // 점 그리기
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

    // 텍스트 레이블 그리기
    positionCtx.fillStyle = 'black';
    positionCtx.font = '12px Arial';
    positionCtx.fillText(turtle_name, canvasX + 5, canvasSize - canvasY - 5);
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
        resetRobotList();
    })

    ws.addEventListener('message', async function (event) {
        const data = JSON.parse(event.data);

        if (data.type === 'robot_list') {
            updateRobotList(data.robots);
            return;
        }

        const robotId = data.robot_id;
        let robotController = null;
        for (let i = 0; i < MaxRobotCount; i++) {
            if (robotControllerList[i] !== null && robotControllerList[i].robotId === robotId) {
                robotController = robotControllerList[i];
                break;
            }
        }
        if (robotController === null) {
            console.error('Robot controller not found for robotId:', robotId);
            return;
        }

        if (data.type === 'receive_sdp_answer') {
            await robotController.receiveSdpAnswer(data.sdp_answer)
        } else if (data.type === 'receive_ice_candidate') {
            await robotController.receiveIceCandidate(data.ice_candidate)
        }
    })
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
        for (let i = 0; i < MaxRobotCount; i++) {
            if (robotControllerList[i] !== null && robotControllerList[i].robotId === selectedRobotId) {
                robotControllerList[i].disconnect();
                robotControllerList[i] = null;
            }
        }
    }
}

const resetRobotList = () => {
    const robotsList = document.querySelector('#robotsList');
    robotsList.innerHTML = 'No robots connected';
    for (let i = 0; i < MaxRobotCount; i++) {
        if (robotControllerList[i] !== null) {
            robotControllerList[i].disconnect();
            robotControllerList[i] = null;
        }
    }
}
