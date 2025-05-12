from fastapi import WebSocket
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect_user(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    async def connect_robot(self, websocket: WebSocket, robot_id: str):
        await websocket.accept()
        self.active_connections[robot_id] = websocket

    def disconnect_user(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    def disconnect_robot(self, robot_id: str):
        if robot_id in self.active_connections:
            del self.active_connections[robot_id]

    async def send_to_user(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            logger.info(f"Sending message to user {user_id}: {message}")
            await self.active_connections[user_id].send_json(message)

    async def send_to_robot(self, message: dict, robot_id: str):
        if robot_id in self.active_connections:
            await self.active_connections[robot_id].send_json(message)

    def get_robot_connection(self, robot_id: str) -> Optional[WebSocket]:
        return self.active_connections.get(robot_id)

    def get_user_connection(self, user_id: str) -> Optional[WebSocket]:
        return self.active_connections.get(user_id)

manager = ConnectionManager()

__all__ = ["manager"]
