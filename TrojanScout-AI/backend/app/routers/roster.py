from app.services.scouting_report import generate_scouting_report
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.services.roster_optimizer import optimize_recruits
from app.database import get_db
from app.models.player import Player
from app.services.roster_analyzer import (
    DEFAULT_PRIORITIES,
    analyze_roster,
)

router = APIRouter(prefix="/roster", tags=["Roster"])


class RosterAnalysisRequest(BaseModel):
    graduating_player_ids: list[int] = Field(min_length=1)
    returning_player_ids: list[int] = Field(min_length=1)
    priorities: dict[str, float] | None = None


@router.post("/analyze")
def analyze_team_roster(
    request: RosterAnalysisRequest,
    db: Session = Depends(get_db),
):
    graduating_ids = request.graduating_player_ids
    returning_ids = request.returning_player_ids

    if len(set(graduating_ids)) != len(graduating_ids):
        raise HTTPException(
            status_code=422,
            detail="Duplicate graduating player IDs",
        )

    if len(set(returning_ids)) != len(returning_ids):
        raise HTTPException(
            status_code=422,
            detail="Duplicate returning player IDs",
        )

    if set(graduating_ids) & set(returning_ids):
        raise HTTPException(
            status_code=422,
            detail="A player cannot be both graduating and returning",
        )

    if request.priorities is not None:
        if (
            not request.priorities
            or any(
                key not in DEFAULT_PRIORITIES
                or value < 0
                or value > 1
                for key, value in request.priorities.items()
            )
            or sum(request.priorities.values()) <= 0
        ):
            raise HTTPException(
                status_code=422,
                detail="Invalid roster priorities",
            )

    graduating = []
    returning = []

    for player_id in graduating_ids:
        player = db.get(Player, player_id)

        if player is None:
            raise HTTPException(
                status_code=404,
                detail=f"Player {player_id} not found",
            )

        if player.category != "graduating":
            raise HTTPException(
                status_code=400,
                detail=f"Player {player_id} is not graduating",
            )

        graduating.append(player)

    for player_id in returning_ids:
        player = db.get(Player, player_id)

        if player is None:
            raise HTTPException(
                status_code=404,
                detail=f"Player {player_id} not found",
            )

        if player.category != "current":
            raise HTTPException(
                status_code=400,
                detail=f"Player {player_id} is not a returning player",
            )

        returning.append(player)

    return analyze_roster(
        graduating,
        returning,
        request.priorities,
    )

class RosterSimulationRequest(BaseModel):
    graduating_player_ids: list[int] = Field(min_length=1)
    returning_player_ids: list[int] = Field(min_length=1)
    recruit_ids: list[int] = Field(min_length=1, max_length=30)
    max_recruits: int = Field(default=2, ge=1, le=3)
    priorities: dict[str, float] | None = None


@router.post("/simulate")
def simulate_roster(
    request: RosterSimulationRequest,
    db: Session = Depends(get_db),
):
    groups = {
        "graduating": request.graduating_player_ids,
        "current": request.returning_player_ids,
        "recruit": request.recruit_ids,
    }

    all_ids = [
        player_id
        for ids in groups.values()
        for player_id in ids
    ]

    if len(all_ids) != len(set(all_ids)):
        raise HTTPException(
            status_code=422,
            detail="Player IDs must be unique across groups",
        )

    if request.max_recruits > len(request.recruit_ids):
        raise HTTPException(
            status_code=422,
            detail="Not enough recruits for requested combination size",
        )

    if request.priorities is not None:
        if (
            not request.priorities
            or any(
                key not in DEFAULT_PRIORITIES
                or not isinstance(value, (int, float))
                or value < 0
                or value > 1
                for key, value in request.priorities.items()
            )
            or sum(request.priorities.values()) <= 0
        ):
            raise HTTPException(
                status_code=422,
                detail="Invalid priorities",
            )

    players = db.scalars(
        select(Player).where(Player.id.in_(all_ids))
    ).all()

    by_id = {player.id: player for player in players}
    selected = {}

    for category, ids in groups.items():
        selected[category] = []

        for player_id in ids:
            player = by_id.get(player_id)

            if player is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Player {player_id} not found",
                )

            if player.category != category:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Player {player_id} must have "
                        f"category '{category}'"
                    ),
                )

            selected[category].append(player)

    roster_analysis = analyze_roster(
        selected["graduating"],
        selected["current"],
        request.priorities,
    )

    optimization = optimize_recruits(
        selected["current"],
        selected["recruit"],
        request.max_recruits,
        request.priorities,
    )

    return {
        "roster_analysis": roster_analysis,
        "optimization": optimization,
    }

@router.post("/report")
def create_scouting_report(
    request: RosterSimulationRequest,
    db: Session = Depends(get_db),
):
    groups = {
        "graduating": request.graduating_player_ids,
        "current": request.returning_player_ids,
        "recruit": request.recruit_ids,
    }

    all_ids = [
        player_id
        for ids in groups.values()
        for player_id in ids
    ]

    if len(all_ids) != len(set(all_ids)):
        raise HTTPException(
            status_code=422,
            detail="Player IDs must be unique",
        )

    if request.max_recruits > len(request.recruit_ids):
        raise HTTPException(
            status_code=422,
            detail="Not enough recruits",
        )

    if request.priorities is not None:
        if (
            not request.priorities
            or any(
                key not in DEFAULT_PRIORITIES
                or not isinstance(value, (int, float))
                or value < 0
                or value > 1
                for key, value in request.priorities.items()
            )
            or sum(request.priorities.values()) <= 0
        ):
            raise HTTPException(
                status_code=422,
                detail="Invalid priorities",
            )

    players = db.scalars(
        select(Player).where(Player.id.in_(all_ids))
    ).all()

    by_id = {player.id: player for player in players}
    selected = {}

    for category, ids in groups.items():
        selected[category] = []

        for player_id in ids:
            player = by_id.get(player_id)

            if player is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Player {player_id} not found",
                )

            if player.category != category:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Player {player_id} must have "
                        f"category '{category}'"
                    ),
                )

            selected[category].append(player)

    return generate_scouting_report(
        graduating=selected["graduating"],
        returning=selected["current"],
        recruits=selected["recruit"],
        max_recruits=request.max_recruits,
        priorities=request.priorities,
    )
