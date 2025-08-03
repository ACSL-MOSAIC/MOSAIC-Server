import logging
from uuid import UUID

from fastapi import Depends, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
from sqlmodel import Session

from app.api.deps import get_db
from app.repositories.robot_repository import RobotRepository
from app.schemas.robot import RobotStatus, RobotUpdate
from app.websocket.signal import manager
from app.websocket.signal.dto.user_rtc_dto import (
    GetRobotListMsg,
    ReceiveIceCandidateMsg,
    ReceiveSdpOfferMsg,
    RobotInfo,
    RobotListMsg,
    SendClosePeerConnectionMsg,
    SendIceCandidateMsg,
    SendSdpOfferMsg,
    WebSocketErrorMsg,
)

logger = logging.getLogger(__name__)


async def handle_get_robot_list(
    websocket: WebSocket, data: dict, repo: RobotRepository
) -> None:
    logger.debug(f"Handling get_robot_list request: {data}")
    try:
        msg = GetRobotListMsg(**data)
    except ValidationError as e:
        logger.error(f"Invalid get_robot_list message: {str(e)}")
        error = WebSocketErrorMsg(
            type="error", error="Invalid get_robot_list message", detail=str(e)
        )
        await websocket.send_json(error.model_dump())
        return

    try:
        robots = repo.get_by_owner(UUID(msg.user_id))
        robot_infos = [RobotInfo(robot_id=str(r.id), state=r.status) for r in robots]
        response = RobotListMsg(type="robot_list", robots=robot_infos)
        logger.debug(f"Sending robot list response: {response.model_dump()}")
        await websocket.send_json(response.model_dump())

    except Exception as e:
        logger.error(f"Exception during robot list fetch: {str(e)}")
        error = WebSocketErrorMsg(
            type="error", error="Exception during robot list fetch", detail=str(e)
        )
        await websocket.send_json(error.model_dump())


async def handle_send_sdp_offer(
    websocket: WebSocket, data: dict, repo: RobotRepository
) -> None:
    logger.info(f"Handling send_sdp_offer request: {data}")
    try:
        msg = SendSdpOfferMsg(**data)
    except ValidationError as e:
        logger.error(f"Invalid send_sdp_offer message: {str(e)}")
        error = WebSocketErrorMsg(
            type="error", error="Invalid send_sdp_offer message", detail=str(e)
        )
        await websocket.send_json(error.model_dump())
        return

    robot_ws = manager.get_robot_connection(msg.robot_id)
    if robot_ws is None:
        logger.error(f"Robot websocket not found for robot_id: {msg.robot_id}")
        error = WebSocketErrorMsg(
            type="error",
            error="Robot websocket not found",
            detail=f"robot_id: {msg.robot_id}",
        )
        await websocket.send_json(error.model_dump())
        return

    try:
        updated = repo.update(
            UUID(msg.robot_id), RobotUpdate(status=RobotStatus.CONNECTING)
        )
        if not updated:
            logger.error(
                f"Failed to update robot state to CONNECTING for robot_id: {msg.robot_id}"
            )
            error = WebSocketErrorMsg(
                type="error",
                error="Failed to update robot state to CONNECTING",
                detail=f"robot_id: {msg.robot_id}",
            )
            await websocket.send_json(error.model_dump())
            return
    except Exception as e:
        logger.error(f"Exception during robot state update: {str(e)}")
        error = WebSocketErrorMsg(
            type="error", error="Exception during robot state update", detail=str(e)
        )
        await websocket.send_json(error.model_dump())
        return

    receive_msg = ReceiveSdpOfferMsg(
        type="receive_sdp_offer",
        user_id=msg.user_id,
        robot_id=msg.robot_id,
        sdp_offer=msg.sdp_offer,
    )
    logger.info(f"Forwarding SDP offer to robot: {receive_msg.model_dump()}")
    await manager.send_to_robot(receive_msg.model_dump(), msg.robot_id)


