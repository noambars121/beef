"use client";

import Link from "next/link";
import { BuilderCredit } from "@/components/layout/BuilderCredit";
import { PixelIcon } from "@/components/pixel/PixelIcon";

export default function HomePage() {
  return (
    <main className="page-shell-home relative z-10 text-center">
      <p className="font-arcade text-[9px] uppercase tracking-[0.25em] text-arcade-pink text-flash max-[700px]:text-[8px] sm:text-[11px] sm:tracking-[0.4em]">
        INSERT BEEF TO START
      </p>

      <h1 className="beef-title-fx mt-2 font-arcade text-[clamp(2.5rem,12vw,4.5rem)] leading-snug arcade-gradient-text max-[700px]:mt-1.5 sm:mt-3">
        BEEF
      </h1>

      <p className="beef-sub-fx mt-2 px-2 font-mono text-[clamp(0.8rem,3.4vw,1.15rem)] font-bold uppercase leading-snug tracking-wide max-[700px]:mt-1.5 sm:mt-3 sm:whitespace-nowrap sm:tracking-wider">
        Don&apos;t just win the argument.
        <br className="sm:hidden" />{" "}
        Destroy their ego
      </p>

      <div className="mt-4 flex w-full max-w-sm flex-col items-center gap-2.5 px-2 max-[700px]:mt-3 max-[700px]:gap-2 sm:mt-5 sm:max-w-none sm:flex-row sm:justify-center sm:gap-5">
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
            className="h-auto w-[min(240px,72vw)] drop-shadow-[0_4px_0_#000] transition-transform group-hover:brightness-110 max-[700px]:w-[min(210px,68vw)] sm:w-[280px]"
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
            className="h-auto w-[min(240px,72vw)] drop-shadow-[0_4px_0_#000] transition-transform group-hover:brightness-110 max-[700px]:w-[min(210px,68vw)] sm:w-[280px]"
          />
        </Link>
      </div>

      <p className="mt-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-court-muted max-[700px]:mt-2 sm:mt-3 sm:text-[11px] sm:tracking-[0.2em]">
        FOR PETTY DEBATES.{" "}
        <Link
          href="/ai-disclosure"
          className="text-arcade-blue underline decoration-arcade-blue/40 underline-offset-4 transition-colors hover:text-arcade-yellow hover:decoration-arcade-yellow/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-yellow"
        >
          NOT SERIOUS DISPUTES.
        </Link>
      </p>

      <p
        className="mt-2 inline-flex max-w-[min(100%,22rem)] items-center gap-1.5 border-2 bg-black/70 px-2.5 py-1 font-arcade text-[6px] uppercase leading-snug tracking-widest max-[700px]:mt-1.5 sm:text-[7px]"
        style={{
          borderColor: "#836EF9",
          color: "#836EF9",
          boxShadow: "0 0 12px #836EF955",
        }}
      >
        ⛓ EVERY VERDICT SEALED ON MONAD — TAMPER-PROOF COURT RECORD
      </p>

      <div className="mt-3 grid w-full max-w-md grid-cols-3 gap-2 px-2 max-[700px]:mt-2 max-[700px]:gap-1.5 sm:mt-4 sm:max-w-lg sm:gap-4">
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
              className="h-auto w-full max-w-[72px] drop-shadow-[0_4px_0_#000] max-[700px]:max-w-[60px] sm:max-w-[100px]"
            />
          </div>
        ))}
      </div>

      <p className="mt-2.5 max-[700px]:mt-2 sm:mt-3">
        <BuilderCredit />
      </p>
    </main>
  );
}
