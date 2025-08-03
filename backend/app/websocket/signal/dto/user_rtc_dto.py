from pydantic import BaseModel


class WebSocketBaseMsg(BaseModel):
    type: str


class WebSocketErrorMsg(WebSocketBaseMsg):
    error: str
    detail: str | None = None


# Signaling Messages
class GetRobotListMsg(WebSocketBaseMsg):
    user_id: str


class RobotInfo(BaseModel):
    robot_id: str
    state: str


class RobotListMsg(WebSocketBaseMsg):
    robots: list[RobotInfo]


class SendSdpOfferMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str
    sdp_offer: str


class ReceiveSdpOfferMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str
    sdp_offer: str


class SendIceCandidateMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str
    ice_candidate: dict


class ReceiveIceCandidateMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str
    ice_candidate: dict


class SendClosePeerConnectionMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str


# Login Flow Message
class ForceLogoutMsg(WebSocketBaseMsg):
    message: str
