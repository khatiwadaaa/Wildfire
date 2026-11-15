
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.player import Player
from app.services.data_quality import (
    validate_player_data,
    validate_roster_data,
)

router = APIRouter(
    prefix="/data-quality",
    tags=["Data Quality"],
)


@router.get("/players/{player_id}")
def check_player(
    player_id: int,
    db: Session = Depends(get_db),
):
    player = db.get(Player, player_id)

    if player is None:
        raise HTTPException(
            status_code=404,
            detail="Player not found",
        )

    return validate_player_data(player)


@router.get("/players")
def check_all_players(
    db: Session = Depends(get_db),
):
    players = db.scalars(
        select(Player).order_by(Player.id)
    ).all()

    return validate_roster_data(players)
