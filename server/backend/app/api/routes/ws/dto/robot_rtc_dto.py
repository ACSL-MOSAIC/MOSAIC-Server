from pydantic import BaseModel

class WebSocketBaseMsg(BaseModel):
    type: str

class UpdateRobotStateMsg(WebSocketBaseMsg):
    robot_id: str
    state: str

class WebSocketErrorMsg(WebSocketBaseMsg):
    error: str
    detail: str | None = None

class SendSdpAnswerMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str
    sdp_answer: str

class ReceiveSdpAnswerMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str
    sdp_answer: str

class SendIceCandidateMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str
    ice_candidate: dict

class ReceiveIceCandidateMsg(WebSocketBaseMsg):
    user_id: str
    robot_id: str
    ice_candidate: dict

