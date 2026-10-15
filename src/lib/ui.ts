import { RANKS } from "./ranks";
import type { RankId, WorkItemStatus, MissionRank, AgentStatus } from "./types";

export function rankColor(rank: RankId): string {
  return `var(${RANKS[rank].colorVar})`;
}

export const STATUS_COLOR: Record<WorkItemStatus, string> = {
  assigned: "#94a3b8",
  on_mission: "#38bdf8",
  reporting: "#eab308",
  complete: "#22c55e",
  sealed: "#ef4444",
};

export const AGENT_STATUS_COLOR: Record<AgentStatus, string> = {
  idle: "#64748b",
  deployed: "#38bdf8",
  waiting: "#eab308",
  paused: "#ef4444",
};

export const MISSION_RANK_COLOR: Record<MissionRank, string> = {
  D: "#94a3b8",
  C: "#22c55e",
  B: "#3b82f6",
  A: "#f97316",
  S: "#ef4444",
};

// Relative time like "3m ago", "1h ago", "just now".
export function relTime(fromMs: number, nowMs: number): string {
  const s = Math.max(0, Math.round((nowMs - fromMs) / 1000));
  if (s < 8) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Clock HH:MM:SS (24h)
export function clock(nowMs: number): string {
  const d = new Date(nowMs);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
