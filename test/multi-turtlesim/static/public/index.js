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

    robotController.updateQ = updateQ

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
