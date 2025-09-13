from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from database.connection import get_db
import asyncio
import json
from datetime import datetime

router = APIRouter(prefix="/ws", tags=["websocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/analytics/{profile_id}")
async def websocket_endpoint(websocket: WebSocket, profile_id: int):
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(5)
            
            # Here you would fetch latest data from database
            data = {
                "type": "update",
                "profile_id": profile_id,
                "timestamp": datetime.now().isoformat(),
                "latest_clicks": 0  # Fetch real data here
            }
            
            await websocket.send_text(json.dumps(data))
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)