import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyMessage,
  mergeEvents,
  maxEventId,
  type BoardSnapshot,
} from "../src/lib/contract";
import type { BoardEvent } from "../src/lib/types";
import { buildSnapshot } from "../src/lib/sim";

const ev = (id: number): BoardEvent => ({
  id,
  ts: new Date().toISOString(),
  type: "tool",
  summary: `e${id}`,
});

const EMPTY: BoardSnapshot = {
  projects: [],
  agents: [],
  workItems: [],
  events: [],
};

test("maxEventId", () => {
  assert.equal(maxEventId([]), 0);
  assert.equal(maxEventId([ev(3), ev(7), ev(5)]), 7);
});

test("mergeEvents dedups, sorts ascending, caps to newest", () => {
  assert.deepEqual(
    mergeEvents([ev(1), ev(2)], [ev(2), ev(3)], 10).map((e) => e.id),
    [1, 2, 3],
  );
  assert.deepEqual(
    mergeEvents([ev(1), ev(2), ev(3)], [ev(4)], 2).map((e) => e.id),
    [3, 4],
  );
});

test("applyMessage: snapshot replaces whole state", () => {
  const snap: BoardSnapshot = { ...EMPTY, events: [ev(1)] };
  assert.deepEqual(
    applyMessage(EMPTY, { type: "snapshot", snapshot: snap }),
    snap,
  );
});

test("applyMessage: event appends, ignores immediate dup, respects cap", () => {
  let s = applyMessage(EMPTY, { type: "event", event: ev(1) });
  s = applyMessage(s, { type: "event", event: ev(2) });
  assert.deepEqual(
    s.events.map((e) => e.id),
    [1, 2],
  );
  s = applyMessage(s, { type: "event", event: ev(2) }); // dup of last → ignored
  assert.deepEqual(
    s.events.map((e) => e.id),
    [1, 2],
  );

  let capped = EMPTY;
  for (let i = 1; i <= 5; i++)
    capped = applyMessage(capped, { type: "event", event: ev(i) }, 3);
  assert.deepEqual(
    capped.events.map((e) => e.id),
    [3, 4, 5],
  );
});

test("applyMessage: resume merges by id even when a gap event already arrived", () => {
  // We hold 1,2 and an out-of-order live event 5; resume replays 3,4,5.
  let s: BoardSnapshot = { ...EMPTY, events: [ev(1), ev(2), ev(5)] };
  s = applyMessage(s, {
    type: "resume",
    sinceId: 2,
    events: [ev(3), ev(4), ev(5)],
    agents: [],
    workItems: [],
    projects: [],
  });
  assert.deepEqual(
    s.events.map((e) => e.id),
    [1, 2, 3, 4, 5],
  );
});

test("applyMessage: agent upsert replaces in place, keeps count", () => {
  const snap = buildSnapshot();
  const a0 = snap.agents[0];
  const s = applyMessage(snap, { type: "agent", agent: { ...a0, chakra: 1 } });
  assert.equal(s.agents.length, snap.agents.length);
  assert.equal(s.agents.find((a) => a.id === a0.id)?.chakra, 1);
});

test("applyMessage: workItem upsert replaces in place", () => {
  const snap = buildSnapshot();
  const w0 = snap.workItems[0];
  const s = applyMessage(snap, {
    type: "workItem",
    workItem: { ...w0, status: "complete" },
  });
  assert.equal(s.workItems.find((w) => w.id === w0.id)?.status, "complete");
});
