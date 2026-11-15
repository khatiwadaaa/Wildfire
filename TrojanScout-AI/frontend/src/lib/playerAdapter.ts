
import type { Player, PlayerCategory } from "../types";

export interface BackendPlayer {
  id: number;
  name: string;
  school: string;
  position: Player["position"];
  graduation_year: number;
  category: string;
  points_per_game: number;
  assists_per_game: number;
  rebounds_per_game: number;
  field_goal_percentage: number;
  three_point_percentage: number;
  steals_per_game: number;
  blocks_per_game: number;
  turnovers_per_game: number;
}

function mapCategory(value: string): PlayerCategory {
  switch (value.toLowerCase()) {
    case "current":
      return "Current Athlete";
    case "graduating":
      return "Graduating Athlete";
    case "recruit":
      return "Prospective Recruit";
    default:
      throw new Error(`Unknown player category: ${value}`);
  }
}

export function adaptPlayer(p: BackendPlayer): Player {
  return {
    id: String(p.id),
    name: p.name,
    school: p.school,
    position: p.position,
    height: "N/A",
    gradYear: p.graduation_year,
    category: mapCategory(p.category),
    ppg: p.points_per_game,
    apg: p.assists_per_game,
    rpg: p.rebounds_per_game,
    fgPct: p.field_goal_percentage,
    threePct: p.three_point_percentage,
    spg: p.steals_per_game,
    bpg: p.blocks_per_game,
    topg: p.turnovers_per_game,
    games: 0,
    minutes: 0,
    strengths: [],
    weaknesses: [],
    notes: "No scouting notes available."
  };
}
