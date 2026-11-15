
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal

Position = Literal["PG", "SG", "SF", "PF", "C"]
Category = Literal["current", "graduating", "recruit"]


class PlayerBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    school: str = Field(min_length=1, max_length=150)
    position: Position
    graduation_year: int | None = Field(default=None, ge=2000, le=2100)
    category: Category = "recruit"

    points_per_game: float | None = Field(default=None, ge=0)
    assists_per_game: float | None = Field(default=None, ge=0)
    rebounds_per_game: float | None = Field(default=None, ge=0)
    field_goal_percentage: float | None = Field(default=None, ge=0, le=100)
    three_point_percentage: float | None = Field(default=None, ge=0, le=100)
    steals_per_game: float | None = Field(default=None, ge=0)
    blocks_per_game: float | None = Field(default=None, ge=0)
    turnovers_per_game: float | None = Field(default=None, ge=0)


class PlayerCreate(PlayerBase):
    pass


class PlayerResponse(PlayerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
