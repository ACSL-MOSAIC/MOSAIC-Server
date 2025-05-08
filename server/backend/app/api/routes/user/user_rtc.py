from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.api.routes.user.dto.user_rtc_dto import (
    WebSocketBaseMsg, WebSocketErrorMsg, GetRobotListMsg, RobotListMsg, RobotInfo, SendSdpOfferMsg, ReceiveSdpOfferMsg, SendIceCandidateMsg, ReceiveIceCandidateMsg
)
from app.repositories.robot_repository import RobotRepository
from sqlmodel import Session
from app.api.deps import get_session
from pydantic import ValidationError
from app.api.routes.session_manager import register_user_ws, unregister_user_ws, get_robot_ws
from app.api.routes.robots.dto.robot_rtc_dto import ReceiveSdpOfferMsg

router = APIRouter()


async def handle_get_robot_list(websocket: WebSocket, data: dict, repo: RobotRepository):
    try:
        msg = GetRobotListMsg(**data)
    except ValidationError as e:
        error = WebSocketErrorMsg(type="error", error="Invalid get_robot_list message", detail=str(e))
        await websocket.send_json(error.model_dump())
        return
    try:
        robots = repo.get_by_owner(msg.user_id)
        robot_infos = [RobotInfo(robot_id=str(r.id), state=r.status) for r in robots]
        response = RobotListMsg(type="robot_list", robots=robot_infos)
        await websocket.send_json(response.model_dump())
    except Exception as e:
        error = WebSocketErrorMsg(type="error", error="Exception during robot list fetch", detail=str(e))
        await websocket.send_json(error.model_dump())

async def handle_send_sdp_offer(websocket: WebSocket, data: dict, repo: RobotRepository):
    try:
        msg = SendSdpOfferMsg(**data)
    except ValidationError as e:
        error = WebSocketErrorMsg(type="error", error="Invalid send_sdp_offer message", detail=str(e))
        await websocket.send_json(error.model_dump())
        return
    robot_ws = get_robot_ws(msg.robot_id)
    if robot_ws is None:
        error = WebSocketErrorMsg(type="error", error="Robot websocket not found", detail=f"robot_id: {msg.robot_id}")
        await websocket.send_json(error.model_dump())
        return

    receive_msg = ReceiveSdpOfferMsg(
        type="receive_sdp_offer",
        user_id=msg.user_id,
        robot_id=msg.robot_id,
        sdp_offer=msg.sdp_offer
    )
    await robot_ws.send_json(receive_msg.model_dump())

async def handle_send_ice_candidate(websocket: WebSocket, data: dict, repo: RobotRepository):
    try:
        msg = SendIceCandidateMsg(**data)
    except ValidationError as e:
        error = WebSocketErrorMsg(type="error", error="Invalid send_ice_candidate message", detail=str(e))
        await websocket.send_json(error.model_dump())
        return
    robot_ws = get_robot_ws(msg.robot_id)
    if robot_ws is None:
        error = WebSocketErrorMsg(type="error", error="Robot websocket not found", detail=f"robot_id: {msg.robot_id}")
        await websocket.send_json(error.model_dump())
        return
    # 타입을 receive_ice_candidate로 바꿔서 전달
    receive_msg = ReceiveIceCandidateMsg(
        type="receive_ice_candidate",
        user_id=msg.user_id,
        robot_id=msg.robot_id,
        ice_candidate=msg.ice_candidate
    )
    await robot_ws.send_json(receive_msg.model_dump())

handlers = {
    "get_robot_list": handle_get_robot_list,
    "send_sdp_offer": handle_send_sdp_offer,
    "send_ice_candidate": handle_send_ice_candidate,
    # 추후 메시지 타입별 핸들러 추가
}

# 유저 웹소켓 엔드포인트 (query_params로 user_id 전달 받음)
@router.websocket("/rtc")
async def user_rtc_endpoint(websocket: WebSocket, session: Session = Depends(get_session)):
    user_id = websocket.query_params.get("user_id")
    if not user_id:
        await websocket.close(code=4000)
        return
    await websocket.accept()
    register_user_ws(user_id, websocket)
    repo = RobotRepository(session)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            handler = handlers.get(msg_type)
            if handler:
                await handler(websocket, data, repo)
            else:
                error = WebSocketErrorMsg(type="error", error=f"Unknown message type: {msg_type}")
                await websocket.send_json(error.model_dump())
    except WebSocketDisconnect:
        unregister_user_ws(user_id) 