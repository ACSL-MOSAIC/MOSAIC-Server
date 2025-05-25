from pydantic import BaseModel
from typing import List

class WebSocketBaseMsg(BaseModel):
    type: str

class WebSocketErrorMsg(WebSocketBaseMsg):
    error: str
    detail: str | None = None

class GetRobotListMsg(WebSocketBaseMsg):
    user_id: str

class RobotInfo(BaseModel):
    robot_id: str
    state: str

class RobotListMsg(WebSocketBaseMsg):
    robots: List[RobotInfo]

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

class ConnectedRobotRtcMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str

class DisconnectedRobotRtcMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str