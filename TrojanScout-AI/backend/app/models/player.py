
from sqlalchemy import Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    name: Mapped[str] = mapped_column(String(150))
    school: Mapped[str] = mapped_column(String(150))
    position: Mapped[str] = mapped_column(String(10))

    graduation_year: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    category: Mapped[str] = mapped_column(
        String(30), default="recruit"
    )

    points_per_game: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    assists_per_game: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    rebounds_per_game: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    field_goal_percentage: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    three_point_percentage: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    steals_per_game: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    blocks_per_game: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    turnovers_per_game: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
