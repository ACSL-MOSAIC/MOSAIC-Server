from pydantic import BaseModel


class LoginResponse(BaseModel):
    access_token: str
    existing_connection: bool = False
    message: str | None = None
    user_id: str | None = None


class DisconnectRequest(BaseModel):
    user_id: str
