
from collections import Counter
from itertools import combinations
from math import comb

from app.models.player import Player
from app.services.roster_analyzer import (
    BENCHMARKS,
    DEFAULT_PRIORITIES,
    METRICS,
    average_metric,
)


POSITIONS = ("PG", "SG", "SF", "PF", "C")

# Prototype depth target, adjustable later by coaches.
MIN_POSITION_DEPTH = 1

STAT_WEIGHT = 0.70
POSITION_WEIGHT = 0.25
DATA_WEIGHT = 0.05


def calculate_statistical_fit(
    returning: list[Player],
    recruits: tuple[Player, ...],
    priorities: dict[str, float],
):
    combined = returning + list(recruits)

    weighted_change = 0.0
    evaluated_weight = 0.0
    available_metrics = 0
    metric_details = []

    for metric, label in METRICS.items():
        weight = priorities.get(metric, 0.0)

        if weight <= 0:
            continue

        before = average_metric(returning, metric)
        after = average_metric(combined, metric)

        if before is None or after is None:
            metric_details.append({
                "metric": metric,
                "label": label,
                "status": "insufficient_data",
            })
            continue

        available_metrics += 1
        evaluated_weight += weight

        benchmark = BENCHMARKS[metric]

        before_gap = max(0.0, benchmark - before)
        after_gap = max(0.0, benchmark - after)

        improvement = (
            before_gap - after_gap
        ) / benchmark

        # Penalize declines as well as reward improvements.
        weighted_change += improvement * weight

        metric_details.append({
            "metric": metric,
            "label": label,
            "before": before,
            "after": after,
            "improvement": round(improvement, 3),
            "gap_reduced": improvement > 0.001,
        })

    if evaluated_weight == 0:
        statistical_fit = 0.0
    else:
        # A neutral change maps to 0.5.
        # Positive changes increase fit; declines reduce it.
        normalized_change = weighted_change / evaluated_weight
        statistical_fit = max(
            0.0,
            min(1.0, 0.5 + normalized_change),
        )

    data_coverage = (
        available_metrics /
        sum(1 for weight in priorities.values() if weight > 0)
        if any(weight > 0 for weight in priorities.values())
        else 0.0
    )

    return statistical_fit, data_coverage, metric_details


def calculate_position_fit(
    returning: list[Player],
    recruits: tuple[Player, ...],
):
    before_counts = Counter(
        player.position for player in returning
    )
    after_counts = Counter(
        player.position for player in returning + list(recruits)
    )

    missing_before = {
        position
        for position in POSITIONS
        if before_counts[position] < MIN_POSITION_DEPTH
    }

    if not missing_before:
        return 1.0, []

    filled = [
        position
        for position in sorted(missing_before)
        if after_counts[position] >= MIN_POSITION_DEPTH
    ]

    return len(filled) / len(missing_before), filled


def evaluate_combination(
    returning: list[Player],
    recruits: tuple[Player, ...],
    priorities: dict[str, float],
):
    statistical_fit, data_coverage, metrics = (
        calculate_statistical_fit(
            returning,
            recruits,
            priorities,
        )
    )

    position_fit, filled_positions = (
        calculate_position_fit(returning, recruits)
    )

    final_score = 100 * (
        STAT_WEIGHT * statistical_fit
        + POSITION_WEIGHT * position_fit
        + DATA_WEIGHT * data_coverage
    )

    improved = [
        item["label"]
        for item in metrics
        if item.get("improvement", 0) > 0.001
    ]

    weakened = [
        item["label"]
        for item in metrics
        if item.get("improvement", 0) < -0.001
    ]

    return {
        "recruits": [
            {
                "id": player.id,
                "name": player.name,
                "school": player.school,
                "position": player.position,
            }
            for player in recruits
        ],
        "fit_score": round(final_score, 2),
        "score_breakdown": {
            "statistical_fit": round(
                statistical_fit * 100, 2
            ),
            "position_fit": round(
                position_fit * 100, 2
            ),
            "data_coverage": round(
                data_coverage * 100, 2
            ),
        },
        "filled_positions": filled_positions,
        "improved_areas": improved,
        "weakened_areas": weakened,
        "metric_details": metrics,
    }


def optimize_recruits(
    returning: list[Player],
    recruits: list[Player],
    max_recruits: int,
    priorities: dict[str, float] | None = None,
):
    priorities = (
        DEFAULT_PRIORITIES.copy()
        if priorities is None
        else priorities
    )

    results = []

    for group in combinations(recruits, max_recruits):
        results.append(
            evaluate_combination(
                returning,
                group,
                priorities,
            )
        )

    results.sort(
        key=lambda item: item["fit_score"],
        reverse=True,
    )

    return {
        "total_combinations": comb(
            len(recruits),
            max_recruits,
        ),
        "recommended_combinations": results[:5],
        "method": "Position-aware weighted roster fit",
        "disclaimer": (
            "Scores are exploratory heuristics, not "
            "predictions of college performance. "
            "High-school and college statistics are "
            "not directly comparable."
        ),
    }
