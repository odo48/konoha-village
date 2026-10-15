"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BoardEvent } from "@/lib/types";
import type { Flavor } from "@/lib/flavor";
import {
  AGENTS,
  PROJECTS,
  WORK_ITEMS,
  SEED_EVENTS,
  SIM_TEMPLATES,
} from "@/lib/mock-data";
import Header, { type ViewId } from "./Header";
import RosterSidebar from "./RosterSidebar";
import VillageMap from "./VillageMap";
import MissionBoard from "./MissionBoard";
import MissionLog from "./MissionLog";
import AgentDetail from "./AgentDetail";

export default function Board() {
  const [flavor, setFlavor] = useState<Flavor>("konoha");
  const [view, setView] = useState<ViewId>("map");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const [events, setEvents] = useState<BoardEvent[]>([]);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);
  const idRef = useRef(0);

  // Seed events on mount (client-only, avoids hydration mismatch on timestamps).
  useEffect(() => {
    const t = Date.now();
    const seeded: BoardEvent[] = SEED_EVENTS.map((e, i) => ({
      id: i + 1,
      ts: new Date(t - e.agoSec * 1000).toISOString(),
      type: e.type,
      agentId: e.agentId,
      workItemId: e.workItemId,
      summary: e.summary,
    }));
    idRef.current = seeded.length;
    setEvents(seeded);
    setNow(t);
    setMounted(true);
  }, []);

  // Tick the clock / relative times.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Live simulation: deployed shinobi emit new events over time.
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      const deployed = AGENTS.filter((a) => a.status === "deployed");
      if (deployed.length === 0) return;
      const a = deployed[Math.floor(Math.random() * deployed.length)];
      const tmpl = SIM_TEMPLATES[Math.floor(Math.random() * SIM_TEMPLATES.length)];
      const summary =
        tmpl.summaries[Math.floor(Math.random() * tmpl.summaries.length)];
      const ev: BoardEvent = {
        id: ++idRef.current,
        ts: new Date().toISOString(),
        type: tmpl.type,
        agentId: a.id,
        workItemId: a.currentItemId,
        summary,
      };
      setEvents((prev) => [...prev, ev].slice(-150));
    }, 5000);
    return () => clearInterval(id);
  }, [mounted]);

  const filteredWorkItems = useMemo(
    () =>
      selectedProjectId === "all"
        ? WORK_ITEMS
        : WORK_ITEMS.filter((w) => w.projectId === selectedProjectId),
    [selectedProjectId],
  );

  const projectKeyPrefix = useMemo(() => {
    if (selectedProjectId === "all") return null;
    return PROJECTS.find((p) => p.id === selectedProjectId)?.key ?? null;
  }, [selectedProjectId]);

  const filteredEvents = useMemo(() => {
    if (!projectKeyPrefix) return events;
    return events.filter(
      (e) => !e.workItemId || e.workItemId.startsWith(projectKeyPrefix + "-"),
    );
  }, [events, projectKeyPrefix]);

  const stats = useMemo(() => {
    const deployed = AGENTS.filter((a) => a.status === "deployed").length;
    const openMissions = filteredWorkItems.filter(
      (w) => w.type === "mission" && w.status !== "complete",
    ).length;
    const avgChakra = Math.round(
      AGENTS.reduce((s, a) => s + a.chakra, 0) / AGENTS.length,
    );
    return { deployed, openMissions, avgChakra };
  }, [filteredWorkItems]);

  const selectedAgent = AGENTS.find((a) => a.id === selectedAgentId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-[var(--bg)]">
      <Header
        flavor={flavor}
        setFlavor={setFlavor}
        view={view}
        setView={setView}
        projects={PROJECTS}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        stats={stats}
        mounted={mounted}
        now={now}
      />

      <div className="flex min-h-0 flex-1">
        {/* Roster */}
        <aside className="hidden w-60 shrink-0 border-r border-bark-600 bg-bark-850/40 md:block">
          <RosterSidebar
            agents={AGENTS}
            flavor={flavor}
            selectedAgentId={selectedAgentId}
            onSelect={(id) =>
              setSelectedAgentId((cur) => (cur === id ? null : id))
            }
          />
        </aside>

        {/* Active view */}
        <main className="min-w-0 flex-1 overflow-hidden p-3 sm:p-4">
          {view === "map" && (
            <VillageMap
              agents={AGENTS}
              workItems={filteredWorkItems}
              projects={PROJECTS}
              selectedProjectId={selectedProjectId}
              flavor={flavor}
              selectedAgentId={selectedAgentId}
              onSelect={(id) =>
                setSelectedAgentId((cur) => (cur === id ? null : id))
              }
            />
          )}
          {view === "board" && (
            <MissionBoard
              agents={AGENTS}
              workItems={filteredWorkItems}
              flavor={flavor}
              onSelectAgent={(id) => setSelectedAgentId(id)}
            />
          )}
          {view === "log" && (
            <MissionLog
              events={filteredEvents}
              agents={AGENTS}
              flavor={flavor}
              mounted={mounted}
              now={now}
              onSelectAgent={(id) => setSelectedAgentId(id)}
            />
          )}
        </main>
      </div>

      {/* Agent detail drawer */}
      {selectedAgent && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setSelectedAgentId(null)}
          />
          <AgentDetail
            agent={selectedAgent}
            flavor={flavor}
            workItems={WORK_ITEMS}
            onClose={() => setSelectedAgentId(null)}
          />
        </>
      )}
    </div>
  );
}
