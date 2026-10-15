import type { OrchestratorAdapter } from "@/lib/contract";
import { MockAdapter } from "./mockAdapter";
import { WsAdapter } from "./wsAdapter";

// Pick the data source from the environment. Set NEXT_PUBLIC_ORCH_WS to point
// the board at a live orchestrator; leave it unset to run on the simulator.
export function createAdapter(): OrchestratorAdapter {
  const url = process.env.NEXT_PUBLIC_ORCH_WS;
  if (url && url.length > 0) return new WsAdapter(url);
  return new MockAdapter();
}

export { MockAdapter, WsAdapter };
