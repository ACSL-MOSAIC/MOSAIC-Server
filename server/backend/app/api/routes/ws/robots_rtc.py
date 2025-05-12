from app.schemas.robot import RobotStatus
from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlmodel import Session
from app.repositories.robot_repository import RobotRepository
from app.schemas import RobotUpdate
from app.api.deps import get_db
import uuid
from app.api.routes.ws.dto.robot_rtc_dto import (
    WebSocketBaseMsg, WebSocketErrorMsg, SendSdpAnswerMsg, ReceiveSdpAnswerMsg,
    SendIceCandidateMsg, ReceiveIceCandidateMsg
)
from pydantic import ValidationError
from app.api.routes.ws import manager

async def handle_send_sdp_answer(websocket: WebSocket, data: dict):
    try:
        msg = SendSdpAnswerMsg(**data)
    except ValidationError as e:
        error = WebSocketErrorMsg(type="error", error="Invalid send_sdp_answer message", detail=str(e))
        await websocket.send_json(error.model_dump())
        return

    user_ws = manager.get_user_connection(msg.user_id)
    if user_ws is None:
        error = WebSocketErrorMsg(type="error", error="User websocket not found", detail=f"user_id: {msg.user_id}")
        await websocket.send_json(error.model_dump())
        return

    receive_msg = ReceiveSdpAnswerMsg(
        type="receive_sdp_answer",
        user_id=msg.user_id,
        robot_id=msg.robot_id,
        sdp_answer=msg.sdp_answer
    )
    await manager.send_to_user(receive_msg.model_dump(), msg.user_id)

async def handle_send_ice_candidate(websocket: WebSocket, data: dict):
    try:
        msg = SendIceCandidateMsg(**data)
    except ValidationError as e:
        error = WebSocketErrorMsg(type="error", error="Invalid send_ice_candidate message", detail=str(e))
        await websocket.send_json(error.model_dump())
        return

    user_ws = manager.get_user_connection(msg.user_id)
    if user_ws is None:
        error = WebSocketErrorMsg(type="error", error="User websocket not found", detail=f"user_id: {msg.user_id}")
        await websocket.send_json(error.model_dump())
        return

    receive_msg = ReceiveIceCandidateMsg(
        type="receive_ice_candidate",
        user_id=msg.user_id,
        robot_id=msg.robot_id,
        ice_candidate=msg.ice_candidate
    )
    await manager.send_to_user(receive_msg.model_dump(), msg.user_id)

handlers = {
    "send_sdp_answer": handle_send_sdp_answer,
    "send_ice_candidate": handle_send_ice_candidate,
}

# 로봇 웹소켓 엔드포인트 (query_params로 robot_id 전달 받음)
async def robot_rtc_endpoint(websocket: WebSocket, session: Session = Depends(get_db)):
    robot_id = websocket.query_params.get("robot_id")
    if not robot_id:
        await websocket.close(code=4000)
        return

    await manager.connect_robot(websocket, robot_id)
    repo = RobotRepository(session)
    repo.update(robot_id, RobotUpdate(status=RobotStatus.READY_TO_CONNECT))
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            handler = handlers.get(msg_type)
            if handler:
                await handler(websocket, data)
            else:
                error = WebSocketErrorMsg(type="error", error=f"Unknown message type: {msg_type}")
                await websocket.send_json(error.model_dump())
    except WebSocketDisconnect:
        manager.disconnect_robot(robot_id) 
        repo.update(robot_id, RobotUpdate(status=RobotStatus.DISCONNECTED))