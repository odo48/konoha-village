import type {
  WorkItemType,
  WorkItemStatus,
  MissionRank,
  EventType,
  ProjectPhase,
} from "./types";

// The flavor toggle: Konoha terms <-> plain (Agent Works / clauboard) terms.
export type Flavor = "konoha" | "plain";

export const WORK_ITEM_TYPE_LABEL: Record<
  WorkItemType,
  Record<Flavor, string>
> = {
  arc: { konoha: "Mission Arc", plain: "Epic" },
  mission: { konoha: "Mission", plain: "Story" },
  objective: { konoha: "Objective", plain: "Task" },
};

export const STATUS_LABEL: Record<WorkItemStatus, Record<Flavor, string>> = {
  assigned: { konoha: "Assigned", plain: "To Do" },
  on_mission: { konoha: "On Mission", plain: "In Progress" },
  reporting: { konoha: "Reporting In", plain: "In Review" },
  complete: { konoha: "Mission Complete", plain: "Done" },
  sealed: { konoha: "Sealed", plain: "Blocked" },
};

export const STATUS_ORDER: WorkItemStatus[] = [
  "assigned",
  "on_mission",
  "reporting",
  "complete",
  "sealed",
];

export const PHASE_LABEL: Record<ProjectPhase, Record<Flavor, string>> = {
  discovery: { konoha: "Scouting", plain: "Discovery" },
  inception: { konoha: "Planning the Raid", plain: "Inception" },
  planning: { konoha: "Mission Briefing", plain: "Planning" },
  delivery: { konoha: "Deployment", plain: "Delivery" },
  complete: { konoha: "Village Secured", plain: "Complete" },
};

export const EVENT_LABEL: Record<EventType, Record<Flavor, string>> = {
  deploy: { konoha: "Deployed", plain: "Run started" },
  tool: { konoha: "Jutsu", plain: "Tool call" },
  edit: { konoha: "Scroll edited", plain: "File edit" },
  report: { konoha: "Report filed", plain: "Submitted for review" },
  review: { konoha: "Report reviewed", plain: "Review verdict" },
  trial: { konoha: "Trial", plain: "CI check" },
  merge: { konoha: "Mission complete", plain: "Merged to main" },
  question: { konoha: "Asks the Daimyō", plain: "Asked human" },
  answer: { konoha: "Daimyō answers", plain: "Human answered" },
  seal: { konoha: "Sealed", plain: "Blocked" },
  unseal: { konoha: "Seal released", plain: "Unblocked" },
};

export const EVENT_ICON: Record<EventType, string> = {
  deploy: "🚀",
  tool: "🌀",
  edit: "📝",
  report: "📨",
  review: "🔍",
  trial: "⚔️",
  merge: "✅",
  question: "❓",
  answer: "💬",
  seal: "🔒",
  unseal: "🔓",
};

export const MISSION_RANK_BLURB: Record<MissionRank, string> = {
  D: "Routine — chores inside the village.",
  C: "Standard — minor risk, no combat expected.",
  B: "Elevated — may involve skilled opponents.",
  A: "High — dangerous, elite operatives required.",
  S: "Critical — the village itself is at stake.",
};

// Vocabulary used in headings/labels across the shell.
export const TERMS = {
  village: { konoha: "Konoha", plain: "Company" },
  project: { konoha: "Mission", plain: "Project" },
  projects: { konoha: "Missions", plain: "Projects" },
  roster: { konoha: "Shinobi Roster", plain: "Agent Roster" },
  map: { konoha: "Village Map", plain: "Agent Canvas" },
  board: { konoha: "Mission Board", plain: "Task Board" },
  log: { konoha: "Mission Log", plain: "Event Stream" },
  client: { konoha: "Daimyō", plain: "Owner" },
  chakra: { konoha: "Chakra", plain: "Usage budget" },
  deps: { konoha: "Chakra threads", plain: "Dependencies" },
} as const;

export function term(
  key: keyof typeof TERMS,
  flavor: Flavor,
): string {
  return TERMS[key][flavor];
}
