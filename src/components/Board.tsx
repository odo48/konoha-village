"use client";

import { useEffect, useMemo, useState } from "react";
import type { Flavor } from "@/lib/flavor";
import Header, { type ViewId } from "./Header";
import RosterSidebar from "./RosterSidebar";
import VillageMap from "./VillageMap";
import MissionBoard from "./MissionBoard";
import MissionLog from "./MissionLog";
import AgentDetail from "./AgentDetail";
import { StatusBanner, LoadingState } from "./StateViews";
import { useOrchestrator } from "./useOrchestrator";

export default function Board() {
  const [flavor, setFlavor] = useState<Flavor>("konoha");
  const [view, setView] = useState<ViewId>("map");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // All board data now flows through the orchestrator adapter (mock or live).
  const { projects, agents, workItems, events, status, instruct } =
    useOrchestrator();

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const filteredWorkItems = useMemo(
    () =>
      selectedProjectId === "all"
        ? workItems
        : workItems.filter((w) => w.projectId === selectedProjectId),
    [workItems, selectedProjectId],
  );

  const projectKeyPrefix = useMemo(() => {
    if (selectedProjectId === "all") return null;
    return projects.find((p) => p.id === selectedProjectId)?.key ?? null;
  }, [projects, selectedProjectId]);

  const filteredEvents = useMemo(() => {
    if (!projectKeyPrefix) return events;
    return events.filter(
      (e) => !e.workItemId || e.workItemId.startsWith(projectKeyPrefix + "-"),
    );
  }, [events, projectKeyPrefix]);

  const stats = useMemo(() => {
    const deployed = agents.filter((a) => a.status === "deployed").length;
    const openMissions = filteredWorkItems.filter(
      (w) => w.type === "mission" && w.status !== "complete",
    ).length;
    const avgChakra = agents.length
      ? Math.round(agents.reduce((s, a) => s + a.chakra, 0) / agents.length)
      : 0;
    return { deployed, openMissions, avgChakra };
  }, [agents, filteredWorkItems]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-[var(--bg)]">
      <Header
        flavor={flavor}
        setFlavor={setFlavor}
        view={view}
        setView={setView}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        stats={stats}
        status={status}
        mounted={mounted}
        now={now}
      />

      <StatusBanner status={status} flavor={flavor} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-bark-600 bg-bark-850/40 md:block">
          <RosterSidebar
            agents={agents}
            flavor={flavor}
            selectedAgentId={selectedAgentId}
            onSelect={(id) =>
              setSelectedAgentId((cur) => (cur === id ? null : id))
            }
          />
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden p-3 sm:p-4">
          {agents.length === 0 ? (
            <LoadingState status={status} flavor={flavor} />
          ) : (
            <>
              {view === "map" && (
                <VillageMap
                  agents={agents}
                  workItems={filteredWorkItems}
                  projects={projects}
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
                  agents={agents}
                  workItems={filteredWorkItems}
                  flavor={flavor}
                  onSelectAgent={(id) => setSelectedAgentId(id)}
                />
              )}
              {view === "log" && (
                <MissionLog
                  events={filteredEvents}
                  agents={agents}
                  flavor={flavor}
                  mounted={mounted}
                  now={now}
                  onSelectAgent={(id) => setSelectedAgentId(id)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {selectedAgent && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setSelectedAgentId(null)}
          />
          <AgentDetail
            agent={selectedAgent}
            flavor={flavor}
            workItems={workItems}
            onClose={() => setSelectedAgentId(null)}
            onInstruct={instruct}
          />
        </>
      )}
    </div>
  );
}
