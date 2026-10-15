import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSnapshot,
  simEvent,
  simAgentNudge,
  instructionEvent,
} from "../src/lib/sim";

test("buildSnapshot returns a populated, id-ordered snapshot", () => {
  const s = buildSnapshot();
  assert.ok(s.agents.length > 0);
  assert.ok(s.projects.length > 0);
  assert.ok(s.workItems.length > 0);
  assert.ok(s.events.length > 0);
  const ids = s.events.map((e) => e.id);
  assert.deepEqual(
    ids,
    [...ids].sort((a, b) => a - b),
    "events ascending by id",
  );
});

test("buildSnapshot deep-clones (no shared references between calls)", () => {
  const a = buildSnapshot();
  const b = buildSnapshot();
  a.agents[0].chakra = -1;
  assert.notEqual(b.agents[0].chakra, -1);
});

test("simEvent targets a deployed agent and uses the given id", () => {
  const s = buildSnapshot();
  const e = simEvent(s.agents, 999);
  assert.ok(e);
  assert.equal(e?.id, 999);
  assert.equal(s.agents.find((x) => x.id === e?.agentId)?.status, "deployed");
});

test("simEvent returns null when nobody is deployed", () => {
  const s = buildSnapshot();
  const idle = s.agents.map((a) => ({ ...a, status: "idle" as const }));
  assert.equal(simEvent(idle, 1), null);
});

test("simAgentNudge keeps chakra within 2..100", () => {
  const s = buildSnapshot();
  for (let i = 0; i < 50; i++) {
    const a = simAgentNudge(s.agents);
    if (!a) continue;
    assert.ok(a.chakra >= 2 && a.chakra <= 100, `chakra ${a.chakra} in range`);
  }
});

test("instructionEvent carries the order text and agent", () => {
  const s = buildSnapshot();
  const a = s.agents[0];
  const e = instructionEvent(a, "prioritize X", 5);
  assert.equal(e.id, 5);
  assert.equal(e.agentId, a.id);
  assert.match(e.summary, /prioritize X/);
});
