
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.player import Player
from app.services.comparison_engine import (
    DEFAULT_WEIGHTS,
    compare_players,
)

router = APIRouter(prefix="/comparisons", tags=["Comparisons"])


class ComparisonRequest(BaseModel):
    target_player_id: int
    recruit_ids: list[int] | None = None
    weights: dict[str, float] = Field(
        default_factory=lambda: DEFAULT_WEIGHTS.copy()
    )


@router.post("")
def compare_recruits(
    request: ComparisonRequest,
    db: Session = Depends(get_db),
):
    target = db.get(Player, request.target_player_id)

    if target is None:
        raise HTTPException(
            status_code=404,
            detail="Target player not found",
        )

    if target.category != "graduating":
        raise HTTPException(
            status_code=400,
            detail="Target player must be categorized as graduating",
        )

    if (
        not request.weights
        or any(
            key not in DEFAULT_WEIGHTS
            or not isinstance(value, (int, float))
            or value < 0
            or value > 1
            for key, value in request.weights.items()
        )
        or sum(request.weights.values()) <= 0
    ):
        raise HTTPException(
            status_code=422,
            detail="Provide valid, nonnegative metric weights",
        )

    statement = select(Player).where(Player.category == "recruit")

    if request.recruit_ids is not None:
        statement = statement.where(
            Player.id.in_(request.recruit_ids)
        )

    recruits = db.scalars(statement).all()

    results = [
        compare_players(target, recruit, request.weights)
        for recruit in recruits
    ]

    results.sort(
        key=lambda result: (
            result.similarity_score is not None,
            result.similarity_score or 0,
            result.data_coverage,
        ),
        reverse=True,
    )

    return {
        "target_player": {
            "id": target.id,
            "name": target.name,
            "position": target.position,
        },
        "ranked_recruits": [
            result.__dict__ for result in results
        ],
        "method": "Weighted statistical similarity",
        "disclaimer": (
            "Scores are heuristic and do not predict "
            "college-level performance."
        ),
    }
