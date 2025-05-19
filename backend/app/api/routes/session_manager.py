from typing import Dict
from fastapi import WebSocket

user_ws_map: Dict[str, WebSocket] = {}
robot_ws_map: Dict[str, WebSocket] = {}

def register_user_ws(user_id: str, ws: WebSocket):
    user_ws_map[user_id] = ws

def unregister_user_ws(user_id: str):
    user_ws_map.pop(user_id, None)

def get_user_ws(user_id: str) -> WebSocket | None:
    return user_ws_map.get(user_id)

def register_robot_ws(robot_id: str, ws: WebSocket):
    robot_ws_map[robot_id] = ws

def unregister_robot_ws(robot_id: str):
    robot_ws_map.pop(robot_id, None)

def get_robot_ws(robot_id: str) -> WebSocket | None:
    return robot_ws_map.get(robot_id) 