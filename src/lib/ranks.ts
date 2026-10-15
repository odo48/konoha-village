import type { RankId, RoleId } from "./types";

// ---------------------------------------------------------------------------
// The rank ladder: the literal "levels" replacement.
// Software seniority -> ninja rank. order drives sorting / progression.
// ---------------------------------------------------------------------------
export interface RankMeta {
  id: RankId;
  label: string; // romaji
  kanji: string;
  softwareLevel: string; // the original level this stands in for
  order: number;
  colorVar: string; // css var name in globals.css
  blurb: string;
}

export const RANKS: Record<RankId, RankMeta> = {
  academy: {
    id: "academy",
    label: "Academy Student",
    kanji: "学生",
    softwareLevel: "Intern / Trainee",
    order: 0,
    colorVar: "--rank-academy",
    blurb: "Not yet dispatched on real missions.",
  },
  genin: {
    id: "genin",
    label: "Genin",
    kanji: "下忍",
    softwareLevel: "Junior",
    order: 1,
    colorVar: "--rank-genin",
    blurb: "Entry-level operative.",
  },
  chunin: {
    id: "chunin",
    label: "Chūnin",
    kanji: "中忍",
    softwareLevel: "Mid",
    order: 2,
    colorVar: "--rank-chunin",
    blurb: "Can lead a small squad.",
  },
  jonin: {
    id: "jonin",
    label: "Jōnin",
    kanji: "上忍",
    softwareLevel: "Senior",
    order: 3,
    colorVar: "--rank-jonin",
    blurb: "Elite individual contributor.",
  },
  anbu: {
    id: "anbu",
    label: "ANBU",
    kanji: "暗部",
    softwareLevel: "Principal / Specialist",
    order: 4,
    colorVar: "--rank-anbu",
    blurb: "Elite specialist, covert operations.",
  },
  kage: {
    id: "kage",
    label: "Kage-rank",
    kanji: "影",
    softwareLevel: "Lead / Manager",
    order: 5,
    colorVar: "--rank-kage",
    blurb: "Commands squads.",
  },
  hokage: {
    id: "hokage",
    label: "Hokage",
    kanji: "火影",
    softwareLevel: "Owner / Director",
    order: 6,
    colorVar: "--rank-hokage",
    blurb: "Leads the village.",
  },
};

export const RANK_ORDER: RankId[] = Object.values(RANKS)
  .sort((a, b) => a.order - b.order)
  .map((r) => r.id);

// ---------------------------------------------------------------------------
// Role mapping: Agent Works role -> village role -> default rank -> flavor.
// `orig*` keeps the plain (software) terms for the flavor toggle.
// ---------------------------------------------------------------------------
export interface RoleMeta {
  id: RoleId;
  villageRole: string;
  defaultRank: RankId;
  character: string; // inspiration
  origRole: string; // plain label
  origTitle: string; // plain title
  emoji: string;
}

export const ROLES: Record<RoleId, RoleMeta> = {
  "product-owner": {
    id: "product-owner",
    villageRole: "Hokage's Envoy",
    defaultRank: "hokage",
    character: "Tsunade",
    origRole: "Product Owner",
    origTitle: "Senior Product Owner",
    emoji: "🌸",
  },
  "business-analyst": {
    id: "business-analyst",
    villageRole: "Scroll Keeper",
    defaultRank: "chunin",
    character: "Shikamaru",
    origRole: "Business Analyst",
    origTitle: "Senior Business Analyst",
    emoji: "📜",
  },
  "tech-lead": {
    id: "tech-lead",
    villageRole: "Squad Captain / Architect",
    defaultRank: "kage",
    character: "Kakashi",
    origRole: "Tech Lead",
    origTitle: "Senior Tech Lead / Architect",
    emoji: "⚡",
  },
  "ux-designer": {
    id: "ux-designer",
    villageRole: "Genjutsu Artisan",
    defaultRank: "jonin",
    character: "Kurenai",
    origRole: "UX Designer",
    origTitle: "Senior Product Designer (UX/UI)",
    emoji: "🎴",
  },
  "frontend-dev": {
    id: "frontend-dev",
    villageRole: "Frontline Shinobi",
    defaultRank: "jonin",
    character: "Naruto",
    origRole: "Frontend Developer",
    origTitle: "Senior Frontend Developer",
    emoji: "🍥",
  },
  "backend-dev": {
    id: "backend-dev",
    villageRole: "Infrastructure Shinobi",
    defaultRank: "jonin",
    character: "Sasuke",
    origRole: "Backend Developer",
    origTitle: "Senior Backend Developer",
    emoji: "🔩",
  },
  "qa-automation": {
    id: "qa-automation",
    villageRole: "Trap Master",
    defaultRank: "anbu",
    character: "Tenten",
    origRole: "QA Automation",
    origTitle: "Senior QA Automation Engineer",
    emoji: "🎯",
  },
  "qa-manual": {
    id: "qa-manual",
    villageRole: "Byakugan Inspector",
    defaultRank: "chunin",
    character: "Hinata",
    origRole: "QA (Exploratory)",
    origTitle: "Senior QA Engineer (Exploratory & Acceptance)",
    emoji: "👁️",
  },
  devops: {
    id: "devops",
    villageRole: "Gatekeeper",
    defaultRank: "anbu",
    character: "Might Guy",
    origRole: "DevOps",
    origTitle: "Senior DevOps / Platform Engineer",
    emoji: "🛡️",
  },
  "engineering-manager": {
    id: "engineering-manager",
    villageRole: "Jōnin Commander (Mission Desk)",
    defaultRank: "kage",
    character: "Shikaku Nara",
    origRole: "Engineering Manager",
    origTitle: "Engineering Manager",
    emoji: "🗂️",
  },
};
