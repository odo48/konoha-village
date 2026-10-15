// Shared simulation used by BOTH the in-process mock adapter (browser) and the
// standalone mock orchestrator server (node). Keeping it here means the two
// "backends" behave identically and there is one place to delete when a real
// engine is wired in. Pure JS only (Date, Math) so it runs in either runtime.

import type { Agent, BoardEvent } from "./types";
import {
  AGENTS,
  PROJECTS,
  WORK_ITEMS,
  SEED_EVENTS,
  SIM_TEMPLATES,
} from "./mock-data";
import type { BoardSnapshot } from "./contract";

export function buildSnapshot(now: number = Date.now()): BoardSnapshot {
  const events: BoardEvent[] = SEED_EVENTS.map((e, i) => ({
    id: i + 1,
    ts: new Date(now - e.agoSec * 1000).toISOString(),
    type: e.type,
    agentId: e.agentId,
    workItemId: e.workItemId,
    summary: e.summary,
  }));
  return {
    projects: structuredClone(PROJECTS),
    agents: structuredClone(AGENTS),
    workItems: structuredClone(WORK_ITEMS),
    events,
  };
}

export const SEED_EVENT_COUNT = SEED_EVENTS.length;

// A random activity event from a currently-deployed shinobi.
export function simEvent(agents: Agent[], id: number): BoardEvent | null {
  const deployed = agents.filter((a) => a.status === "deployed");
  if (deployed.length === 0) return null;
  const a = deployed[Math.floor(Math.random() * deployed.length)];
  const tmpl = SIM_TEMPLATES[Math.floor(Math.random() * SIM_TEMPLATES.length)];
  const summary =
    tmpl.summaries[Math.floor(Math.random() * tmpl.summaries.length)];
  return {
    id,
    ts: new Date().toISOString(),
    type: tmpl.type,
    agentId: a.id,
    workItemId: a.currentItemId,
    summary,
  };
}

// Gently move an agent's chakra so the roster/map visibly breathe.
export function simAgentNudge(agents: Agent[]): Agent | null {
  const deployed = agents.filter((a) => a.status === "deployed");
  if (deployed.length === 0) return null;
  const a = deployed[Math.floor(Math.random() * deployed.length)];
  const delta = Math.floor(Math.random() * 9) - 3; // -3..+5
  const chakra = Math.max(2, Math.min(100, a.chakra + delta));
  return { ...a, chakra };
}

// Event produced in response to a human instruction (the write path).
export function instructionEvent(
  agent: Agent | undefined,
  text: string,
  id: number,
): BoardEvent {
  return {
    id,
    ts: new Date().toISOString(),
    type: "answer",
    agentId: agent?.id,
    workItemId: agent?.currentItemId,
    summary: `New orders received: "${text}"`,
  };
}
