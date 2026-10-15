import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { WebSocket } from "ws";
import { createOrchestrator } from "../server/orchestrator";
import type { ServerMessage } from "../src/lib/contract";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function connect(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.once("open", () => resolve(ws));
    ws.once("error", reject);
  });
}

// Wait for the next message of a given type, skipping interleaved frames
// (e.g. activity events that arrive between connect and the handshake reply).
function waitFor<T extends ServerMessage["type"]>(
  ws: WebSocket,
  type: T,
  timeoutMs = 3000,
): Promise<Extract<ServerMessage, { type: T }>> {
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => {
      cleanup();
      reject(new Error(`timed out waiting for ${type}`));
    }, timeoutMs);
    const onMsg = (d: Buffer) => {
      let m: ServerMessage;
      try {
        m = JSON.parse(d.toString());
      } catch {
        return;
      }
      if (m.type === type) {
        cleanup();
        resolve(m as Extract<ServerMessage, { type: T }>);
      }
    };
    function cleanup() {
      clearTimeout(to);
      ws.off("message", onMsg);
    }
    ws.on("message", onMsg);
  });
}

test("orchestrator: snapshot, resume, stale fallback, mid-stream resync", async () => {
  const orch = createOrchestrator({
    eventIntervalMs: 40,
    nudgeIntervalMs: 100000,
    replayCap: 200,
  });
  await new Promise<void>((res) => orch.server.listen(0, res));
  const port = (orch.server.address() as AddressInfo).port;
  const url = `ws://localhost:${port}`;

  try {
    // Cold start → snapshot
    const a = await connect(url);
    a.send(JSON.stringify({ type: "hello", since: null }));
    const snap = await waitFor(a, "snapshot");
    const maxId = Math.max(...snap.snapshot.events.map((e) => e.id));
    assert.ok(maxId > 0);

    orch.start(); // begin emitting events
    await delay(250); // ~6 events

    // Reconnect with cursor → resume carrying only newer events
    const b = await connect(url);
    b.send(JSON.stringify({ type: "hello", since: maxId }));
    const resume = await waitFor(b, "resume");
    assert.ok(resume.events.length > 0, "resume replays missed events");
    assert.ok(
      resume.events.every((e) => e.id > maxId),
      "resume carries only events newer than the cursor",
    );
    assert.equal(resume.agents.length, snap.snapshot.agents.length);

    // Mid-stream resync: a SECOND hello on the same socket is also answered.
    await delay(150);
    const beforeResync = Math.max(...resume.events.map((e) => e.id));
    b.send(JSON.stringify({ type: "hello", since: beforeResync }));
    const resume2 = await waitFor(b, "resume");
    assert.ok(
      resume2.events.every((e) => e.id > beforeResync),
      "second resume continues from the new cursor",
    );

    // Stale cursor older than the buffer → full snapshot fallback
    const c = await connect(url);
    c.send(JSON.stringify({ type: "hello", since: -999 }));
    const fallback = await waitFor(c, "snapshot");
    assert.ok(fallback.snapshot.agents.length > 0);

    a.close();
    b.close();
    c.close();
  } finally {
    await orch.stop();
  }
});
