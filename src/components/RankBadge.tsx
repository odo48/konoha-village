"use client";

import { RANKS } from "@/lib/ranks";
import { rankColor } from "@/lib/ui";
import type { RankId } from "@/lib/types";

export default function RankBadge({
  rank,
  size = "sm",
  showKanji = true,
}: {
  rank: RankId;
  size?: "sm" | "md";
  showKanji?: boolean;
}) {
  const meta = RANKS[rank];
  const c = rankColor(rank);
  const pad = size === "md" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide ${pad}`}
      style={{
        color: c,
        backgroundColor: "color-mix(in srgb, " + c + " 15%, transparent)",
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 45%, transparent)`,
      }}
      title={`${meta.label} — stands in for ${meta.softwareLevel}`}
    >
      {showKanji && <span style={{ opacity: 0.8 }}>{meta.kanji}</span>}
      {meta.label}
    </span>
  );
}
