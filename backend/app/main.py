from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.equipment.router import router as equipment_router
from app.modules.rooms.router import router as rooms_router

app = FastAPI(title="KYT Space API")

# Фронт і бекенд на різних портах — без цього браузер блокує запити фронту.
# Токен ходить у заголовку Authorization, не в cookies, тож credentials не потрібні.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# Модулі підключаються тут по мірі готовності.
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(rooms_router, prefix="/rooms", tags=["rooms"])
app.include_router(equipment_router, prefix="/equipment", tags=["equipment"])
