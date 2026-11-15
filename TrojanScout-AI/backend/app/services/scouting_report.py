from app.services.data_quality import validate_roster_data
from app.models.player import Player
from app.services.roster_analyzer import (
    DEFAULT_PRIORITIES,
    analyze_roster,
)
from app.services.roster_optimizer import optimize_recruits


def build_combination_report(
    combination: dict,
    returning: list[Player],
):
    recruits = combination["recruits"]
    names = " and ".join(
        recruit["name"] for recruit in recruits
    )

    filled = combination["filled_positions"]
    improved = combination["improved_areas"]
    weakened = combination["weakened_areas"]

    remaining_positions = [
        position
        for position in ("PG", "SG", "SF", "PF", "C")
        if position not in {
            player.position for player in returning
        }
        and position not in {
            recruit["position"] for recruit in recruits
        }
    ]

    summary = (
        f"{names} received a roster fit score of "
        f"{combination['fit_score']:.2f}/100 under "
        "TrojanScout's prototype scoring model."
    )

    reasons = []

    if filled:
        reasons.append(
            "This combination adds coverage at "
            + ", ".join(filled)
            + "."
        )

    if improved:
        reasons.append(
            "The combination reduces modeled benchmark "
            "gaps in "
            + ", ".join(improved)
            + "."
        )

    if weakened:
        reasons.append(
            "The combined player averages increase "
            "the modeled shortfall in "
            + ", ".join(weakened)
            + "."
        )

    if remaining_positions:
        reasons.append(
            "The sample roster still lacks primary "
            "position coverage at "
            + ", ".join(remaining_positions)
            + "."
        )

    return {
        "recruits": recruits,
        "fit_score": combination["fit_score"],
        "summary": summary,
        "reasons": reasons,
        "strengths": improved,
        "concerns": weakened,
        "filled_positions": filled,
        "remaining_position_gaps": remaining_positions,
        "score_breakdown": combination["score_breakdown"],
    }


def generate_scouting_report(
    graduating: list[Player],
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

    analysis = analyze_roster(
        graduating,
        returning,
        priorities,
    )

    optimization = optimize_recruits(
        returning,
        recruits,
        max_recruits,
        priorities,
    )

    reports = [
        build_combination_report(
            combination,
            returning,
        )
        for combination in optimization[
            "recommended_combinations"
        ]
    ]
    data_quality = validate_roster_data(
        graduating + returning + recruits
    )


    return {
        "report_title": "TrojanScout Recruiting Report",
        "roster_summary": {
            "graduating_players": len(graduating),
            "returning_players": len(returning),
            "available_recruits": len(recruits),
            "recruiting_spots": max_recruits,
        },
        "team_needs": analysis["metric_gaps"],
        "recommendations": reports,
        "data_quality": data_quality,
        "methodology": (
            "Reports are generated from roster data, "
            "position coverage, and weighted benchmark "
            "gap analysis. They do not include automated "
            "video skill assessments."
        ),
        "limitations": [
            "High-school and college statistics are not "
            "directly comparable.",
            "Scores are heuristic, not predictions.",
            "Position coverage considers primary "
            "positions only.",
            "The model does not account for playing "
            "time or competition strength.",
        ],
    }
