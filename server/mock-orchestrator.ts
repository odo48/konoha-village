// CLI entry for the mock orchestrator. The logic lives in ./orchestrator.ts so
// it can be imported by tests. Run with: npm run server
//
//   ORCH_PORT        port to listen on (default 8787)
//   ORCH_REPLAY_CAP  events kept for reconnect replay (default 500)
//
// To go real: swap this process for your engine, keep emitting the same
// messages (see docs/BACKEND.md). The board needs no changes.

import { createOrchestrator } from "./orchestrator";

const PORT = Number(process.env.ORCH_PORT ?? 8787);
const replayCap = Number(process.env.ORCH_REPLAY_CAP ?? 500);

const orch = createOrchestrator({ replayCap });
orch.start();
orch.server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `🍥 Konoha mock orchestrator → http://localhost:${PORT}  (ws://localhost:${PORT})  replayCap=${replayCap}`,
  );
});

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    void orch.stop().then(() => process.exit(0));
  });
}
