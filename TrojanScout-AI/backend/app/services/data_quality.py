
from app.models.player import Player


STAT_FIELDS = [
    "points_per_game",
    "assists_per_game",
    "rebounds_per_game",
    "field_goal_percentage",
    "three_point_percentage",
    "steals_per_game",
    "blocks_per_game",
    "turnovers_per_game",
]

# Broad screening thresholds for prototype testing.
# These are not validated scouting standards.
SCREENING_LIMITS = {
    "points_per_game": 45,
    "assists_per_game": 15,
    "rebounds_per_game": 25,
    "field_goal_percentage": 100,
    "three_point_percentage": 100,
    "steals_per_game": 7,
    "blocks_per_game": 6,
    "turnovers_per_game": 10,
}


def validate_player_data(player: Player) -> dict:
    missing_fields = []
    warnings = []
    available_count = 0

    for field in STAT_FIELDS:
        value = getattr(player, field, None)

        if value is None:
            missing_fields.append(field)
            continue

        available_count += 1

        if value < 0:
            warnings.append({
                "field": field,
                "value": value,
                "message": "Negative statistic detected.",
                "severity": "error",
            })

        elif value > SCREENING_LIMITS[field]:
            warnings.append({
                "field": field,
                "value": value,
                "message": (
                    "Value exceeds the prototype screening "
                    "threshold. Verify the source data."
                ),
                "severity": "warning",
            })

    completeness = round(
        100 * available_count / len(STAT_FIELDS),
        2,
    )

    if completeness < 75:
        quality = "low"
    elif warnings:
        quality = "review_required"
    elif completeness < 100:
        quality = "moderate"
    else:
        quality = "high"

    return {
        "player_id": player.id,
        "player_name": player.name,
        "data_completeness": completeness,
        "quality": quality,
        "missing_fields": missing_fields,
        "warnings": warnings,
    }


def validate_roster_data(players: list[Player]) -> dict:
    results = [
        validate_player_data(player)
        for player in players
    ]

    flagged = [
        result
        for result in results
        if result["warnings"] or result["missing_fields"]
    ]

    average_completeness = (
        round(
            sum(
                result["data_completeness"]
                for result in results
            ) / len(results),
            2,
        )
        if results
        else 0.0
    )

    return {
        "total_players": len(results),
        "average_completeness": average_completeness,
        "flagged_players": len(flagged),
        "players": results,
    }
