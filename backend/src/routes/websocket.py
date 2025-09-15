from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, profile_id: int):
        await websocket.accept()
        if profile_id not in self.active_connections:
            self.active_connections[profile_id] = []
        self.active_connections[profile_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, profile_id: int):
        self.active_connections[profile_id].remove(websocket)
    
    async def broadcast_to_profile(self, message: dict, profile_id: int):
        if profile_id in self.active_connections:
            for connection in self.active_connections[profile_id]:
                await connection.send_json(message)

from fastapi import FastAPI

manager = ConnectionManager()
app = FastAPI()

@app.websocket("/ws/{profile_id}")
async def websocket_endpoint(websocket: WebSocket, profile_id: int):
    await manager.connect(websocket, profile_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.broadcast_to_profile(message, profile_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, profile_id)