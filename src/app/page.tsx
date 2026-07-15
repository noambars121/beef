"use client";

import Link from "next/link";
import { BuilderCredit } from "@/components/layout/BuilderCredit";
import { PixelIcon } from "@/components/pixel/PixelIcon";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-3 py-2 text-center sm:px-6 sm:py-3">
      <div className="m-auto flex w-full flex-col items-center py-2">
      <p className="font-arcade text-[10px] uppercase tracking-[0.25em] text-arcade-pink text-flash sm:text-[11px] sm:tracking-[0.4em]">
        INSERT BEEF TO START
      </p>

      <h1 className="beef-title-fx mt-4 font-arcade text-5xl leading-snug arcade-gradient-text sm:mt-6 sm:text-6xl md:text-7xl">
        BEEF
      </h1>

      <p className="beef-sub-fx mt-4 px-2 font-mono text-[clamp(0.9rem,4vw,1.25rem)] font-bold uppercase leading-snug tracking-wide sm:mt-6 sm:whitespace-nowrap sm:tracking-wider">
        Don&apos;t just win the argument.
        <br className="sm:hidden" />{" "}
        Destroy their ego
      </p>

      {/* Matching CTA buttons — same display size */}
      <div className="mt-8 flex w-full max-w-sm flex-col items-center gap-4 px-2 sm:mt-10 sm:max-w-none sm:flex-row sm:justify-center sm:gap-6">
        <Link
          href="/case/new"
          className="group touch-target block transition-transform hover:-translate-y-1 active:translate-y-0"
          aria-label="Call the Judge"
        >
          <PixelIcon
            asset="btnInsert"
            size={320}
            height={96}
            alt="CALL THE JUDGE"
            priority
            className="h-auto w-[280px] drop-shadow-[0_4px_0_#000] transition-transform group-hover:brightness-110 sm:w-[320px]"
          />
        </Link>
        <Link
          href="/gallery"
          className="group touch-target block transition-transform hover:-translate-y-1 active:translate-y-0"
          aria-label="Hall of Shame"
        >
          <PixelIcon
            asset="btnHall"
            size={320}
            height={96}
            alt="HALL OF SHAME"
            priority
            className="h-auto w-[280px] drop-shadow-[0_4px_0_#000] transition-transform group-hover:brightness-110 sm:w-[320px]"
          />
        </Link>
      </div>

      {/* Legal microcopy — entertainment only, links to the AI disclosure */}
      <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-court-muted sm:mt-5 sm:text-[11px] sm:tracking-[0.2em]">
        FOR PETTY DEBATES.{" "}
        <Link
          href="/ai-disclosure"
          className="text-arcade-blue underline decoration-arcade-blue/40 underline-offset-4 transition-colors hover:text-arcade-yellow hover:decoration-arcade-yellow/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-yellow"
        >
          NOT SERIOUS DISPUTES.
        </Link>
      </p>

      {/* Matching stat tiles — same square size */}
      <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-3 px-2 sm:mt-12 sm:max-w-xl sm:gap-6">
        {(
          [
            { asset: "statPlayers" as const, label: "2P Players" },
            { asset: "statVerdict" as const, label: "1 Verdict" },
            { asset: "statMercy" as const, label: "00 Mercy" },
          ] as const
        ).map((item) => (
          <div key={item.asset} className="flex justify-center">
            <PixelIcon
              asset={item.asset}
              size={140}
              alt={item.label}
              className="h-auto w-full max-w-[110px] drop-shadow-[0_4px_0_#000] sm:max-w-[140px]"
            />
          </div>
        ))}
      </div>

      <p className="mt-6 sm:mt-8">
        <BuilderCredit />
      </p>
      </div>
    </main>
  );
}
