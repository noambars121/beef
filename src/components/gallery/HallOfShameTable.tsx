"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GalleryEntry } from "@/lib/store/db";
import {
  REACTION_META,
  effectiveWinnerSide,
  formatDocketNo,
  getCategoryLabel,
  partyLabel,
} from "@/types";
import { PixelIcon, type PixelAsset } from "@/components/pixel/PixelIcon";

function rankAsset(index: number): PixelAsset | null {
  if (index === 0) return "rank1";
  if (index === 1) return "rank2";
  if (index === 2) return "rank3";
  return null;
}

function totalReactions(reactions: GalleryEntry["reactions"]): number {
  return reactions.reduce((sum, r) => sum + r.count, 0);
}

function entrySearchText(entry: GalleryEntry): string {
  const { case: caseRecord, parties, verdict, appeal } = entry;
  const finalWinner = effectiveWinnerSide(verdict, appeal);
  const winnerParty = parties.find((p) => p.side === finalWinner);
  const winnerName = partyLabel(finalWinner, winnerParty?.display_name);
  const roast = appeal?.roast_line ?? verdict.roast_line;
  const partyNames = parties
    .map((p) => partyLabel(p.side, p.display_name))
    .join(" ");

  return [
    caseRecord.title,
    formatDocketNo(caseRecord.docket_no),
    String(caseRecord.docket_no),
    getCategoryLabel(caseRecord.category),
    caseRecord.category,
    roast,
    verdict.short_verdict,
    winnerName,
    partyNames,
  ]
    .join(" ")
    .toLowerCase();
}

interface HallOfShameTableProps {
  entries: GalleryEntry[];
}

