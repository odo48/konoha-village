"use client";

import type { Agent, WorkItem, Project } from "@/lib/types";
import type { Flavor } from "@/lib/flavor";
import { PHASE_LABEL, TERMS } from "@/lib/flavor";
import { ROLES, RANKS } from "@/lib/ranks";
import { AGENT_STATUS_COLOR, rankColor } from "@/lib/ui";

interface Thread {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  kind: "dep" | "command";
  a: string;
  b: string;
}

function curve(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const k = 7;
  const cx = mx + (-dy / len) * k;
  const cy = my + (dx / len) * k;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export default function VillageMap({
  agents,
  workItems,
  projects,
  selectedProjectId,
  flavor,
  selectedAgentId,
  onSelect,
}: {
  agents: Agent[];
  workItems: WorkItem[];
  projects: Project[];
  selectedProjectId: string;
  flavor: Flavor;
  selectedAgentId: string | null;
  onSelect: (id: string) => void;
}) {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const threads: Thread[] = [];
  const seen = new Set<string>();

  // Dependency threads between assignees of dependent work items.
  for (const w of workItems) {
    if (!w.assignee) continue;
    for (const depId of w.dependsOn) {
      const dep = workItems.find((x) => x.id === depId);
      if (!dep?.assignee || dep.assignee === w.assignee) continue;
      const a = byId.get(w.assignee);
      const b = byId.get(dep.assignee);
      if (!a || !b) continue;
      const pairKey = [a.id, b.id].sort().join("~");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);
      threads.push({
        key: pairKey,
        x1: a.pos.x,
        y1: a.pos.y,
        x2: b.pos.x,
        y2: b.pos.y,
        active: w.status === "on_mission" || dep.status === "on_mission",
        kind: "dep",
        a: a.id,
        b: b.id,
      });
    }
  }

  // Faint command threads from leadership to deployed agents.
  const leaders = agents.filter(
    (a) => a.role === "product-owner" || a.role === "engineering-manager",
  );
  for (const lead of leaders) {
    for (const a of agents) {
      if (a.id === lead.id || a.status !== "deployed") continue;
      threads.push({
        key: `cmd-${lead.id}-${a.id}`,
        x1: lead.pos.x,
        y1: lead.pos.y,
        x2: a.pos.x,
        y2: a.pos.y,
        active: false,
        kind: "command",
        a: lead.id,
        b: a.id,
      });
    }
  }

  const activeProject =
    selectedProjectId === "all"
      ? null
      : projects.find((p) => p.id === selectedProjectId) ?? null;

  const touches = (t: Thread) =>
    !selectedAgentId || t.a === selectedAgentId || t.b === selectedAgentId;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-bark-600 bg-bark-900 paper">
      {/* Caption */}
      <div className="pointer-events-none absolute left-4 top-4 z-10">
        <div className="text-sm font-semibold text-leaf-100/90">
          {TERMS.map[flavor]}
        </div>
        <div className="text-xs text-leaf-100/50">
          {activeProject
            ? `${activeProject.key} · ${PHASE_LABEL[activeProject.phase][flavor]}`
            : flavor === "konoha"
              ? "All squads across the village"
              : "All agents"}
        </div>
      </div>

      {/* Threads */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {threads.map((t) => {
          const dim = !touches(t);
          const base =
            t.kind === "command"
              ? "#2f4438"
              : t.active
                ? "#38bdf8"
                : "#3a5446";
          return (
            <path
              key={t.key}
              d={curve(t.x1, t.y1, t.x2, t.y2)}
              fill="none"
              stroke={base}
              strokeWidth={t.active ? 1.4 : 1}
              strokeLinecap="round"
              strokeDasharray={t.kind === "command" ? "1 3" : t.active ? "4 3" : undefined}
              vectorEffect="non-scaling-stroke"
              className={t.active && !dim ? "animate-threadFlow" : undefined}
              style={{ opacity: dim ? 0.12 : t.kind === "command" ? 0.45 : 0.9 }}
            />
          );
        })}
      </svg>

      {/* Agent nodes */}
      {agents.map((a) => {
        const role = ROLES[a.role];
        const selected = a.id === selectedAgentId;
        const dim = selectedAgentId != null && !selected;
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className="group absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{
              left: `${a.pos.x}%`,
              top: `${a.pos.y}%`,
              opacity: dim ? 0.45 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <span className="relative">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${
                  a.status === "deployed" ? "animate-chakraPulse" : ""
                }`}
                style={{
                  backgroundColor: "#111a15",
                  boxShadow: selected
                    ? `0 0 0 3px ${rankColor(a.rank)}, 0 0 22px -2px ${rankColor(a.rank)}`
                    : `inset 0 0 0 2px ${rankColor(a.rank)}`,
                }}
              >
                {role.emoji}
              </span>
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bark-900"
                style={{ backgroundColor: AGENT_STATUS_COLOR[a.status] }}
              />
            </span>
            <span className="mt-1 whitespace-nowrap rounded bg-bark-850/80 px-1.5 py-0.5 text-[11px] font-medium text-leaf-100/90">
              {a.name}
              <span className="ml-1 text-[9px]" style={{ color: rankColor(a.rank) }}>
                {RANKS[a.rank].kanji}
              </span>
            </span>
          </button>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-3 left-4 z-10 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-bark-600 bg-bark-850/80 px-3 py-2 text-[11px] text-leaf-100/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 bg-chakra" /> {TERMS.deps[flavor]} (active)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 animate-chakraPulse rounded-full bg-chakra" /> deployed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#64748b" }} /> idle
        </span>
      </div>
    </div>
  );
}
