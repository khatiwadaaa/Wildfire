
from collections import Counter

from app.models.player import Player


METRICS = {
    "points_per_game": "Scoring",
    "assists_per_game": "Playmaking",
    "rebounds_per_game": "Rebounding",
    "three_point_percentage": "Perimeter Shooting",
    "steals_per_game": "Steals",
    "blocks_per_game": "Rim Protection",
}

# Relative importance for our initial heuristic.
DEFAULT_PRIORITIES = {
    "points_per_game": 0.25,
    "assists_per_game": 0.20,
    "rebounds_per_game": 0.20,
    "three_point_percentage": 0.15,
    "steals_per_game": 0.10,
    "blocks_per_game": 0.10,
}

# Reference values are configurable heuristic benchmarks,
# not empirical college basketball averages.
BENCHMARKS = {
    "points_per_game": 15.0,
    "assists_per_game": 5.0,
    "rebounds_per_game": 8.0,
    "three_point_percentage": 35.0,
    "steals_per_game": 2.0,
    "blocks_per_game": 1.5,
}


def average_metric(players: list[Player], metric: str):
    values = [
        getattr(player, metric)
        for player in players
        if getattr(player, metric) is not None
    ]

    if not values:
        return None

    return round(sum(values) / len(values), 2)


def analyze_roster(
    graduating: list[Player],
    returning: list[Player],
    priorities: dict[str, float] | None = None,
):
    priorities = priorities or DEFAULT_PRIORITIES

    graduating_positions = Counter(
        player.position for player in graduating
    )
    returning_positions = Counter(
        player.position for player in returning
    )

    positional_gaps = []

    for position, departing_count in graduating_positions.items():
        returning_count = returning_positions.get(position, 0)

        positional_gaps.append({
            "position": position,
            "graduating_count": departing_count,
            "returning_count": returning_count,
            "needs_depth": returning_count == 0,
        })

    metric_gaps = []

    for metric, label in METRICS.items():
        departing_avg = average_metric(graduating, metric)
        returning_avg = average_metric(returning, metric)

        benchmark = BENCHMARKS[metric]
        priority = priorities.get(metric, 0)

        if returning_avg is None:
            gap_ratio = None
            severity = "unknown"
        else:
            gap_ratio = max(
                0.0,
                (benchmark - returning_avg) / benchmark,
            )

            weighted_gap = gap_ratio * priority

            if weighted_gap >= 0.10:
                severity = "high"
            elif weighted_gap >= 0.04:
                severity = "medium"
            else:
                severity = "low"

        metric_gaps.append({
            "metric": metric,
            "label": label,
            "graduating_average": departing_avg,
            "returning_average": returning_avg,
            "benchmark": benchmark,
            "priority": priority,
            "gap_ratio": (
                round(gap_ratio, 3)
                if gap_ratio is not None
                else None
            ),
            "severity": severity,
        })

    severity_order = {
        "high": 0,
        "medium": 1,
        "low": 2,
        "unknown": 3,
    }

    metric_gaps.sort(
        key=lambda item: (
            severity_order[item["severity"]],
            -item["priority"],
        )
    )

    return {
        "graduating_players": len(graduating),
        "returning_players": len(returning),
        "positional_gaps": positional_gaps,
        "metric_gaps": metric_gaps,
        "method": "Heuristic roster needs analysis",
        "disclaimer": (
            "Benchmarks are illustrative. Player averages are "
            "not team totals, and shooting percentages should "
            "not be added across players. Results do not "
            "predict future team performance."
        ),
    }