async def handle_send_ice_candidate(
    websocket: WebSocket, data: dict, _: RobotRepository
) -> None:
    logger.info(f"Handling send_ice_candidate request: {data}")
    try:
        msg = SendIceCandidateMsg(**data)
    except ValidationError as e:
        logger.error(f"Invalid send_ice_candidate message: {str(e)}")
        error = WebSocketErrorMsg(
            type="error", error="Invalid send_ice_candidate message", detail=str(e)
        )
        await websocket.send_json(error.model_dump())
        return

    robot_ws = manager.get_robot_connection(msg.robot_id)
    if robot_ws is None:
        logger.error(f"Robot websocket not found for robot_id: {msg.robot_id}")
        error = WebSocketErrorMsg(
            type="error",
            error="Robot websocket not found",
            detail=f"robot_id: {msg.robot_id}",
        )
        await websocket.send_json(error.model_dump())
        return

    receive_msg = ReceiveIceCandidateMsg(
        type="receive_ice_candidate",
        user_id=msg.user_id,
        robot_id=msg.robot_id,
        ice_candidate=msg.ice_candidate,
    )
    logger.info(f"Forwarding ICE candidate to robot: {receive_msg.model_dump()}")
    await manager.send_to_robot(receive_msg.model_dump(), msg.robot_id)


async def handle_send_close_peer_connection(
    websocket: WebSocket, data: dict, _: RobotRepository
) -> None:
    logger.info(f"Handling send_close_peer_connection request: {data}")
    try:
        msg = SendClosePeerConnectionMsg(**data)
    except ValidationError as e:
        logger.error(f"Invalid send_close_peer_connection message: {str(e)}")
        error = WebSocketErrorMsg(
            type="error",
            error="Invalid send_close_peer_connection message",
            detail=str(e),
        )
        await websocket.send_json(error.model_dump())
        return

    robot_ws = manager.get_robot_connection(msg.robot_id)
    if robot_ws is None:
        logger.error(f"Robot websocket not found for robot_id: {msg.robot_id}")
        error = WebSocketErrorMsg(
            type="error",
            error="Robot websocket not found",
            detail=f"robot_id: {msg.robot_id}",
        )
        await websocket.send_json(error.model_dump())
        return

    logger.info("Forwarding Close Peer Connection msg to robot")
    await manager.send_to_robot(msg.model_dump(), msg.robot_id)


handlers = {
    "get_robot_list": handle_get_robot_list,
    "send_sdp_offer": handle_send_sdp_offer,
    "send_ice_candidate": handle_send_ice_candidate,
    "send_close_peer_connection": handle_send_close_peer_connection,
}


# 유저 웹소켓 엔드포인트 (query_params로 user_id 전달 받음)
async def user_rtc_endpoint(
    websocket: WebSocket, session: Session = Depends(get_db)
) -> None:
    user_id = websocket.query_params.get("user_id")
    if not user_id:
        logger.error("WebSocket connection attempt without user_id")
        await websocket.close(code=4000)
        return

    logger.info(f"New WebSocket connection from user: {user_id}")
    await manager.connect_user(websocket, user_id)
    repo = RobotRepository(session)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            handler = handlers.get(msg_type)
            if handler:
                await handler(websocket, data, repo)
            else:
                logger.error(f"Unknown message type from user {user_id}: {msg_type}")
                error = WebSocketErrorMsg(
                    type="error", error=f"Unknown message type: {msg_type}"
                )
                await websocket.send_json(error.model_dump())
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user: {user_id}")
        try:
            manager.disconnect_user(user_id)
            logger.info(f"Successfully disconnected user: {user_id}")
        except Exception as e:
            logger.error(f"Error during user disconnect: {str(e)}")
    except Exception as e:
        logger.error(
            f"Unexpected error in WebSocket connection for user {user_id}: {str(e)}"
        )
        try:
            manager.disconnect_user(user_id)
        except Exception as disconnect_error:
            logger.error(
                f"Error during user disconnect after unexpected error: {str(disconnect_error)}"
            )
