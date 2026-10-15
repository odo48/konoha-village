# Konoha Village 🍥

A Naruto-themed **operator board for a Claude agent company**. It fuses the data
model of **Agent Works** (projects → epics → stories → tasks, agents, runs,
events) with the live, spatial operator view of **[clauboard.dev](https://clauboard.dev)**,
re-skinned as the Hidden Leaf Village.

Right now it runs on **mock data** — it's the board UI + a clean data contract,
so a real orchestrator backend can be wired in later without touching the views.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build for production: `npm run build && npm start`.

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

| Software level        | Ninja rank            |
|-----------------------|-----------------------|
| Intern / Trainee      | Academy Student (学生) |
| Junior                | Genin (下忍)           |
| Mid                   | Chūnin (中忍)          |
| Senior                | Jōnin (上忍)           |
| Principal / Specialist| ANBU (暗部)            |
| Lead / Manager        | Kage-rank (影)         |
| Owner / Director      | Hokage (火影)          |

### Role → village role → default rank

| Agent Works role       | Village role                 | Rank      | Inspired by  |
|------------------------|------------------------------|-----------|--------------|
| product-owner          | Hokage's Envoy               | Hokage    | Tsunade      |
| business-analyst       | Scroll Keeper                | Chūnin    | Shikamaru    |
| tech-lead / architect  | Squad Captain / Architect    | Kage-rank | Kakashi      |
| ux-designer            | Genjutsu Artisan             | Jōnin     | Kurenai      |
| frontend-dev           | Frontline Shinobi            | Jōnin     | Naruto       |
| backend-dev            | Infrastructure Shinobi       | Jōnin     | Sasuke       |
| qa-automation          | Trap Master                  | ANBU      | Tenten       |
| qa-manual              | Byakugan Inspector           | Chūnin    | Hinata       |
| devops                 | Gatekeeper                   | ANBU      | Might Guy    |
| engineering-manager    | Jōnin Commander (Mission Desk)| Kage-rank | Shikaku Nara |

The theme is fully centralized — change ranks, roles, characters, or the whole
Naruto ↔ plain vocabulary in two files without touching any component:

- `src/lib/ranks.ts` — rank ladder + role mapping
- `src/lib/flavor.ts` — every term, status, event, and phase label

## Project layout

```
src/
  app/            Next.js App Router (layout, page, globals.css)
  components/
    Board.tsx       state container + live simulation
    Header.tsx      brand, view tabs, flavor toggle, stats, clock
    VillageMap.tsx  spatial agent canvas + chakra threads (SVG)
    MissionBoard.tsx kanban
    MissionLog.tsx  live event feed
    RosterSidebar.tsx / AgentDetail.tsx / RankBadge.tsx
  lib/
    types.ts        domain types (mirrors Agent Works)
    ranks.ts        rank ladder + role mapping
    flavor.ts       term dictionary + flavor toggle
    mock-data.ts    agents, missions, work items, seed events
    ui.ts           colors + time helpers
```

## Wiring in a real backend later

The views only read from `src/lib/mock-data.ts`. To go live, replace that module
(or the `Board` state) with data from an orchestrator: a WebSocket/SSE feed of
events (clauboard style) plus REST reads for agents and work items. The event and
work-item shapes already follow Agent Works, so the mapping is mechanical.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3.
