"use client";

import type { Agent, WorkItem } from "@/lib/types";
import type { Flavor } from "@/lib/flavor";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  WORK_ITEM_TYPE_LABEL,
  MISSION_RANK_BLURB,
} from "@/lib/flavor";
import { ROLES, RANKS } from "@/lib/ranks";
import { STATUS_COLOR, MISSION_RANK_COLOR, rankColor } from "@/lib/ui";

export default function MissionBoard({
  agents,
  workItems,
  flavor,
  onSelectAgent,
}: {
  agents: Agent[];
  workItems: WorkItem[];
  flavor: Flavor;
  onSelectAgent: (id: string) => void;
}) {
  const byId = new Map(agents.map((a) => [a.id, a]));
  // Cards: missions + objectives (arcs are shown as parent tags).
  const cards = workItems.filter((w) => w.type !== "arc");
  const arcs = new Map(
    workItems.filter((w) => w.type === "arc").map((a) => [a.id, a.title]),
  );

  return (
    <div className="flex h-full gap-3 overflow-x-auto pb-2">
      {STATUS_ORDER.map((status) => {
        const col = cards
          .filter((w) => w.status === status)
          .sort((a, b) => a.priority - b.priority);
        return (
          <section
            key={status}
            className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-bark-600 bg-bark-850/60"
          >
            <header className="flex items-center justify-between gap-2 border-b border-bark-600 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[status] }}
                />
                <h3 className="text-sm font-semibold">
                  {STATUS_LABEL[status][flavor]}
                </h3>
              </div>
              <span className="rounded-full bg-bark-700 px-2 py-0.5 text-[11px] text-leaf-100/60">
                {col.length}
              </span>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {col.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-leaf-100/30">
                  —
                </p>
              )}
              {col.map((w) => {
                const agent = w.assignee ? byId.get(w.assignee) : undefined;
                return (
                  <article
                    key={w.id}
                    className="animate-riseIn rounded-lg border border-bark-600 bg-bark-800 p-2.5 shadow-panel transition hover:border-leaf-600/60"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-leaf-100/50">
                        {w.id}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-leaf-100/40">
                          {WORK_ITEM_TYPE_LABEL[w.type][flavor]}
                        </span>
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold"
                          style={{
                            color: MISSION_RANK_COLOR[w.missionRank],
                            backgroundColor: `color-mix(in srgb, ${MISSION_RANK_COLOR[w.missionRank]} 16%, transparent)`,
                          }}
                          title={`${w.missionRank}-rank — ${MISSION_RANK_BLURB[w.missionRank]}`}
                        >
                          {w.missionRank}
                        </span>
                      </span>
                    </div>

                    <h4 className="text-sm font-medium leading-snug">
                      {w.title}
                    </h4>

                    {w.parentId && arcs.has(w.parentId) && (
                      <div className="mt-1 truncate text-[11px] text-leaf-300/50">
                        ↳ {arcs.get(w.parentId)}
                      </div>
                    )}

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      {agent ? (
                        <button
                          onClick={() => onSelectAgent(agent.id)}
                          className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left hover:bg-bark-700"
                        >
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-sm"
                            style={{
                              boxShadow: `inset 0 0 0 1.5px ${rankColor(agent.rank)}`,
                              backgroundColor: "#111a15",
                            }}
                          >
                            {ROLES[agent.role].emoji}
                          </span>
                          <span className="text-[11px]">
                            <span className="font-medium">{agent.name}</span>
                            <span
                              className="ml-1"
                              style={{ color: rankColor(agent.rank) }}
                            >
                              {RANKS[agent.rank].label}
                            </span>
                          </span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-leaf-100/30">
                          unassigned
                        </span>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-leaf-100/40">
                        {w.prNumber && <span>PR #{w.prNumber}</span>}
                        {w.dependsOn.length > 0 && (
                          <span title="dependencies">
                            🧵 {w.dependsOn.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
