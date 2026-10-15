// In-process simulator. The default when no orchestrator URL is configured, so
// `npm run dev` just works. Speaks the exact same ServerMessage contract a real
// backend would, so the board code can't tell the difference.

import type { AdapterHandlers, OrchestratorAdapter } from "@/lib/contract";
import type { Agent } from "@/lib/types";
import {
  buildSnapshot,
  simEvent,
  simAgentNudge,
  instructionEvent,
  SEED_EVENT_COUNT,
} from "@/lib/sim";

export class MockAdapter implements OrchestratorAdapter {
  readonly kind = "mock" as const;
  private timers: ReturnType<typeof setInterval>[] = [];
  private handlers: AdapterHandlers | null = null;
  private agents: Agent[] = [];
  private nextId = SEED_EVENT_COUNT;

  start(handlers: AdapterHandlers): void {
    this.handlers = handlers;
    handlers.onStatus?.("mock");

    const snapshot = buildSnapshot();
    this.agents = snapshot.agents;
    this.nextId = snapshot.events.length;
    // Deliver the snapshot asynchronously, like a network backend would.
    setTimeout(() => handlers.onMessage({ type: "snapshot", snapshot }), 0);

    this.timers.push(
      setInterval(() => {
        const ev = simEvent(this.agents, ++this.nextId);
        if (ev) handlers.onMessage({ type: "event", event: ev });
      }, 5000),
    );

    this.timers.push(
      setInterval(() => {
        const agent = simAgentNudge(this.agents);
        if (agent) {
          this.agents = this.agents.map((a) => (a.id === agent.id ? agent : a));
          handlers.onMessage({ type: "agent", agent });
        }
      }, 9000),
    );
  }

  instruct(agentId: string, text: string): void {
    const agent = this.agents.find((a) => a.id === agentId);
    const ev = instructionEvent(agent, text, ++this.nextId);
    // Small delay to mimic round-trip.
    setTimeout(
      () => this.handlers?.onMessage({ type: "event", event: ev }),
      400,
    );
  }

  stop(): void {
    this.timers.forEach(clearInterval);
    this.timers = [];
    this.handlers = null;
  }
}
