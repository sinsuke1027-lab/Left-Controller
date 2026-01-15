import json
import os
import asyncio
import psutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from actions import execute_action

app = FastAPI()

# Allow CORS for development (Next.js frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Security: Restrict in production, loose for local tool
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            pass
    return {"profiles": []}

@app.get("/config")
def get_config():
    return load_config()

@app.post("/config")
async def save_config(request: Request):
    """
    Saves the new configuration to config.json.
    """
    try:
        new_config = await request.json()
        # Basic validation could go here, for now trust the client
        with open(CONFIG_PATH, "w") as f:
            json.dump(new_config, f, indent=2)
        return {"status": "ok", "message": "Config saved"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Store active connections
active_connections: list[WebSocket] = []

async def broadcast_status():
    """
    Periodically fetches system status and broadcasts it to all connected clients.
    """
    while True:
        if active_connections:
            try:
                cpu = psutil.cpu_percent(interval=None)
                memory = psutil.virtual_memory().percent
                disk = psutil.disk_usage('/').percent
                
                status_data = {
                    "type": "status",
                    "data": {
                        "cpu": cpu,
                        "memory": memory,
                        "disk": disk
                    }
                }
                
                # Broadcast to all
                disconnected = []
                for connection in active_connections:
                    try:
                        await connection.send_json(status_data)
                    except Exception:
                        disconnected.append(connection)
                
                # Clean up disconnected clients
                for conn in disconnected:
                    if conn in active_connections:
                        active_connections.remove(conn)
                        
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                
        await asyncio.sleep(2)  # Update every 2 seconds

@app.on_event("startup")
async def startup_event():
    # Start the monitoring task in the background
    asyncio.create_task(broadcast_status())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print("Client connected")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received message: {message}")
            
            if "action" in message:
                action_type = message.get("action")
                params = message.get("params", [])
                execute_action(action_type, params)
                
            # Optional: Send ack back
            # await websocket.send_json({"status": "ok", "executed": message})
            
    except WebSocketDisconnect:
        print("Client disconnected")
        if websocket in active_connections:
            active_connections.remove(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    # Run on 0.0.0.0 to allow access from other devices (Tablet)
    uvicorn.run(app, host="0.0.0.0", port=8002)
