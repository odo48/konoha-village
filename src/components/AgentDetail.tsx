"use client";

import type { Agent, WorkItem } from "@/lib/types";
import type { Flavor } from "@/lib/flavor";
import { STATUS_LABEL } from "@/lib/flavor";
import { ROLES, RANKS } from "@/lib/ranks";
import { AGENT_STATUS_COLOR, STATUS_COLOR, rankColor } from "@/lib/ui";
import RankBadge from "./RankBadge";

export default function AgentDetail({
  agent,
  flavor,
  workItems,
  onClose,
}: {
  agent: Agent;
  flavor: Flavor;
  workItems: WorkItem[];
  onClose: () => void;
}) {
  const role = ROLES[agent.role];
  const rank = RANKS[agent.rank];
  const assigned = workItems.filter((w) => w.assignee === agent.id);

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-bark-600 bg-bark-850 shadow-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-bark-600 p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
            style={{
              boxShadow: `inset 0 0 0 2px ${rankColor(agent.rank)}`,
              backgroundColor: "#111a15",
            }}
          >
            {role.emoji}
          </span>
          <div>
            <div className="text-lg font-semibold leading-tight">{agent.name}</div>
            <div className="text-xs text-leaf-100/50">
              inspired by {role.character}
            </div>
            <div className="mt-1.5">
              <RankBadge rank={agent.rank} size="md" />
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-leaf-100/50 hover:bg-bark-700 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Field label={flavor === "konoha" ? "Village role" : "Role"}>
          {flavor === "konoha" ? role.villageRole : role.origTitle}
        </Field>
        <Field label="Also known as">
          {flavor === "konoha" ? role.origTitle : role.villageRole}
        </Field>
        <Field label={`${rank.label} · ${rank.kanji}`}>
          <span className="text-leaf-100/70">
            {rank.blurb} Stands in for the <strong>{rank.softwareLevel}</strong> level.
          </span>
        </Field>

        <div className="rounded-lg border border-bark-600 bg-bark-800 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: AGENT_STATUS_COLOR[agent.status] }}
            />
            <span className="text-sm font-medium capitalize">{agent.status}</span>
          </div>
          <p className="text-sm text-leaf-100/70">{agent.activity}</p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-leaf-300/70">
              {flavor === "konoha" ? "Chakra reserve" : "Usage budget"}
            </span>
            <span className="font-mono tabular-nums text-leaf-100/70">
              {agent.chakra}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-bark-700">
            <div
              className="h-full rounded-full"
              style={{ width: `${agent.chakra}%`, backgroundColor: "#4cc46c" }}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-leaf-300/70">
            {flavor === "konoha" ? "Assigned missions" : "Assigned items"} ({assigned.length})
          </h3>
          <div className="space-y-1.5">
            {assigned.length === 0 && (
              <p className="text-sm text-leaf-100/40">Nothing assigned.</p>
            )}
            {assigned.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-2 rounded-md border border-bark-600 bg-bark-800 px-2.5 py-2"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[w.status] }}
                />
                <span className="font-mono text-[11px] text-leaf-100/50">{w.id}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{w.title}</span>
                <span className="shrink-0 text-[10px] text-leaf-100/50">
                  {STATUS_LABEL[w.status][flavor]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-leaf-300/70">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}