export function HallOfShameTable({ entries }: HallOfShameTableProps) {
  const [query, setQuery] = useState("");

  const ranked = useMemo(
    () => entries.map((entry, rankIndex) => ({ entry, rankIndex })),
    [entries]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(({ entry }) => entrySearchText(entry).includes(q));
  }, [ranked, query]);

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="sr-only">Search the leaderboard</span>
        <div className="flex items-stretch border-4 border-arcade-border bg-black focus-within:border-arcade-yellow">
          <span className="flex items-center border-r-4 border-arcade-border px-2.5 text-arcade-yellow">
            <PixelIcon asset="shameSkull" size={14} alt="" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH CASES, ROASTS, FIGHTERS…"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide text-foreground placeholder:text-court-muted outline-none sm:text-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="touch-target shrink-0 border-l-4 border-arcade-border px-3 font-arcade text-[7px] uppercase text-arcade-pink hover:bg-arcade-pink hover:text-black"
            >
              CLEAR
            </button>
          )}
        </div>
      </label>

      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="font-arcade text-[6px] uppercase tracking-wider text-court-muted sm:text-[7px]">
          {query.trim()
            ? `${filtered.length} HIT${filtered.length === 1 ? "" : "S"}`
            : `${entries.length} ENTRIES`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="border-4 border-dashed border-arcade-border bg-black/50 px-4 py-6 text-center">
          <p className="font-arcade text-[8px] uppercase text-arcade-pink sm:text-[9px]">
            NO MATCHES
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase text-court-muted">
            Try another search term.
          </p>
        </div>
      ) : (
        <div className="shame-board">
          <div className="shame-board-head">
            <span className="inline-flex items-center gap-1">
              <PixelIcon asset="shameSkull" size={12} alt="" />
              RANK
            </span>
            <span>CASE / ROAST</span>
            <span>WINNER</span>
            <span>HEAT</span>
            <span>CROWD</span>
          </div>

          <ul className="shame-board-body">
            {filtered.map(({ entry, rankIndex }) => {
              const { case: caseRecord, parties, verdict, appeal, reactions, heat } =
                entry;
              const medal = rankAsset(rankIndex);
              const isPodium = rankIndex < 3;
              const rowTone =
                rankIndex === 0
                  ? "shame-row-gold"
                  : rankIndex === 1
                    ? "shame-row-silver"
                    : rankIndex === 2
                      ? "shame-row-bronze"
                      : "";

              const finalWinner = effectiveWinnerSide(verdict, appeal);
              const winnerParty = parties.find((p) => p.side === finalWinner);
              const winnerName = partyLabel(finalWinner, winnerParty?.display_name);
              const overturned = appeal?.outcome === "overturned";
              const roast = appeal?.roast_line ?? verdict.roast_line;

              return (
                <li key={caseRecord.id}>
                  <Link
                    href={`/case/${caseRecord.id}`}
                    className={`shame-row ${rowTone} ${isPodium ? "shame-row-podium" : ""}`}
                  >
                    <div className="shame-cell shame-cell-rank">
                      {medal ? (
                        <>
                          <PixelIcon
                            asset={medal}
                            size={28}
                            alt={`Rank ${rankIndex + 1}`}
                            className="sm:hidden"
                          />
                          <PixelIcon
                            asset={medal}
                            size={32}
                            alt={`Rank ${rankIndex + 1}`}
                            className="hidden sm:block"
                          />
                        </>
                      ) : (
                        <span className="font-arcade text-[9px] text-court-muted sm:text-[10px]">
                          #{String(rankIndex + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    <div className="shame-cell shame-cell-case">
                      <div className="mb-0.5 flex flex-wrap items-center gap-1">
                        <span className="border border-arcade-border px-1 py-px font-arcade text-[5px] uppercase tracking-wider text-court-muted sm:text-[6px]">
                          {formatDocketNo(caseRecord.docket_no)}
                        </span>
                        <span className="border border-arcade-border px-1 py-px font-arcade text-[5px] uppercase tracking-wider text-court-muted sm:text-[6px]">
                          {getCategoryLabel(caseRecord.category)}
                        </span>
                        {overturned && (
                          <span className="border border-arcade-green px-1 py-px font-arcade text-[5px] uppercase tracking-wider text-arcade-green sm:text-[6px]">
                            OVERTURNED
                          </span>
                        )}
                        <span className="font-arcade text-[6px] uppercase tracking-wider text-arcade-yellow/80 sm:hidden">
                          {heat} PTS
                        </span>
                      </div>
                      <p className="w-full break-words font-mono text-[11px] font-bold leading-tight text-foreground sm:text-sm">
                        {caseRecord.title}
                      </p>
                      <p className="mt-0.5 w-full break-words font-mono text-[9px] italic leading-snug text-arcade-pink sm:text-[10px]">
                        &ldquo;{roast}&rdquo;
                      </p>
                      <div className="mt-1 flex w-full items-center gap-2 sm:hidden">
                        <span className="inline-flex min-w-0 items-center gap-0.5 font-arcade text-[6px] text-court-muted">
                          <PixelIcon
                            asset={finalWinner === "A" ? "fighterP1" : "fighterP2"}
                            size={14}
                            alt=""
                          />
                          <span className="truncate">{winnerName}</span>
                        </span>
                        <span className="ml-auto flex items-center gap-1.5">
                          {reactions.map((reaction) => (
                            <span
                              key={reaction.id}
                              className="inline-flex items-center gap-0.5 font-mono text-[8px] text-court-muted"
                            >
                              <PixelIcon
                                asset={REACTION_META[reaction.type].asset}
                                size={10}
                                alt=""
                              />
                              {reaction.count}
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>

                    <div className="shame-cell shame-cell-winner hidden sm:flex">
                      <PixelIcon
                        asset={finalWinner === "A" ? "fighterP1" : "fighterP2"}
                        size={32}
                        alt={winnerName}
                      />
                      <span
                        className={[
                          "max-w-full truncate text-center font-arcade text-[6px]",
                          finalWinner === "A" ? "text-arcade-blue" : "text-arcade-pink",
                        ].join(" ")}
                      >
                        {winnerName}
                      </span>
                    </div>

                    <div className="shame-cell shame-cell-viral hidden sm:flex">
                      <span className="shame-heat-value">{heat}</span>
                      <span className="shame-heat-label">PTS</span>
                    </div>

                    <div className="shame-cell shame-cell-crowd hidden sm:flex">
                      {reactions.map((reaction) => (
                        <span
                          key={reaction.id}
                          className="shame-crowd-chip"
                          title={REACTION_META[reaction.type].label}
                        >
                          <PixelIcon
                            asset={REACTION_META[reaction.type].asset}
                            size={12}
                            alt=""
                          />
                          <span className="font-mono text-[9px] text-foreground">
                            {reaction.count}
                          </span>
                        </span>
                      ))}
                      <span className="sr-only">Total {totalReactions(reactions)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
