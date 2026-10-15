// The mock orchestrator as an importable factory, so tests can spin one up on a
// random port and the CLI entry (mock-orchestrator.ts) can just listen. It
// implements the server side of src/lib/contract.ts.

import http from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import {
  buildSnapshot,
  simEvent,
  simAgentNudge,
  instructionEvent,
} from "../src/lib/sim";
import type {
  BoardSnapshot,
  ServerMessage,
  ClientMessage,
} from "../src/lib/contract";
import type { BoardEvent } from "../src/lib/types";

export interface OrchestratorOptions {
  /** How many recent events to keep for reconnect replay (default 500). */
  replayCap?: number;
  /** Interval between simulated activity events, ms (default 5000). */
  eventIntervalMs?: number;
  /** Interval between chakra nudges, ms (default 9000). */
  nudgeIntervalMs?: number;
}

export interface Orchestrator {
  server: http.Server;
  /** Begin the activity simulation timers. */
  start(): void;
  /** Stop timers, close sockets and the server. */
  stop(): Promise<void>;
  /** Current authoritative snapshot (read-only use). */
  getSnapshot(): BoardSnapshot;
}

export function createOrchestrator(
  opts: OrchestratorOptions = {},
): Orchestrator {
  const replayCap = Math.max(1, opts.replayCap ?? 500);
  const eventIntervalMs = opts.eventIntervalMs ?? 5000;
  const nudgeIntervalMs = opts.nudgeIntervalMs ?? 9000;

  let snapshot: BoardSnapshot = buildSnapshot();
  let nextId = snapshot.events.length;
  const clients = new Set<WebSocket>();
  const timers: ReturnType<typeof setInterval>[] = [];

  function recordEvent(event: BoardEvent): void {
    snapshot.events = [...snapshot.events, event].slice(-replayCap);
  }

  function send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  }

  function broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) ws.send(data);
    }
  }

  // Replay only the missed tail, or a full snapshot when the gap predates the
  // replay buffer. Answered for every hello (reconnect AND mid-stream resync).
  function handshake(ws: WebSocket, since: number | null): void {
    const buf = snapshot.events; // ascending by id, capped at replayCap
    const oldest = buf.length ? buf[0].id : 0;
    if (since != null && since >= oldest - 1) {
      send(ws, {
        type: "resume",
        sinceId: since,
        events: buf.filter((e) => e.id > since),
        agents: snapshot.agents,
        workItems: snapshot.workItems,
        projects: snapshot.projects,
      });
    } else {
      send(ws, { type: "snapshot", snapshot });
    }
  }

  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.url === "/api/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, agents: snapshot.agents.length }));
      return;
    }
    if (req.url === "/api/snapshot") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(snapshot));
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    clients.add(ws);
    let helloCount = 0;

    ws.on("message", (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        return;
      }
      if (msg.type === "hello") {
        helloCount += 1;
        handshake(ws, msg.since);
        return;
      }
      if (msg.type === "instruct") {
        const agent = snapshot.agents.find((a) => a.id === msg.agentId);
        const event = instructionEvent(agent, msg.text, ++nextId);
        recordEvent(event);
        broadcast({ type: "event", event });
      }
    });

    // Tolerate clients that never send hello: full snapshot after a beat.
    setTimeout(() => {
      if (helloCount === 0 && ws.readyState === ws.OPEN) {
        send(ws, { type: "snapshot", snapshot });
      }
    }, 1000);

    ws.on("close", () => clients.delete(ws));
  });

  function start(): void {
    timers.push(
      setInterval(() => {
        const event = simEvent(snapshot.agents, ++nextId);
        if (!event) return;
        recordEvent(event);
        broadcast({ type: "event", event });
      }, eventIntervalMs),
    );
    timers.push(
      setInterval(() => {
        const agent = simAgentNudge(snapshot.agents);
        if (!agent) return;
        snapshot.agents = snapshot.agents.map((a) =>
          a.id === agent.id ? agent : a,
        );
        broadcast({ type: "agent", agent });
      }, nudgeIntervalMs),
    );
  }

  function stop(): Promise<void> {
    for (const t of timers) clearInterval(t);
    timers.length = 0;
    for (const ws of clients) {
      try {
        ws.close();
      } catch {
        /* noop */
      }
    }
    clients.clear();
    return new Promise((resolve) => {
      wss.close(() => server.close(() => resolve()));
    });
  }

  return { server, start, stop, getSnapshot: () => snapshot };
}
