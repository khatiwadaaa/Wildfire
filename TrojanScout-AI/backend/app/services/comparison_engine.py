
from dataclasses import dataclass

from app.models.player import Player


METRICS = {
    "points_per_game": "Scoring",
    "assists_per_game": "Playmaking",
    "rebounds_per_game": "Rebounding",
    "field_goal_percentage": "Field Goal %",
    "three_point_percentage": "Three Point %",
    "steals_per_game": "Steals",
    "blocks_per_game": "Blocks",
    "turnovers_per_game": "Turnovers",
}

DEFAULT_WEIGHTS = {
    "points_per_game": 0.25,
    "assists_per_game": 0.20,
    "rebounds_per_game": 0.15,
    "field_goal_percentage": 0.10,
    "three_point_percentage": 0.15,
    "steals_per_game": 0.05,
    "blocks_per_game": 0.05,
    "turnovers_per_game": 0.05,
}

# Heuristic normalization scales, not population statistics.
SCALES = {
    "points_per_game": 20,
    "assists_per_game": 8,
    "rebounds_per_game": 10,
    "field_goal_percentage": 30,
    "three_point_percentage": 30,
    "steals_per_game": 3,
    "blocks_per_game": 3,
    "turnovers_per_game": 4,
}


@dataclass
class ComparisonResult:
    player_id: int
    name: str
    school: str
    position: str
    similarity_score: float | None
    data_coverage: float
    strengths: list[str]
    differences: list[str]


def compare_players(
    target: Player,
    recruit: Player,
    weights: dict[str, float] | None = None,
) -> ComparisonResult:
    weights = weights or DEFAULT_WEIGHTS

    total_weight = sum(weights.values())
    available_weight = 0.0
    weighted_similarity = 0.0
    strengths = []
    differences = []

    for metric, label in METRICS.items():
        weight = weights.get(metric, 0)

        if weight <= 0:
            continue

        target_value = getattr(target, metric)
        recruit_value = getattr(recruit, metric)

        if target_value is None or recruit_value is None:
            continue

        available_weight += weight

        distance = abs(target_value - recruit_value) / SCALES[metric]
        metric_similarity = max(0.0, 1.0 - distance)

        weighted_similarity += metric_similarity * weight

        if metric_similarity >= 0.85:
            strengths.append(f"Similar {label.lower()}")

        if metric_similarity < 0.60:
            differences.append(
                f"{label}: target {target_value}, recruit {recruit_value}"
            )

    coverage = (
        available_weight / total_weight
        if total_weight > 0 else 0
    )

    score = (
        round(weighted_similarity / available_weight * 100, 1)
        if available_weight > 0 else None
    )

    return ComparisonResult(
        player_id=recruit.id,
        name=recruit.name,
        school=recruit.school,
        position=recruit.position,
        similarity_score=score,
        data_coverage=round(coverage * 100, 1),
        strengths=strengths,
        differences=differences,
    )
