// Core domain types for the Konoha board.
// The model follows Agent Works (projects -> work items -> runs/events) and
// clauboard's live agent view, re-skinned as the Hidden Leaf Village.

export type RankId =
  "academy" | "genin" | "chunin" | "jonin" | "anbu" | "kage" | "hokage";

export type RoleId =
  | "product-owner"
  | "business-analyst"
  | "tech-lead"
  | "ux-designer"
  | "frontend-dev"
  | "backend-dev"
  | "qa-automation"
  | "qa-manual"
  | "devops"
  | "engineering-manager";

// Agent lifecycle state (Agent Works AgentStatus, skinned).
export type AgentStatus = "idle" | "deployed" | "waiting" | "paused";

// Work item type: epic -> story -> task.
export type WorkItemType = "arc" | "mission" | "objective";

// Work item status (Agent Works WorkItemStatus, skinned to mission states).
export type WorkItemStatus =
  | "assigned" // todo / ready
  | "on_mission" // in progress
  | "reporting" // in review (PR open, report filed)
  | "complete" // merged / accepted
  | "sealed"; // blocked

// Difficulty, Naruto mission grading.
export type MissionRank = "D" | "C" | "B" | "A" | "S";

export type EventType =
  | "deploy" // run started
  | "tool" // tool call
  | "edit" // file edit
  | "report" // submit for review
  | "review" // review verdict
  | "trial" // CI check
  | "merge" // merged to main
  | "question" // ask_human
  | "answer" // human answered
  | "seal" // blocked
  | "unseal"; // unblocked

export interface Agent {
  id: string;
  name: string;
  role: RoleId;
  rank: RankId;
  status: AgentStatus;
  activity: string; // current activity line
  currentItemId?: string;
  chakra: number; // 0..100, "budget / usage" meter
  // position on the Village Map canvas (0..100 of the viewport box)
  pos: { x: number; y: number };
}

export interface WorkItem {
  id: string; // KEY-n
  type: WorkItemType;
  parentId?: string;
  projectId: string;
  title: string;
  description: string;
  assignee?: string; // agent id
  reviewerRole?: RoleId;
  status: WorkItemStatus;
  missionRank: MissionRank;
  dependsOn: string[]; // other work item ids
  prNumber?: number;
  reviewRounds: number;
  priority: number; // 1 = highest
}

export type ProjectPhase =
  "discovery" | "inception" | "planning" | "delivery" | "complete";

export interface Project {
  id: string;
  key: string; // item prefix, e.g. RAMEN
  name: string;
  brief: string;
  rank: MissionRank;
  phase: ProjectPhase;
}

export interface BoardEvent {
  id: number;
  ts: string; // ISO
  type: EventType;
  agentId?: string;
  workItemId?: string;
  summary: string;
}
