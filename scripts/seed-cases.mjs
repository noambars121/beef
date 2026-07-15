import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const convexBin = path.join(root, "node_modules", "convex", "bin", "main.js");

function run(fn, args) {
  const json = JSON.stringify(args);
  console.log(`> convex run ${fn} ${json}`);
  const out = execFileSync(process.execPath, [convexBin, "run", fn, json], {
    cwd: root,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  });
  return JSON.parse(out.trim() || "null");
}

const PURGE_IDS = [
  "j571sxt066brefgmjqj46d0h7x8ag2tt",
  "j573t9vpk52be4rmaxv2zc93p58ahvcs",
  "j577r0fwb7n485xbwvsktvc0e98ag3jb",
  "j577n5y7a4h95nadrmpbagavq58ahmbv",
  "j579c0591dba4wxhy90tyse0f58akfk0",
  "j57ctksrcx899xez4wx0xgxt8d8ajymc",
];

const OWNER = "demo-seed-session";

function og(title, params) {
  const q = new URLSearchParams({ title, ...params });
  return `/api/og?${q.toString()}`;
}

function closeCase(caseId, docketNo, payload) {
  run("cases:insertVerdict", {
    caseId,
    winner_side: payload.winner,
    short_verdict: payload.shortVerdict,
    full_reasoning: payload.reasoning,
    roast_line: payload.roast,
    share_image_url: og(payload.title, {
      winner: payload.winner,
      verdict: payload.shortVerdict.slice(0, 120),
      roast: payload.roast.slice(0, 120),
      case: String(docketNo),
      na: payload.na,
      nb: payload.nb,
      wa: String(payload.scores.A.logic + payload.scores.A.evidence),
      wb: String(payload.scores.B.logic + payload.scores.B.evidence),
    }),
    scores: payload.scores,
    shame_score: payload.shame,
  });
  run("cases:setViralSeed", { caseId, seed: payload.shame });
  if (payload.reactions) {
    for (const [type, count] of Object.entries(payload.reactions)) {
      for (let i = 0; i < count; i++) {
        run("cases:incrementReaction", { caseId, type });
      }
    }
  }
}

console.log("\n=== Purging junk cases ===");
for (const caseId of PURGE_IDS) {
  try {
    const result = run("internal.cases.purgeCase", { caseId });
    console.log(result);
  } catch {
    console.log(`Skipped ${caseId} (already gone)`);
  }
}

console.log("\n=== Closing existing gaming case ===");
closeCase("j578d708jjeyww2t1hasf3bp6x8ag75v", 5, {
  title: "Who abandoned the raid mid-boss fight?",
  winner: "B",
  na: "MARCUS",
  nb: "JADE",
  shortVerdict:
    "JADE wins. A Discord 'brb' is not a substitute for a main tank at 12% boss health.",
  reasoning:
    "MARCUS claims a family emergency justified abandoning progression night mid-pull. A timestamped 'brb family stuff' message proves notice, not coverage. JADE's logs show the tank offline for the final six minutes while the group wiped repeatedly. In organized group content, reliability is part of the social contract; emergency or not, the party suffered measurable harm from the absence.",
  roast:
    "MARCUS, you didn't leave a raid — you left four strangers performing CPR on a boss while you went to answer life's page.",
  scores: { A: { logic: 4, evidence: 6 }, B: { logic: 9, evidence: 9 } },
  shame: 78,
  reactions: { laugh: 2, shock: 1 },
});

