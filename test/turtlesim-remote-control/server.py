from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Dict
import json


app = FastAPI()

# Mount the static directory
app.mount("/static", StaticFiles(directory="./static/public"), name="static")

connected_users: Dict[str, WebSocket] = {}
connected_robots: Dict[str, WebSocket] = {}


@app.get("/")
def root():
    return FileResponse("./static/public/index.html")


@app.websocket("/ws/control/{user_id}")
async def websocket_control_endpoint(websocket: WebSocket, user_id: str):
    if user_id in connected_users:
        await websocket.close(code=1000, reason="User already connected")
        return

    await websocket.accept()
    connected_users[user_id] = websocket
    print(f"Connected user {user_id}")

    while True:
        try:
            data = await websocket.receive_text()
            json_data = json.loads(data)
            if 'type' not in json_data:
                print("Invalid message format")
                continue

            message_type = json_data['type']
            if message_type == 'get_robot_list':
                await handle_get_robot_list(websocket)
            elif message_type == 'send_sdp_offer':
                await handle_send_sdp_offer(user_id, json_data['robot_id'], json_data['sdp_offer'])
            elif message_type == 'send_ice_candidate':
                await handle_send_ice_candidate_to_robot(user_id, json_data['robot_id'], json_data['ice_candidate'])

        except WebSocketDisconnect:
            del connected_users[user_id]
            print(f"User {user_id} disconnected")
            break
        except Exception as e:
            print(f"Error: {e}")
            break


async def handle_get_robot_list(user_ws: WebSocket):
    """Handle request to get the list of connected robots."""
    robot_list = list(connected_robots.keys())

    await user_ws.send_json({
        'type': 'robot_list',
        'robots': robot_list
    })
    return {"robots": robot_list}


async def handle_send_sdp_offer(user_id: str, robot_id: str, sdp_offer: str):
    """Handle sending SDP offer to a specific robot."""
    if robot_id in connected_robots:
        robot_ws = connected_robots[robot_id]
        await robot_ws.send_json({
            'type': 'receive_sdp_offer',
            'user_id': user_id,
            'robot_id': robot_id,
            'sdp_offer': sdp_offer,
        })
    else:
        print(f"Robot {robot_id} not connected.")


async def handle_send_ice_candidate_to_robot(user_id: str, robot_id: str, ice_candidate):
    """Handle sending ICE candidate to a specific robot."""
    if robot_id in connected_robots:
        robot_ws = connected_robots[robot_id]
        await robot_ws.send_json({
            'type': 'receive_ice_candidate',
            'user_id': user_id,
            'robot_id': robot_id,
            'ice_candidate': ice_candidate,
        })
    else:
        print(f"Robot {robot_id} not connected.")


@app.websocket("/ws/robot/{robot_id}")
async def websocket_robot_endpoint(websocket: WebSocket, robot_id: str):
    if robot_id in connected_robots:
        await websocket.close(code=1000, reason="Robot already connected")
        return

    await websocket.accept()
    connected_robots[robot_id] = websocket
    print(f"{robot_id} connected.")

    while True:
        try:
            json_data = await websocket.receive_json()
            if 'type' not in json_data:
                print("Invalid message format")
                continue

            message_type = json_data['type']
            if message_type == 'send_sdp_answer':
                await handle_send_sdp_answer(robot_id, json_data['user_id'], json_data['sdp_answer'])
            elif message_type == 'send_ice_candidate':
                await handle_send_ice_candidate_to_control(robot_id, json_data['user_id'], json_data['ice_candidate'])

        except WebSocketDisconnect as e:
            print(e)
            del connected_robots[robot_id]
            print(f"{robot_id} disconnected.")
            break
        except Exception as e:
            print(f"Error: {e}")
            break


async def handle_send_sdp_answer(robot_id: str, user_id: str, sdp_answer: str):
    """Handle sending SDP answer to a specific user."""
    if user_id in connected_users:
        user_ws = connected_users[user_id]
        await user_ws.send_json({
            'type': 'receive_sdp_answer',
            'robot_id': robot_id,
            'user_id': user_id,
            'sdp_answer': sdp_answer,
        })
    else:
        print(f"User {user_id} not connected.")


async def handle_send_ice_candidate_to_control(robot_id: str, user_id: str, ice_candidate):
    """Handle sending ICE candidate to a specific user."""
    if user_id in connected_users:
        user_ws = connected_users[user_id]
        await user_ws.send_json({
            'type': 'receive_ice_candidate',
            'robot_id': robot_id,
            'user_id': user_id,
            'ice_candidate': ice_candidate,
        })
    else:
        print(f"User {user_id} not connected.")
