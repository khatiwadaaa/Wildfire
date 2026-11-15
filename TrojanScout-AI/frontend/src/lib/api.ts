import axios from "axios";
import { mockPlayers } from "../data/mockPlayers";
import { adaptPlayer } from "./playerAdapter";
import type { BackendPlayer } from "./playerAdapter";
import type {
  Player,
  VideoAnalysis,
  ComparisonResult
} from "../types";

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== "false";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 30000
});

export const playerApi = {
  async list(): Promise<Player[]> {
    if (USE_MOCK) return mockPlayers;

    const response = await api.get<BackendPlayer[]>("/players");
    return response.data.map(adaptPlayer);
  },

  async get(id: string): Promise<Player> {
    if (USE_MOCK) {
      const player = mockPlayers.find(p => p.id === id);
      if (!player) throw new Error("Player not found");
      return player;
    }

    const response = await api.get<BackendPlayer>(`/players/${id}`);
    return adaptPlayer(response.data);
  },

  async create(payload: Partial<Player>): Promise<Player> {
    if (USE_MOCK) {
      const player = {
        ...mockPlayers[0],
        ...payload,
        id: `local-${Date.now()}`
      } as Player;

      mockPlayers.unshift(player);
      return player;
    }

    const backendPayload = {
      name: payload.name,
      school: payload.school,
      position: payload.position,
      graduation_year: payload.gradYear,
      category:
        payload.category === "Prospective Recruit" ? "recruit" :
        payload.category === "Graduating Athlete" ? "graduating" :
        "current",
      points_per_game: payload.ppg,
      assists_per_game: payload.apg,
      rebounds_per_game: payload.rpg,
      field_goal_percentage: payload.fgPct,
      three_point_percentage: payload.threePct,
      steals_per_game: payload.spg,
      blocks_per_game: payload.bpg,
      turnovers_per_game: payload.topg
    };

    const response = await api.post<BackendPlayer>(
      "/players",
      backendPayload
    );

    return adaptPlayer(response.data);
  }
};

export const videoApi = {
  async analyze(
    file: File,
    selection: { x: number; y: number; timestamp: number }
  ): Promise<VideoAnalysis> {
    if (USE_MOCK) {
      return {
        id: "demo-analysis",
        filename: file.name,
        status: "Completed",
        progress: 100,
        frames: [],
        metrics: {
          distance: 2.8,
          topSpeed: 16.4,
          possessions: 18,
          minutesTracked: 4.2
        }
      };
    }

    const form = new FormData();
    form.append("file", file);
    form.append("selection", JSON.stringify(selection));

    const response = await api.post<VideoAnalysis>(
      "/videos/analyze",
      form
    );

    return response.data;
  },

  async results(id: string): Promise<VideoAnalysis> {
    const response = await api.get<VideoAnalysis>(
      `/videos/${id}/results`
    );

    return response.data;
  }
};

type BackendComparison = {
  ranked_recruits: {
    player_id: number;
    similarity_score: number;
    data_coverage: number;
    strengths: string[];
    differences: string[];
  }[];
};

export const comparisonApi = {
  async create(
    referenceId: string,
    candidateIds: string[],
    weights: Record<string, number>
  ): Promise<ComparisonResult> {
    const rawWeights = {
      points_per_game: weights.scoring ?? 0,
      assists_per_game: weights.playmaking ?? 0,
      rebounds_per_game: weights.rebounds ?? 0,
      field_goal_percentage: (weights.shooting ?? 0) / 2,
      three_point_percentage: (weights.shooting ?? 0) / 2,
      steals_per_game: (weights.defense ?? 0) / 2,
      blocks_per_game: (weights.defense ?? 0) / 2,
      turnovers_per_game: 0
    };

    const total = Object.values(rawWeights).reduce(
      (sum, value) => sum + value,
      0
    );

    if (total <= 0) {
      throw new Error("At least one weight must be positive.");
    }

    const normalizedWeights = Object.fromEntries(
      Object.entries(rawWeights).map(([key, value]) => [
        key,
        value / total
      ])
    );

    const response = await api.post<BackendComparison>(
      "/comparisons",
      {
        target_player_id: Number(referenceId),
        recruit_ids: candidateIds.map(Number),
        weights: normalizedWeights
      }
    );

    const similarityByPlayer: Record<string, number> = {};
    const explanations: ComparisonResult["explanations"] = {};

    for (const recruit of response.data.ranked_recruits) {
      const id = String(recruit.player_id);

      similarityByPlayer[id] = recruit.similarity_score;

      explanations[id] = {
        strengths: recruit.strengths,
        gaps: recruit.differences,
        missing: recruit.data_coverage < 100
          ? [`Data coverage: ${recruit.data_coverage}%`]
          : []
      };
    }

    return {
      id: `comparison-${Date.now()}`,
      referenceId,
      candidateIds,
      similarityByPlayer,
      explanations
    };
  }
};