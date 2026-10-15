# Backend adapter & contract

The board never imports mock data directly. Everything flows through one seam —
`src/lib/contract.ts` — so the UI is identical whether it's driven by the
in-process simulator or a real orchestrator. This is the "combine the two ideas
at the board layer" decision made concrete:

- from **clauboard**: an append-only **event stream** is the source of truth, a
  **snapshot on connect**, and a WebSocket transport with an **adapter** seam.
- from **Agent Works**: the **data model** (projects → work items, agents,
  runs/events) and a **REST** read (`GET /api/snapshot`) alongside the stream.

## The contract (`src/lib/contract.ts`)

**Snapshot** — full state, sent once on connect (and served at `GET /api/snapshot`):

```ts
interface BoardSnapshot {
  projects: Project[];
  agents: Agent[];
  workItems: WorkItem[];
  events: BoardEvent[];
}
```

**Server → client** — a discriminated union streamed after the snapshot:

```ts
type ServerMessage =
  | { type: "snapshot"; snapshot: BoardSnapshot } // full state (cold start / gap too large)
  | { type: "resume"; sinceId; events; agents; workItems; projects } // missed tail + re-sync
  | { type: "event"; event: BoardEvent } // append to the log
  | { type: "agent"; agent: Agent } // upsert one agent
  | { type: "workItem"; workItem: WorkItem }; // upsert one work item
```

**Client → server** — the handshake and the write path:

```ts
type ClientMessage =
  | { type: "hello"; since: number | null } // first frame; resume cursor
  | { type: "instruct"; agentId: string; text: string };
```

### Reconnect & the resume cursor

The event `id` is monotonic, so it doubles as the stream cursor — the client
needs nothing extra to track. The handshake:

1. On (re)connect the client sends `{ type: "hello", since }`, where `since` is
   the highest event id it already holds (`null` on a cold start). `WsAdapter`
   keeps `lastSeq` across reconnects, so it survives a dropped socket.
2. The server keeps a bounded replay buffer (last `REPLAY_CAP` events; a real
   engine reads this tail from SQLite). It answers:
   - `since == null` → **snapshot** (cold start).
   - `since` within the buffer → **resume**: only events with `id > since`, plus
     a fresh copy of the small collections (agents/workItems/projects) to absorb
     any upserts missed while away. The board keeps its existing event history
     and appends the tail — it does **not** re-download 50k events.
   - `since` older than the buffer (a long outage) → **snapshot** fallback.

`applyMessage` handles `resume` by merging the replayed events with what it holds
(deduped and sorted by id — robust even if a live event for the gap already
arrived out of order) and replacing the small collections. This is the piece that
matters at clauboard's event volumes: a brief disconnect costs a few frames, not
a full reload. A real engine swaps the in-memory buffer for a `SELECT ... WHERE
id > $since` against its event table and keeps the same wire shape.

**Mid-stream gap detection.** Beyond reconnects, `WsAdapter` also watches the
live stream: if an event id skips ahead of `lastSeq + 1`, it sends a fresh
`hello` to replay the missing span (throttled by an in-flight guard). The server
answers a `hello` at any time, not just on connect, so a dropped frame self-heals
without a disconnect.

The replay buffer size is configurable via `ORCH_REPLAY_CAP` (default 500) — size
it to your worst realistic reconnect window.

`applyMessage(prev, msg)` is the pure reducer that folds any `ServerMessage` into
the current snapshot. The client hook and anyone else reuse it.

## The adapter seam

```ts
interface OrchestratorAdapter {
  kind: "mock" | "ws";
  start(handlers: { onMessage; onStatus }): void;
  stop(): void;
  instruct(agentId, text): void;
}
```

Two implementations, chosen by env in `src/adapter/index.ts`:

| Adapter       | File                         | When                                                 |
| ------------- | ---------------------------- | ---------------------------------------------------- |
| `MockAdapter` | `src/adapter/mockAdapter.ts` | default — no `NEXT_PUBLIC_ORCH_WS` set               |
| `WsAdapter`   | `src/adapter/wsAdapter.ts`   | when `NEXT_PUBLIC_ORCH_WS` points at an orchestrator |

`useOrchestrator()` (`src/components/useOrchestrator.ts`) boots the chosen
adapter, folds messages into state, and exposes `{ projects, agents, workItems,
events, status, instruct }`. The header's status chip reflects `status`
(SIMULATED / CONNECTING / LIVE / RECONNECTING / OFFLINE).

The shared simulation lives in `src/lib/sim.ts` and is used by **both** the mock
adapter and the server, so they behave identically. It's the one file to delete
when a real engine is wired in.

## Running live

```bash
npm run server      # mock orchestrator on :8787 (REST + WS)
npm run dev:live    # board with NEXT_PUBLIC_ORCH_WS=ws://localhost:8787
```

Or copy `.env.local.example` → `.env.local` and run `npm run dev` normally.

The logic lives in `server/orchestrator.ts` as `createOrchestrator()` (so tests
can spin one up on a random port); `server/mock-orchestrator.ts` is the thin CLI
entry. It's an HTTP server for `GET /api/snapshot` + `GET /api/health`, a `ws`
WebSocketServer that handshakes on `hello` and broadcasts simulated events, and
an `instruct` handler that echoes a "new orders" event back to every client.
Env: `ORCH_PORT` (default 8787), `ORCH_REPLAY_CAP` (default 500).

## Wiring in a real Agent Works engine

Replace `server/orchestrator.ts` with (or put an adapter in front of) the real
engine. The mapping is mechanical because the shapes already match:

| Konoha contract                    | Agent Works source                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `BoardSnapshot`                    | `Store` reads: `projects`, `agents`, `workItems`, recent `events`            |
| `ServerMessage.event`              | the event **bus** (`src/bus.ts`) → WS broadcast (it already fans out to SSE) |
| `ServerMessage.agent` / `workItem` | emit on every `agents` / `work_items` row update                             |
| `ClientMessage.instruct`           | a change request / `tell` into the orchestrator                              |

Keep emitting the same messages and **no board code changes** — the adapter seam
is the whole point. Swap the transport (SSE instead of WS) by writing a third
adapter against the same `OrchestratorAdapter` interface.
