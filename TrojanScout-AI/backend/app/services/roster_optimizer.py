
from itertools import combinations

from app.models.player import Player
from app.services.roster_analyzer import (
    BENCHMARKS,
    DEFAULT_PRIORITIES,
    METRICS,
    average_metric,
)


def evaluate_combination(
    returning: list[Player],
    recruits: tuple[Player, ...],
    priorities: dict[str, float],
):
    projected_roster = returning + list(recruits)

    metric_results = []
    total_weight = 0.0
    weighted_score = 0.0

    for metric, label in METRICS.items():
        weight = priorities.get(metric, 0.0)

        if weight <= 0:
            continue

        before = average_metric(returning, metric)
        after = average_metric(projected_roster, metric)

        # Don't invent values for missing data.
        if before is None or after is None:
            metric_results.append({
                "metric": metric,
                "label": label,
                "status": "insufficient_data",
            })
            continue

        benchmark = BENCHMARKS[metric]

        before_gap = max(0.0, benchmark - before)
        after_gap = max(0.0, benchmark - after)

        # Positive improvement means a benchmark gap
        # has been reduced.
        improvement = (before_gap - after_gap) / benchmark

        # Reward gap reduction, not excessive values.
        contribution = max(0.0, improvement)

        weighted_score += contribution * weight
        total_weight += weight

        metric_results.append({
            "metric": metric,
            "label": label,
            "before": before,
            "after": after,
            "improvement": round(improvement, 3),
            "gap_reduced": improvement > 0.001,
        })

    # This is a relative improvement score, not a
    # probability or predicted performance percentage.
    score = (
        round(100 * weighted_score / total_weight, 2)
        if total_weight > 0 else None
    )

    strengths = [
        item["label"]
        for item in metric_results
        if item.get("gap_reduced")
    ]

    weaknesses = [
        item["label"]
        for item in metric_results
        if item.get("improvement", 0) < -0.001
    ]

    return {
        "recruits": [
            {
                "id": player.id,
                "name": player.name,
                "position": player.position,
                "school": player.school,
            }
            for player in recruits
        ],
        "improvement_score": score,
        "improved_areas": strengths,
        "weakened_areas": weaknesses,
        "metric_details": metric_results,
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

    # Evaluate combinations of exactly the requested size.
    for group in combinations(recruits, max_recruits):
        result = evaluate_combination(
            returning,
            group,
            priorities,
        )
        results.append(result)

    results.sort(
        key=lambda item: (
            item["improvement_score"] is not None,
            item["improvement_score"] or 0,
        ),
        reverse=True,
    )

    return {
        "total_combinations": len(results),
        "recommended_combinations": results[:5],
        "method": "Weighted benchmark gap reduction",
        "disclaimer": (
            "This is an exploratory roster planning heuristic. "
            "High-school and college statistics are not directly "
            "equivalent. Averages do not account for playing time, "
            "competition level, or roster roles."
        ),
    }
