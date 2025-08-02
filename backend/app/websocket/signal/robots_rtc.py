import logging
from uuid import UUID

from fastapi import Depends, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
from sqlmodel import Session

from app.api.deps import get_db
from app.repositories.robot_repository import RobotRepository
from app.schemas.robot import RobotStatus, RobotUpdate
from app.websocket.signal import manager
from app.websocket.signal.dto.robot_rtc_dto import (
    ReceiveIceCandidateMsg,
    ReceiveSdpAnswerMsg,
    SendIceCandidateMsg,
    SendSdpAnswerMsg,
    WebSocketErrorMsg,
)

logger = logging.getLogger(__name__)


async def handle_send_sdp_answer(
    websocket: WebSocket, data: dict, _: RobotRepository
) -> None:
    try:
        msg = SendSdpAnswerMsg(**data)
    except ValidationError as e:
        error = WebSocketErrorMsg(
            type="error", error="Invalid send_sdp_answer message", detail=str(e)
        )
        await websocket.send_json(error.model_dump())
        return

    user_ws = manager.get_user_connection(msg.user_id)
    if user_ws is None:
        error = WebSocketErrorMsg(
            type="error",
            error="User websocket not found",
            detail=f"user_id: {msg.user_id}",
        )
        await websocket.send_json(error.model_dump())
        return

    logger.info(f"Received sdp answer from user {msg.user_id} to robot {msg.robot_id}")

    receive_msg = ReceiveSdpAnswerMsg(
        type="receive_sdp_answer",
        user_id=msg.user_id,
        robot_id=msg.robot_id,
        sdp_answer=msg.sdp_answer,
    )
    await manager.send_to_user(receive_msg.model_dump(), msg.user_id)


async def handle_send_ice_candidate(
    websocket: WebSocket, data: dict, _: RobotRepository
) -> None:
    try:
        msg = SendIceCandidateMsg(**data)
    except ValidationError as e:
        error = WebSocketErrorMsg(
            type="error", error="Invalid send_ice_candidate message", detail=str(e)
        )
        await websocket.send_json(error.model_dump())
        return

    logger.info(
        f"Received ice candidate from user {msg.user_id} to robot {msg.robot_id}"
    )
    user_ws = manager.get_user_connection(msg.user_id)

    logger.info(f"User websocket: {user_ws}")
    if user_ws is None:
        error = WebSocketErrorMsg(
            type="error",
            error="User websocket not found",
            detail=f"user_id: {msg.user_id}",
        )
        await websocket.send_json(error.model_dump())
        return

    receive_msg = ReceiveIceCandidateMsg(
        type="receive_ice_candidate",
        user_id=msg.user_id,
        robot_id=msg.robot_id,
        ice_candidate=msg.ice_candidate,
    )
    await manager.send_to_user(receive_msg.model_dump(), msg.user_id)


async def handle_disconnected_robot_rtc(
    websocket: WebSocket, data: dict, repo: RobotRepository
) -> None:
    logger.info(f"Handling disconnected_robot_rtc request: {data}")
    try:
        logger.info(
            f"Updating robot {data['robot_id']} status to {RobotStatus.READY_TO_CONNECT}"
        )
        repo.update(data["robot_id"], RobotUpdate(status=RobotStatus.READY_TO_CONNECT))

    except ValidationError as e:
        logger.error(f"Invalid disconnected_robot_rtc message: {str(e)}")
        error = WebSocketErrorMsg(
            type="error", error="Invalid disconnected_robot_rtc message", detail=str(e)
        )
        await websocket.send_json(error.model_dump())


handlers = {
    "send_sdp_answer": handle_send_sdp_answer,
    "send_ice_candidate": handle_send_ice_candidate,
    "disconnected_robot_rtc": handle_disconnected_robot_rtc,
}


# 로봇 웹소켓 엔드포인트 (query_params로 robot_id 전달 받음)
async def robot_rtc_endpoint(
    websocket: WebSocket, session: Session = Depends(get_db)
) -> None:
    robot_id = websocket.query_params.get("robot_id")
    if not robot_id:
        await websocket.close(code=4000)
        return

    await manager.connect_robot(websocket, robot_id)
    repo = RobotRepository(session)
    repo.update(UUID(robot_id), RobotUpdate(status=RobotStatus.READY_TO_CONNECT))

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            logger.info(f"Received message from robot {robot_id}: {data}")
            handler = handlers.get(msg_type)
            if handler:
                await handler(websocket, data, repo)
            else:
                error = WebSocketErrorMsg(
                    type="error", error=f"Unknown message type: {msg_type}"
                )
                await websocket.send_json(error.model_dump())
    except WebSocketDisconnect:
        manager.disconnect_robot(robot_id)
        repo.update(UUID(robot_id), RobotUpdate(status=RobotStatus.DISCONNECTED))
