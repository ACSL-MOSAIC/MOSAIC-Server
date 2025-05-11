from app.schemas.robot import RobotStatus
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlmodel import Session
from app.repositories.robot_repository import RobotRepository
from app.schemas import RobotUpdate
from app.api.deps import get_session
import uuid
from app.api.routes.ws.dto.robot_rtc_dto import UpdateRobotStateMsg, WebSocketErrorMsg, SendSdpAnswerMsg, ReceiveSdpAnswerMsg, SendIceCandidateMsg, ReceiveIceCandidateMsg
from pydantic import ValidationError
from app.api.routes.session_manager import register_robot_ws, unregister_robot_ws, get_user_ws

router = APIRouter()

async def handle_send_sdp_answer(websocket: WebSocket, data: dict, repo: RobotRepository):
    try:
        msg = SendSdpAnswerMsg(**data)
    except ValidationError as e:
        error = WebSocketErrorMsg(error="Invalid send_sdp_answer message", detail=str(e))
        await websocket.send_json(error.model_dump())
        return
    user_ws = get_user_ws(msg.user_id)
    if user_ws is None:
        error = WebSocketErrorMsg(error="User websocket not found", detail=f"user_id: {msg.user_id}")
        await websocket.send_json(error.model_dump())
        return
    receive_msg = ReceiveSdpAnswerMsg(
        type="receive_sdp_answer",
        user_id=msg.user_id,
        robot_id=msg.robot_id,
        sdp_answer=msg.sdp_answer
    )
    await user_ws.send_json(receive_msg.model_dump())

async def handle_send_ice_candidate(websocket: WebSocket, data: dict, repo: RobotRepository):
    try:
        msg = SendIceCandidateMsg(**data)
    except ValidationError as e:
        error = WebSocketErrorMsg(error="Invalid send_ice_candidate message", detail=str(e))
        await websocket.send_json(error.model_dump())
        return
    user_ws = get_user_ws(msg.user_id)
    if user_ws is None:
        error = WebSocketErrorMsg(error="User websocket not found", detail=f"user_id: {msg.user_id}")
        await websocket.send_json(error.model_dump())
        return
    receive_msg = ReceiveIceCandidateMsg(
        type="receive_ice_candidate",
        user_id=msg.user_id,
        robot_id=msg.robot_id,
        ice_candidate=msg.ice_candidate
    )
    await user_ws.send_json(receive_msg.model_dump())

handlers = {
    "send_sdp_answer": handle_send_sdp_answer,
    "send_ice_candidate": handle_send_ice_candidate,
    # 추후 다른 타입 추가 가능
}


# 로봇 웹소켓 엔드포인트 (query_params로 robot_id 전달 받음)
@router.websocket("/robot")
async def robot_rtc_endpoint(websocket: WebSocket, session: Session = Depends(get_session)):
    robot_id = websocket.query_params.get("robot_id")
    if not robot_id:
        await websocket.close(code=4000)
        return
    await websocket.accept()
    register_robot_ws(robot_id, websocket)
    repo = RobotRepository(session)
    robot_uuid = uuid.UUID(robot_id)
    update = RobotUpdate(status=RobotStatus.READY_TO_CONNECT)
    repo.update(robot_uuid, update)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            handler = handlers.get(msg_type)
            if handler:
                await handler(websocket, data, repo)
            else:
                error = WebSocketErrorMsg(error=f"Unknown message type: {msg_type}")
                await websocket.send_json(error.model_dump())
    except WebSocketDisconnect:
        unregister_robot_ws(robot_id)
        try:
            robot_uuid = uuid.UUID(robot_id)
            update = RobotUpdate(status=RobotStatus.DISCONNECTED)
            repo.update(robot_uuid, update)
        except Exception:
            pass 