from app.routers.videos import router as videos_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.comparisons import router as comparisons_router
from app.database import Base, engine
from app.models.player import Player
from app.routers.players import router as players_router
from app.routers.roster import router as roster_router
from app.routers.data_quality import router as data_quality_router
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TrojanScout AI API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(roster_router)
app.include_router(players_router)
app.include_router(videos_router)
app.include_router(comparisons_router)
app.include_router(data_quality_router)
@app.get("/")
def root():
    return {
        "name": "TrojanScout AI",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
