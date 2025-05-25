const positionCanvas = document.querySelector('#position_canvas');
const positionCtx = positionCanvas.getContext('2d');
const canvasSize = 100;
positionCanvas.width = canvasSize;
positionCanvas.height = canvasSize;
positionCanvas.style = `width: ${canvasSize}px; height: ${canvasSize}px; border: 1px solid black;`;

const MAX_COORDINATE = 12;
const scale = canvasSize / MAX_COORDINATE;

setInterval(drawPositions , 50);

function drawPositions() {
    positionCtx.clearRect(0, 0, positionCanvas.width, positionCanvas.height);

    for (let i = 0; i < positionList.length; i++) {
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