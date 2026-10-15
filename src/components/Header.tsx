"use client";

import type { Flavor } from "@/lib/flavor";
import { TERMS } from "@/lib/flavor";
import type { Project } from "@/lib/types";
import { clock } from "@/lib/ui";

export type ViewId = "map" | "board" | "log";

function Crest() {
  // Stylized Hidden Leaf swirl.
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="22" fill="#15201a" stroke="#2f4438" strokeWidth="2" />
      <path
        d="M24 9c-6 0-10 4.5-10 10 0 4 2.5 7 6 8-2.5 1-4 3-4 5.5 0 3.5 3 6.5 7 6.5"
        fill="none"
        stroke="#4cc46c"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M22 6l4 7h-8z" fill="#4cc46c" transform="rotate(14 24 10)" />
    </svg>
  );
}

export default function Header({
  flavor,
  setFlavor,
  view,
  setView,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  stats,
  mounted,
  now,
}: {
  flavor: Flavor;
  setFlavor: (f: Flavor) => void;
  view: ViewId;
  setView: (v: ViewId) => void;
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  stats: { deployed: number; openMissions: number; avgChakra: number };
  mounted: boolean;
  now: number;
}) {
  const tabs: { id: ViewId; label: string }[] = [
    { id: "map", label: TERMS.map[flavor] },
    { id: "board", label: TERMS.board[flavor] },
    { id: "log", label: TERMS.log[flavor] },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-bark-600 bg-bark-850/80 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Crest />
          <div className="leading-tight">
            <div className="flex items-center gap-2 font-semibold tracking-wide">
              Konoha Village
              <span className="rounded bg-leaf-700/40 px-1.5 py-0.5 text-[10px] font-medium text-leaf-300">
                隠れ里
              </span>
            </div>
            <div className="text-xs text-leaf-300/60">
              {flavor === "konoha"
                ? "Hidden Leaf mission board"
                : "Agent operations board"}
            </div>
          </div>
        </div>

        {/* View tabs */}
        <nav className="flex items-center gap-1 rounded-lg bg-bark-800 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === t.id
                  ? "bg-leaf-600 text-white shadow"
                  : "text-leaf-100/70 hover:bg-bark-700 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Stats */}
        <div className="hidden items-center gap-2 sm:flex">
          <Stat label={flavor === "konoha" ? "Deployed" : "Active"} value={stats.deployed} tone="#38bdf8" />
          <Stat label={flavor === "konoha" ? "Open missions" : "Open stories"} value={stats.openMissions} tone="#eab308" />
          <Stat
            label={TERMS.chakra[flavor]}
            value={`${stats.avgChakra}%`}
            tone="#4cc46c"
          />
        </div>

        {/* Live clock */}
        <div className="flex items-center gap-2 rounded-md border border-bark-600 bg-bark-800 px-2.5 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf-400" />
          </span>
          <span className="font-mono text-xs tabular-nums text-leaf-100/80">
            {mounted ? clock(now) : "--:--:--"}
          </span>
        </div>

        {/* Project selector */}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="rounded-md border border-bark-600 bg-bark-800 px-2.5 py-1.5 text-sm text-leaf-100 outline-none focus:border-leaf-500"
        >
          <option value="all">
            {flavor === "konoha" ? "All missions" : "All projects"}
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} · {p.name}
            </option>
          ))}
        </select>

        {/* Flavor toggle */}
        <div className="flex items-center rounded-lg bg-bark-800 p-1 text-xs font-medium">
          <button
            onClick={() => setFlavor("konoha")}
            className={`rounded-md px-2.5 py-1.5 transition ${
              flavor === "konoha" ? "bg-flame/90 text-white" : "text-leaf-100/60 hover:text-white"
            }`}
          >
            Konoha
          </button>
          <button
            onClick={() => setFlavor("plain")}
            className={`rounded-md px-2.5 py-1.5 transition ${
              flavor === "plain" ? "bg-chakra text-bark-900" : "text-leaf-100/60 hover:text-white"
            }`}
          >
            Plain
          </button>
        </div>
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-bark-600 bg-bark-800 px-2.5 py-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tone }} />
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-[11px] text-leaf-100/50">{label}</span>
    </div>
  );
}
