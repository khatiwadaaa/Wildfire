
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.player import Player
from app.schemas.player import PlayerCreate, PlayerResponse

router = APIRouter(prefix="/players", tags=["Players"])


@router.post("", response_model=PlayerResponse, status_code=201)
def create_player(
    player_data: PlayerCreate,
    db: Session = Depends(get_db),
):
    player = Player(**player_data.model_dump())

    db.add(player)
    db.commit()
    db.refresh(player)

    return player


@router.get("", response_model=list[PlayerResponse])
def list_players(db: Session = Depends(get_db)):
    return db.scalars(select(Player)).all()


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(
    player_id: int,
    db: Session = Depends(get_db),
):
    player = db.get(Player, player_id)

    if player is None:
        raise HTTPException(
            status_code=404,
            detail="Player not found",
        )

    return player
