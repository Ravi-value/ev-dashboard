import csv
import io
import json
import os
os.makedirs("static", exist_ok=True)
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="EV Digital Twin Telemetry Server")

# Mount frontend static folder (create an empty 'static' folder for Milestone 1)
app.mount("/static", StaticFiles(directory="static"), name="static")


# Exact schema matching MATLAB payload
class TelemetryPoint(BaseModel):
    Timestamp: str
    SimTime_s: float
    OperatingMode: str
    ModeCode: int
    DC_Bus_Voltage_V: float
    Battery_Current_A: float
    Battery_Voltage_V: float
    SoC1_pct: float
    SoC2_pct: float
    SoC3_pct: float
    Avg_SoC_pct: float
    SoH_pct: float
    Power_kW: float
    Power_Loss_W: float
    Cum_Energy_kWh: float
    Tariff_Rate_INR_kWh: float
    Cum_G2V_Cost_INR: float
    Cum_V2G_Revenue_INR: float
    Net_Balance_INR: float
    Cost_Bat1_INR: float
    Cost_Bat2_INR: float
    Cost_Bat3_INR: float


# In-memory storage for the current simulation run
history: List[dict] = []
active_clients: List[WebSocket] = []


async def broadcast(message: dict):
    """Push JSON updates to all connected browsers safely."""
    text = json.dumps(message)
    for client in list(active_clients):
        try:
            await client.send_text(text)
        except Exception:
            if client in active_clients:
                active_clients.remove(client)


@app.get("/")
async def serve_dashboard():
    return FileResponse("static/index.html")


@app.post("/api/reset")
async def reset_simulation():
    history.clear()
    print("[RESET] New MATLAB simulation started. History cleared.")
    await broadcast({"type": "reset"})
    return {"status": "reset_ok"}


@app.post("/api/telemetry")
async def receive_telemetry(point: TelemetryPoint):
    data = point.model_dump()
    history.append(data)

    # Keep memory bounded (last 2,000 points)
    if len(history) > 2000:
        history.pop(0)

    print(
        f"[DATA] t={data['SimTime_s']:5.1f}s | {data['OperatingMode']:<16} | "
        f"Avg SoC={data['Avg_SoC_pct']:6.2f}% | P={data['Power_kW']:6.2f}kW | "
        f"Net=INR {data['Net_Balance_INR']:.2f}"
    )

    await broadcast({"type": "update", "data": data})
    return {"status": "ok", "points_stored": len(history)}


@app.get("/api/export/csv")
async def export_csv():
    """Download the full live session directly as CSV from the website."""
    output = io.StringIO()
    if history:
        writer = csv.DictWriter(output, fieldnames=history[0].keys())
        writer.writeheader()
        writer.writerows(history)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ev_digital_twin_telemetry.csv"},
    )


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_clients.append(websocket)
    try:
        # Send existing history immediately so new visitors see past points
        await websocket.send_text(json.dumps({"type": "history", "data": history}))
        while True:
            # Keep connection alive; ignore incoming pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_clients:
            active_clients.remove(websocket)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000)