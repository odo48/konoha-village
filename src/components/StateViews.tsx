"use client";

import type { ConnectionStatus } from "@/lib/contract";
import type { Flavor } from "@/lib/flavor";

// A thin bar under the header for non-steady connection states. Returns null
// when connected (live) or on the simulator (mock).
export function StatusBanner({
  status,
  flavor,
}: {
  status: ConnectionStatus;
  flavor: Flavor;
}) {
  if (status === "live" || status === "mock") return null;

  const copy: Record<string, { text: string; color: string }> = {
    connecting: {
      text:
        flavor === "konoha"
          ? "Reaching the village…"
          : "Connecting to the orchestrator…",
      color: "#38bdf8",
    },
    reconnecting: {
      text:
        flavor === "konoha"
          ? "Signal lost — re-summoning the link…"
          : "Connection dropped — retrying…",
      color: "#f97316",
    },
    closed: {
      text:
        flavor === "konoha"
          ? "The village is unreachable. Start the mission desk with `npm run server` — showing the last known scroll."
          : "Orchestrator unreachable. Start it with `npm run server` — showing the last snapshot.",
      color: "#ef4444",
    },
  };
  const c = copy[status];
  if (!c) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 px-4 py-1.5 text-xs"
      style={{
        backgroundColor: `color-mix(in srgb, ${c.color} 14%, transparent)`,
        borderBottom: `1px solid color-mix(in srgb, ${c.color} 35%, transparent)`,
        color: c.color,
      }}
    >
      {status !== "closed" && (
        <span
          className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      <span className="font-medium">{c.text}</span>
    </div>
  );
}

// Centered placeholder shown while there's no data yet (pre-snapshot or offline).
export function LoadingState({
  status,
  flavor,
}: {
  status: ConnectionStatus;
  flavor: Flavor;
}) {
  const offline = status === "closed";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      {!offline ? (
        <span
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-leaf-600 border-t-transparent"
          aria-hidden
        />
      ) : (
        <span className="text-4xl" aria-hidden>
          🏯
        </span>
      )}
      <div>
        <p className="text-sm font-medium text-leaf-100/90">
          {offline
            ? flavor === "konoha"
              ? "The village can't be reached"
              : "Orchestrator offline"
            : flavor === "konoha"
              ? "Summoning the shinobi…"
              : "Loading the board…"}
        </p>
        {offline && (
          <p className="mt-1 text-xs text-leaf-100/50">
            Run{" "}
            <code className="rounded bg-bark-800 px-1.5 py-0.5 font-mono text-leaf-300">
              npm run server
            </code>{" "}
            and it will reconnect automatically.
          </p>
        )}
      </div>
    </div>
  );
}
