# Konoha Village 🍥

A Naruto-themed **operator board for a Claude agent company**. It fuses the data
model of **Agent Works** (projects → epics → stories → tasks, agents, runs,
events) with the live, spatial operator view of **[clauboard.dev](https://clauboard.dev)**,
re-skinned as the Hidden Leaf Village.

The board talks to a backend through **one seam** (an adapter + a typed
contract), so it runs identically on an in-process simulator or a live
orchestrator over WebSocket. Out of the box it uses the simulator — see
[`docs/BACKEND.md`](docs/BACKEND.md) for the contract and how to wire a real
Agent Works engine in without touching the views.

## Quick start

```bash
npm install
npm run dev          # simulator mode → http://localhost:3000
```

Run it against the bundled mock orchestrator (REST + WebSocket):

```bash
npm run server       # mock orchestrator on :8787
npm run dev:live     # board connected to ws://localhost:8787
```

The header chip shows the data source: **SIMULATED** vs **LIVE**.
Build for production: `npm run build && npm start`.

### With Docker

```bash
docker compose up --build   # board on :3000, orchestrator on :8787 (live)
```

## Development

```bash
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npm run typecheck    # tsc --noEmit
npm test             # node:test — reducer, sim, and server resume/integration
npm run format       # Prettier (+ Tailwind class sorting)
npm run check        # lint + typecheck + test together
```

CI runs `lint → typecheck → test → build` on every push and PR
(`.github/workflows/ci.yml`). Node 22+ is required (`engines`). The board is
resilient by design: it shows connecting / reconnecting / offline states, the
WebSocket adapter reconnects with backoff and resumes from its event cursor
(including mid-stream gap detection), and a React error boundary catches render
failures.

## The three views

- **Village Map** — a spatial canvas of the shinobi (agents). Animated blue
  "chakra threads" are live dependencies between agents working on dependent
  work items; faint threads are command lines from leadership. Deployed agents
  pulse. (clauboard's agent canvas.)
- **Mission Board** — a kanban of work items across five states
  (Assigned → On Mission → Reporting In → Mission Complete, plus Sealed/blocked).
- **Mission Log** — a live event stream. Deployed shinobi emit new events every
  few seconds so it feels alive.

**Flavor toggle** (top-left, Konoha ⇄ Plain): flips every label between the
Naruto theme and the plain Agent Works / clauboard vocabulary, so the board
stays usable as a real tool.

## The rank system (the "levels")

Software seniority is replaced by ninja rank. Defined in `src/lib/ranks.ts`.

| Software level         | Ninja rank             |
| ---------------------- | ---------------------- |
| Intern / Trainee       | Academy Student (学生) |
| Junior                 | Genin (下忍)           |
| Mid                    | Chūnin (中忍)          |
| Senior                 | Jōnin (上忍)           |
| Principal / Specialist | ANBU (暗部)            |
| Lead / Manager         | Kage-rank (影)         |
| Owner / Director       | Hokage (火影)          |

### Role → village role → default rank

| Agent Works role      | Village role                   | Rank      | Inspired by  |
| --------------------- | ------------------------------ | --------- | ------------ |
| product-owner         | Hokage's Envoy                 | Hokage    | Tsunade      |
| business-analyst      | Scroll Keeper                  | Chūnin    | Shikamaru    |
| tech-lead / architect | Squad Captain / Architect      | Kage-rank | Kakashi      |
| ux-designer           | Genjutsu Artisan               | Jōnin     | Kurenai      |
| frontend-dev          | Frontline Shinobi              | Jōnin     | Naruto       |
| backend-dev           | Infrastructure Shinobi         | Jōnin     | Sasuke       |
| qa-automation         | Trap Master                    | ANBU      | Tenten       |
| qa-manual             | Byakugan Inspector             | Chūnin    | Hinata       |
| devops                | Gatekeeper                     | ANBU      | Might Guy    |
| engineering-manager   | Jōnin Commander (Mission Desk) | Kage-rank | Shikaku Nara |

The theme is fully centralized — change ranks, roles, characters, or the whole
Naruto ↔ plain vocabulary in two files without touching any component:

- `src/lib/ranks.ts` — rank ladder + role mapping
- `src/lib/flavor.ts` — every term, status, event, and phase label

## Project layout

```
src/
  app/            Next.js App Router (layout, page, globals.css, icon.svg)
  components/
    Board.tsx         shell; consumes the orchestrator via useOrchestrator
    useOrchestrator.ts hook: boots an adapter, folds messages into state
    Header.tsx        brand, view tabs, flavor toggle, stats, conn status
    VillageMap.tsx    spatial agent canvas + chakra threads (SVG)
    MissionBoard.tsx  kanban
    MissionLog.tsx    live event feed
    RosterSidebar.tsx / AgentDetail.tsx (incl. instruct) / RankBadge.tsx
  adapter/
    index.ts          createAdapter() — picks mock vs ws from env
    mockAdapter.ts    in-process simulator
    wsAdapter.ts      WebSocket client (snapshot + stream, reconnects)
  lib/
    contract.ts       the board <-> orchestrator contract + applyMessage()
    sim.ts            shared simulation (used by mock adapter AND server)
    types.ts          domain types (mirrors Agent Works)
    ranks.ts          rank ladder + role mapping
    flavor.ts         term dictionary + flavor toggle
    mock-data.ts      agents, missions, work items, seed events
    ui.ts             colors + time helpers
server/
  mock-orchestrator.ts  standalone REST + WebSocket mock backend
docs/
  BACKEND.md            the contract + how to wire a real engine
```

## Going live

The whole backend seam is documented in [`docs/BACKEND.md`](docs/BACKEND.md):
the contract (`BoardSnapshot`, `ServerMessage`, `ClientMessage`), the two
adapters, and the mechanical mapping from a real Agent Works engine (its SQLite
reads + event bus) onto these messages. No board code changes to swap backends.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 ·
`ws` + `tsx` for the mock server.
