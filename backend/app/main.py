from fastapi import FastAPI

app = FastAPI(title="KYT Space API")


@app.get("/health")
def health():
    return {"status": "ok"}


# Модулі підключаються тут по мірі готовності, напр.:
# from app.modules.auth.router import router as auth_router
# app.include_router(auth_router, prefix="/auth", tags=["auth"])
