// WebSocket adapter — connects to a real orchestrator that speaks the contract
// (the bundled mock server does; a real Agent Works engine would too). Snapshot
// on connect, then a stream of events / upserts. Reconnects with backoff.

import {
  maxEventId,
  type AdapterHandlers,
  type OrchestratorAdapter,
  type ServerMessage,
} from "@/lib/contract";

export class WsAdapter implements OrchestratorAdapter {
  readonly kind = "ws" as const;
  private ws: WebSocket | null = null;
  private handlers: AdapterHandlers | null = null;
  private closed = false;
  private retry = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  // Highest event id held, carried across reconnects → the resume cursor.
  private lastSeq: number | null = null;
  // Guards against spamming resyncs when several events arrive after a gap.
  private resyncInFlight = false;
  private resyncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private url: string) {}

  // Ask the server to replay everything after `since` (used both on reconnect
  // and mid-stream when a gap in event ids is detected).
  private requestResume(since: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.resyncInFlight = true;
    this.ws.send(JSON.stringify({ type: "hello", since }));
    if (this.resyncTimer) clearTimeout(this.resyncTimer);
    // Safety valve: if no resume arrives, allow another attempt.
    this.resyncTimer = setTimeout(() => {
      this.resyncInFlight = false;
    }, 4000);
  }

  start(handlers: AdapterHandlers): void {
    this.handlers = handlers;
    this.closed = false;
    this.connect();
  }

  private connect(): void {
    if (this.closed || typeof WebSocket === "undefined") return;
    this.handlers?.onStatus?.(this.retry === 0 ? "connecting" : "reconnecting");

    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      // Handshake: tell the server where we left off so it can replay only the
      // missed tail (or send a full snapshot if the gap is too large).
      ws.send(JSON.stringify({ type: "hello", since: this.lastSeq }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as ServerMessage;
        switch (msg.type) {
          case "snapshot":
            this.retry = 0;
            this.lastSeq = maxEventId(msg.snapshot.events);
            this.handlers?.onStatus?.("live");
            break;
          case "resume": {
            this.retry = 0;
            this.resyncInFlight = false;
            if (this.resyncTimer) clearTimeout(this.resyncTimer);
            const top = maxEventId(msg.events);
            if (top > (this.lastSeq ?? 0)) this.lastSeq = top;
            this.handlers?.onStatus?.("live");
            break;
          }
          case "event": {
            const prevSeq = this.lastSeq ?? 0;
            // A skipped id means we dropped frames — pull the missing span.
            if (
              prevSeq > 0 &&
              msg.event.id > prevSeq + 1 &&
              !this.resyncInFlight
            ) {
              this.requestResume(prevSeq);
            }
            if (msg.event.id > prevSeq) this.lastSeq = msg.event.id;
            break;
          }
          default:
            break;
        }
        this.handlers?.onMessage(msg);
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onclose = () => {
      this.ws = null;
      if (!this.closed) this.scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose will follow and drive the reconnect.
      try {
        ws.close();
      } catch {
        /* noop */
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.closed) return;
    this.retry += 1;
    if (this.retry > 6) {
      this.handlers?.onStatus?.("closed");
      return;
    }
    const delay = Math.min(1000 * 2 ** (this.retry - 1), 15000);
    this.retryTimer = setTimeout(() => this.connect(), delay);
  }

  instruct(agentId: string, text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "instruct", agentId, text }));
    }
  }

  stop(): void {
    this.closed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    if (this.resyncTimer) clearTimeout(this.resyncTimer);
    this.resyncTimer = null;
    this.resyncInFlight = false;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* noop */
      }
      this.ws = null;
    }
    this.handlers = null;
  }
}
