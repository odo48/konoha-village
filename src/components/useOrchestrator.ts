"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyMessage,
  type BoardSnapshot,
  type ConnectionStatus,
  type OrchestratorAdapter,
} from "@/lib/contract";
import { createAdapter } from "@/adapter";

const EMPTY: BoardSnapshot = {
  projects: [],
  agents: [],
  workItems: [],
  events: [],
};

// The board's single data source. Boots an adapter (mock or live) on mount,
// folds incoming messages into a snapshot, and exposes the write path.
export function useOrchestrator() {
  const [snapshot, setSnapshot] = useState<BoardSnapshot>(EMPTY);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const adapterRef = useRef<OrchestratorAdapter | null>(null);

  useEffect(() => {
    const adapter = createAdapter();
    adapterRef.current = adapter;
    adapter.start({
      onMessage: (msg) => setSnapshot((prev) => applyMessage(prev, msg)),
      onStatus: (s) => setStatus(s),
    });
    return () => {
      adapter.stop();
      adapterRef.current = null;
    };
  }, []);

  const instruct = useCallback((agentId: string, text: string) => {
    adapterRef.current?.instruct(agentId, text);
  }, []);

  return { ...snapshot, status, instruct };
}
