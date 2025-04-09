# server.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from typing import Dict
from asyncio import Queue
import json
import asyncio


app = FastAPI()

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Store connected clients and their message queues
connected_clients: Dict[str, WebSocket] = {}
direction_queues: Dict[str, Queue] = {}
connected_state: Dict[str, WebSocket] = {}

@app.get("/")
async def root():
    return FileResponse('static/index.html')

@app.put("/direction/{direction}")
async def direction(direction: str):
    for client_id, queue in direction_queues.items():
        await queue.put({"direction": direction})
    return {"direction": direction}

async def generate_events():
    # if len(connected_state) > 0:
    if connected_state['dummy']:
        print("Enabling buttons")
        yield "data: enable_buttons\n\n"
        await asyncio.sleep(2)
    else:
        print("Disabling buttons")
        yield "data: disable_buttons\n\n"
        await asyncio.sleep(2)

@app.get("/events")
async def events():
    return StreamingResponse(generate_events(), media_type="text/event-stream")

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    connected_clients[client_id] = websocket
    # Create a message queue for this client
    direction_queues[client_id] = Queue()
    while True:
        response = await websocket.receive_text()
        if response == "Hello, Server! Client connected.":
            await websocket.send_json({"command":"enable_buttons"})
            break
    connected_state['dummy'] = True
    print(f"{client_id} connected.")

    try:
        while True:
            # Check for new direction commands
            direction_data = await direction_queues[client_id].get()
            # Send the direction to the websocket client
            await websocket.send_json(direction_data)

    except WebSocketDisconnect:
        print(f"{client_id} disconnected.")
        del connected_clients[client_id]
        del direction_queues[client_id]
        connected_state['dummy'] = False