const NEW_CASES = [
  {
    title: "Thermostat set to 68°F in January — who is wrong?",
    category: "roommates",
    side_a: {
      display_name: "Alex",
      argument_text:
        "I pay half the utilities. 68 keeps the bill sane and I wear a hoodie indoors. That's normal adult behavior.",
      evidence_summary: "Photo of thermostat at 68°F with timestamp Jan 14",
    },
    side_b: {
      display_name: "Sam",
      argument_text:
        "It's 19°F outside. I work from home and my fingers go numb during calls. 72 is the minimum for human habitation.",
      evidence_summary: "Slack message: 'I can see my breath in the kitchen'",
    },
    verdict: {
      winner: "B",
      na: "ALEX",
      nb: "SAM",
      shortVerdict:
        "SAM wins. Saving $12 on gas is not a license to run a shared apartment like an arctic research station.",
      reasoning:
        "ALEX cites cost control, but shared housing requires compromise on baseline livability, not unilateral austerity. SAM works from home and documented discomfort at 68°F during freezing weather. A reasonable roommate policy lands between extremes; unilaterally locking the heat to hoodie-only temperatures without agreement crosses the line.",
      roast:
        "ALEX, you're not fiscally responsible — you're running a crypto-mining operation where the only coin is hypothermia.",
      scores: { A: { logic: 5, evidence: 6 }, B: { logic: 8, evidence: 8 } },
      shame: 74,
      reactions: { agree: 2, laugh: 1 },
    },
  },
  {
    title: "Reply-all email disaster — who owes the apology?",
    category: "work",
    side_a: {
      display_name: "Priya",
      argument_text:
        "I was venting to my manager about the quarterly review. I didn't mean to hit Reply All — Outlook autocomplete betrayed me.",
      evidence_summary: "Email headers showing accidental Reply All to company-wide list",
    },
    side_b: {
      display_name: "Derek",
      argument_text:
        "The entire company now knows I 'phone it in after lunch.' That wasn't feedback — that was career sabotage via misclick.",
      evidence_summary: "Forwarded email chain with 847 recipients",
    },
    verdict: {
      winner: "A",
      na: "PRIYA",
      nb: "DEREK",
      shortVerdict:
        "PRIYA wins on intent, but must apologize publicly anyway because Reply All is a weapon of mass destruction.",
      reasoning:
        "DEREK suffered real reputational harm from a careless send. However, PRIYA's evidence shows the message was intended for a manager, not broadcast malice. Workplace norms still require PRIYA to own the mistake with a company-wide apology and process fix — autocomplete is an explanation, not absolution. DEREK's damages are real; PRIYA's negligence caused them.",
      roast:
        "PRIYA, Outlook didn't betray you — you handed it a loaded gun and looked surprised when it fired into 847 inboxes.",
      scores: { A: { logic: 7, evidence: 8 }, B: { logic: 8, evidence: 9 } },
      shame: 81,
      reactions: { shock: 3, laugh: 2 },
    },
  },
  {
    title: "Forgot anniversary for FIFA launch night — guilty?",
    category: "relationships",
    side_a: {
      display_name: "Chris",
      argument_text:
        "EA Sports FC 25 dropped at midnight. I pre-ordered months ago. I brought flowers the next morning and ordered her favorite Thai.",
      evidence_summary: "Receipt for flowers + Thai food dated next day",
    },
    side_b: {
      display_name: "Taylor",
      argument_text:
        "Our third anniversary was on the calendar for six months. A midnight game launch is not a force majeure event for romance.",
      evidence_summary: "Shared Google Calendar event marked 'Anniversary dinner'",
    },
    verdict: {
      winner: "B",
      na: "CHRIS",
      nb: "TAYLOR",
      shortVerdict:
        "TAYLOR wins. Flowers at 10am do not retroactively un-cancel a relationship milestone you traded for virtual kickball.",
      reasoning:
        "CHRIS's remediation attempt shows awareness of wrongdoing, which counts for something — but not victory. A six-month calendar hold is unambiguous notice. Choosing a midnight game over an anniversary dinner is a priority statement, not an accident. CHRIS created the conflict; next-day Thai is damage control, not defense.",
      roast:
        "CHRIS, you didn't forget the anniversary — you rescheduled your girlfriend for a patch note.",
      scores: { A: { logic: 3, evidence: 5 }, B: { logic: 9, evidence: 9 } },
      shame: 88,
      reactions: { laugh: 3, agree: 2 },
    },
  },
  {
    title: "Uber split after concert — who stiffed who?",
    category: "money",
    side_a: {
      display_name: "Jordan",
      argument_text:
        "I paid for the Uber upfront because my card was on file. I Venmo-requested everyone $18 each. Only two people paid back.",
      evidence_summary: "Venmo history showing 2/4 payments received",
    },
    side_b: {
      display_name: "Riley",
      argument_text:
        "The ride was to MY apartment. Everyone else got dropped off first. Why am I paying the same as someone who lives 20 minutes closer?",
      evidence_summary: "Uber receipt showing drop-off order and total $72",
    },
    verdict: {
      winner: "A",
      na: "JORDAN",
      nb: "RILEY",
      shortVerdict:
        "JORDAN wins. You agreed to split four ways before the ride — destination order is not a retroactive coupon.",
      reasoning:
        "RILEY's fairness argument has moral weight but weak contractual force. Group rides typically split evenly unless agreed otherwise upfront. RILEY benefited from door-to-door service to their home while others transferred to other lines. JORDAN fronted $72 and documented partial repayment failure. The deadbeats who didn't pay are the real villains; RILEY still owes their share under the original deal.",
      roast:
        "RILEY, you wanted a progressive fare tax based on geography — what you got was a friendship audit that you are failing.",
      scores: { A: { logic: 8, evidence: 9 }, B: { logic: 6, evidence: 7 } },
      shame: 70,
      reactions: { agree: 1, shock: 1 },
    },
  },
];

console.log("\n=== Creating new cases ===");
for (const spec of NEW_CASES) {
  const created = run("cases:create", {
    title: spec.title,
    category: spec.category,
    owner_session_id: OWNER,
    side_a: spec.side_a,
    side_b: spec.side_b,
  });
  console.log("Created", created);
  const caseDoc = run("cases:get", { caseId: created.case_id });
  closeCase(created.case_id, caseDoc.docket_no, {
    title: spec.title,
    ...spec.verdict,
  });
}

console.log("\n=== Done ===");
