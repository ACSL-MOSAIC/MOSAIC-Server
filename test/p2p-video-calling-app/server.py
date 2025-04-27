from fastapi import FastAPI
from fastapi_socketio import SocketManager
from starlette.responses import FileResponse
from starlette.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="./static/public"), name="static")
socket_manager = SocketManager(app=app, mount_location="/ws")


connected_users = []


@socket_manager.on("connect")
async def connect(sid, environ):
    """Handle initial connection of socket user."""
    connected_users.append(sid)
    print(f"User {sid} connected")


@socket_manager.on("disconnect")
async def disconnect(sid):
    """Handle disconnection."""
    connected_users.remove(sid)
    await socket_manager.emit("update-user-list", {"userIds": connected_users})
    print(f"User {sid} disconnected")


@socket_manager.on("retrieveSID")
async def retrieve_sid(sid):
    """Send SID to client."""
    await socket_manager.emit("retrieveSID", {"sid": sid}, to=sid)
    print(f"User {sid} requested SID")


@socket_manager.on("requestUserList")
async def request_user_list(sid):
    """Update list of users."""
    await socket_manager.emit("update-user-list", {"userIds": connected_users}, to=sid)
    print(f"{sid} requested user list update")


@socket_manager.on("mediaOffer")
async def media_offer(sid, data):
    """Handle offer to communicate."""
    await socket_manager.emit(
        "mediaOffer", {"from": data["from"], "offer": data["offer"]}, to=data["to"]
    )
    print(f"Media Offer from {data['from']}")


@socket_manager.on("mediaAnswer")
async def media_answer(sid, data):
    """Handle media answer."""
    await socket_manager.emit(
        "mediaAnswer", {"from": data["from"], "answer": data["answer"]}, to=data["to"]
    )
    print(f"Media Answer from {data['from']}")


@socket_manager.on("iceCandidate")
async def ice_candidate(sid, data):
    """Handle Ice Candidate."""
    await socket_manager.emit(
        "remotePeerIceCandidate", {"candidate": data["candidate"]}, to=data["to"]
    )
    print(f"Ice candidate for  {data['to']}")


@app.get("/")
def read_root():
    return FileResponse("./static/public/index.html")
