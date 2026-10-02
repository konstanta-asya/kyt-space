from fastapi import FastAPI

from app.modules.auth.router import router as auth_router
from app.modules.equipment.router import router as equipment_router
from app.modules.rooms.router import router as rooms_router

app = FastAPI(title="KYT Space API")


@app.get("/health")
def health():
    return {"status": "ok"}


# Модулі підключаються тут по мірі готовності.
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(rooms_router, prefix="/rooms", tags=["rooms"])
app.include_router(equipment_router, prefix="/equipment", tags=["equipment"])
