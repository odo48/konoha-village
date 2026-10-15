// ---------------------------------------------------------------------------
// The board <-> orchestrator contract.
//
// This is the single seam between the Konoha board and any backend. It is
// deliberately transport-light: an append-only event stream is the source of
// truth (clauboard's model), plus full-object upserts and a one-time snapshot
// on connect (Agent Works' SSE + REST model). Both the mock server and the
// in-process mock adapter speak exactly this contract, so swapping in a real
// Agent Works engine means implementing the server side of these messages.
// ---------------------------------------------------------------------------

import type { Project, Agent, WorkItem, BoardEvent } from "./types";

// Full state, delivered once when a client connects (GET /api/snapshot, or the
// first WS message).
export interface BoardSnapshot {
  projects: Project[];
  agents: Agent[];
  workItems: WorkItem[];
  events: BoardEvent[];
}

// Server -> client. A discriminated union so the client can apply each kind.
// The event `id` doubles as the stream cursor: it is monotonic, so the highest
// event id a client holds is its resume point.
export type ServerMessage =
  | { type: "snapshot"; snapshot: BoardSnapshot } // full state (cold start / gap too large)
  | {
      type: "resume";
      sinceId: number;
      events: BoardEvent[];
      agents: Agent[];
      workItems: WorkItem[];
      projects: Project[];
    } // only the missed event tail, plus a fresh re-sync of the small collections
  | { type: "event"; event: BoardEvent }
  | { type: "agent"; agent: Agent } // upsert one agent
  | { type: "workItem"; workItem: WorkItem }; // upsert one work item

// Client -> server.
export type ClientMessage =
  // Handshake: the first frame after connect. `since` is the highest event id
  // the client already holds (null on a cold start). The server answers with a
  // `snapshot` (cold start, or the gap is older than its replay buffer) or a
  // `resume` carrying only events newer than `since`.
  | { type: "hello"; since: number | null }
  // The write path (clauboard's "send follow-up instructions").
  | { type: "instruct"; agentId: string; text: string };

// Highest event id in a list (0 if empty) — the cursor helper.
export function maxEventId(events: BoardEvent[]): number {
  return events.reduce((m, e) => (e.id > m ? e.id : m), 0);
}

// Union two event lists by id, sorted ascending, capped to the most recent
// `cap`. Robust to duplicates and out-of-order arrival.
export function mergeEvents(
  a: BoardEvent[],
  b: BoardEvent[],
  cap: number,
): BoardEvent[] {
  const byId = new Map<number, BoardEvent>();
  for (const e of a) byId.set(e.id, e);
  for (const e of b) byId.set(e.id, e);
  return [...byId.values()].sort((x, y) => x.id - y.id).slice(-cap);
}

// Connection lifecycle as the UI sees it.
export type ConnectionStatus =
  | "mock" // running on the in-process simulator
  | "connecting"
  | "live" // connected to a real orchestrator, snapshot received
  | "reconnecting"
  | "closed";

export interface AdapterHandlers {
  onMessage: (msg: ServerMessage) => void;
  onStatus?: (status: ConnectionStatus) => void;
}

// What the board depends on. Two implementations: MockAdapter, WsAdapter.
export interface OrchestratorAdapter {
  readonly kind: "mock" | "ws";
  start(handlers: AdapterHandlers): void;
  stop(): void;
  instruct(agentId: string, text: string): void;
}

// Reduce a server message into the current snapshot (used by the client hook).
export function applyMessage(
  prev: BoardSnapshot,
  msg: ServerMessage,
  eventCap = 150,
): BoardSnapshot {
  switch (msg.type) {
    case "snapshot":
      return msg.snapshot;
    case "resume": {
      // Merge the replayed tail with what we hold, deduped by id and sorted,
      // then re-sync the small collections wholesale (cheap, and covers
      // agent/workItem drift that happened while disconnected). Merging by id
      // (rather than appending only-newer) is correct even if a live event for
      // the gap already arrived out of order.
      const merged = mergeEvents(prev.events, msg.events, eventCap);
      return {
        projects: msg.projects,
        agents: msg.agents,
        workItems: msg.workItems,
        events: merged,
      };
    }
    case "event": {
      const last = prev.events[prev.events.length - 1];
      if (last && last.id === msg.event.id) return prev; // ignore an immediate dup
      return { ...prev, events: [...prev.events, msg.event].slice(-eventCap) };
    }
    case "agent": {
      const i = prev.agents.findIndex((a) => a.id === msg.agent.id);
      const agents =
        i === -1
          ? [...prev.agents, msg.agent]
          : prev.agents.map((a) => (a.id === msg.agent.id ? msg.agent : a));
      return { ...prev, agents };
    }
    case "workItem": {
      const i = prev.workItems.findIndex((w) => w.id === msg.workItem.id);
      const workItems =
        i === -1
          ? [...prev.workItems, msg.workItem]
          : prev.workItems.map((w) =>
              w.id === msg.workItem.id ? msg.workItem : w,
            );
      return { ...prev, workItems };
    }
    default:
      return prev;
  }
}
