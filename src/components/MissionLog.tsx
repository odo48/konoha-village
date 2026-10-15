"use client";

import type { Agent, BoardEvent } from "@/lib/types";
import type { Flavor } from "@/lib/flavor";
import { EVENT_LABEL, EVENT_ICON, TERMS } from "@/lib/flavor";
import { relTime } from "@/lib/ui";

export default function MissionLog({
  events,
  agents,
  flavor,
  mounted,
  now,
  onSelectAgent,
}: {
  events: BoardEvent[];
  agents: Agent[];
  flavor: Flavor;
  mounted: boolean;
  now: number;
  onSelectAgent: (id: string) => void;
}) {
  const byId = new Map(agents.map((a) => [a.id, a]));
  // newest first
  const ordered = [...events].sort((a, b) => b.id - a.id);

  return (
    <div className="flex h-full flex-col rounded-xl border border-bark-600 bg-bark-850/60">
      <header className="flex items-center justify-between border-b border-bark-600 px-4 py-2.5">
        <h3 className="text-sm font-semibold">{TERMS.log[flavor]}</h3>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-leaf-300/80">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf-400" />
          </span>
          LIVE · {events.length}
        </span>
      </header>
      <div className="flex-1 overflow-y-auto">
        <ol>
          {ordered.map((e, i) => {
            const agent = e.agentId ? byId.get(e.agentId) : undefined;
            const t = EVENT_LABEL[e.type][flavor];
            return (
              <li
                key={e.id}
                className={`flex items-start gap-3 px-4 py-2.5 ${
                  i === 0 ? "animate-riseIn" : ""
                } ${i % 2 ? "bg-bark-900/30" : ""}`}
              >
                <span className="mt-0.5 text-base leading-none">
                  {EVENT_ICON[e.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    {agent && (
                      <button
                        onClick={() => onSelectAgent(agent.id)}
                        className="font-medium hover:text-leaf-300"
                      >
                        {agent.name}
                      </button>
                    )}
                    <span className="rounded bg-bark-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-leaf-100/50">
                      {t}
                    </span>
                    {e.workItemId && (
                      <span className="font-mono text-[11px] text-leaf-100/40">
                        {e.workItemId}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-leaf-100/70">{e.summary}</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-leaf-100/40">
                  {mounted ? relTime(e.ts ? Date.parse(e.ts) : now, now) : ""}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
