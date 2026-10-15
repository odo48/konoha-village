"use client";

import type { Agent } from "@/lib/types";
import type { Flavor } from "@/lib/flavor";
import { TERMS } from "@/lib/flavor";
import { ROLES, RANKS } from "@/lib/ranks";
import { AGENT_STATUS_COLOR, rankColor } from "@/lib/ui";

export default function RosterSidebar({
  agents,
  flavor,
  selectedAgentId,
  onSelect,
}: {
  agents: Agent[];
  flavor: Flavor;
  selectedAgentId: string | null;
  onSelect: (id: string) => void;
}) {
  // Sort by rank (highest first), then name.
  const sorted = [...agents].sort(
    (a, b) =>
      RANKS[b.rank].order - RANKS[a.rank].order || a.name.localeCompare(b.name),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-leaf-300/70">
          {TERMS.roster[flavor]}
        </h2>
        <span className="text-[11px] text-leaf-100/40">{agents.length}</span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {sorted.map((a) => {
          const role = ROLES[a.role];
          const selected = a.id === selectedAgentId;
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`group flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition ${
                selected
                  ? "border-leaf-500 bg-leaf-700/20"
                  : "border-transparent hover:border-bark-600 hover:bg-bark-800"
              }`}
            >
              <div className="relative">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                  style={{
                    boxShadow: `inset 0 0 0 2px ${rankColor(a.rank)}`,
                    backgroundColor: "#111a15",
                  }}
                >
                  {role.emoji}
                </span>
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bark-850"
                  style={{ backgroundColor: AGENT_STATUS_COLOR[a.status] }}
                  title={a.status}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{a.name}</span>
                  <span
                    className="shrink-0 text-[10px] font-semibold uppercase"
                    style={{ color: rankColor(a.rank) }}
                  >
                    {RANKS[a.rank].label}
                  </span>
                </div>
                <div className="truncate text-[11px] text-leaf-100/50">
                  {flavor === "konoha" ? role.villageRole : role.origRole}
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-bark-700">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${a.chakra}%`,
                      backgroundColor: "#4cc46c",
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
