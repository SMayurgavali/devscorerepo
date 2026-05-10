// Level-Up Roadmap engine.
// Given a user's score report, generates a prioritized, time-bounded action plan
// that maps each gap to an estimated point gain and an effort level.
// This is the "Don't just see your grade. Fix it." engine from the landing page.

import type { Pillar, ScoreReport, Grade } from "./score";

export interface RoadmapStep {
  id: string;
  pillar: "linkedin" | "code" | "dsa";
  title: string;
  detail: string;
  effort: "30 min" | "2 hrs" | "1 week" | "1 month";
  pointGain: number;
  cta?: { label: string; href: string };
}

export interface Roadmap {
  currentGrade: Grade;
  nextGrade: Grade | null;
  pointsToNext: number;
  steps: RoadmapStep[];
}

const GRADE_THRESHOLDS: { grade: Grade; min: number }[] = [
  { grade: "A+", min: 850 },
  { grade: "A",  min: 700 },
  { grade: "B",  min: 550 },
  { grade: "C",  min: 350 },
  { grade: "D",  min: 0   },
];

function nextGrade(current: Grade): { grade: Grade | null; min: number } {
  const idx = GRADE_THRESHOLDS.findIndex((g) => g.grade === current);
  if (idx <= 0) return { grade: null, min: 1000 };
  const above = GRADE_THRESHOLDS[idx - 1];
  return { grade: above.grade, min: above.min };
}

export function buildRoadmap(report: ScoreReport): Roadmap {
  const next = nextGrade(report.grade);
  const pointsToNext = Math.max(0, next.min - report.total);

  const steps: RoadmapStep[] = [];
  for (const p of report.pillars) {
    steps.push(...stepsForPillar(p));
  }
  // sort by best ROI: highest gain ÷ effort weight
  const effortWeight: Record<RoadmapStep["effort"], number> = {
    "30 min": 0.5, "2 hrs": 1, "1 week": 3, "1 month": 8,
  };
  steps.sort((a, b) => (b.pointGain / effortWeight[b.effort]) - (a.pointGain / effortWeight[a.effort]));

  return {
    currentGrade: report.grade,
    nextGrade: next.grade,
    pointsToNext,
    steps: steps.slice(0, 8),
  };
}

function stepsForPillar(p: Pillar): RoadmapStep[] {
  const out: RoadmapStep[] = [];
  for (const item of p.items) {
    const gap = item.max - item.value;
    if (gap < 5) continue; // already nearly maxed
    out.push(...mapItemToSteps(p.key, item.label, gap));
  }
  return out;
}

function mapItemToSteps(pillar: RoadmapStep["pillar"], label: string, gap: number): RoadmapStep[] {
  // Heuristic mapping of metric → human action
  const k = label.toLowerCase();

  if (pillar === "linkedin") {
    if (k.includes("headline")) return [{ id: l(), pillar, title: "Rewrite your LinkedIn headline with target role + stack", detail: "Use the format: '<Role> · <Stack> · Building <Domain>'. Recruiters search by keywords — make sure 'React', 'Node', 'AWS' etc. appear.", effort: "30 min", pointGain: Math.min(25, gap), cta: { label: "Open LinkedIn", href: "https://linkedin.com/in/me" } }];
    if (k.includes("summary") || k.includes("about")) return [{ id: l(), pillar, title: "Write a 3-paragraph About section with metrics", detail: "Include: who you are · what you build · 2 quantified wins (e.g. '300+ users', '99.9% uptime'). End with a call-to-action.", effort: "2 hrs", pointGain: Math.min(25, gap) }];
    if (k.includes("recommendation")) return [{ id: l(), pillar, title: "Request 2 LinkedIn recommendations", detail: "Ask one professor and one teammate. Send a 3-line message with bullet points they can paste & edit. Most reply within 48 hours.", effort: "30 min", pointGain: Math.min(30, gap) }];
    if (k.includes("500")) return [{ id: l(), pillar, title: "Grow to 500+ connections", detail: "Connect with classmates, professors, alumni from your college, and people who attended events you went to. 10 invites/day for 2 weeks gets you there.", effort: "1 week", pointGain: Math.min(30, gap) }];
    if (k.includes("skills")) return [{ id: l(), pillar, title: "Add 10+ relevant skills + take 1 LinkedIn skill assessment", detail: "Skill assessments earn a verified badge — recruiters filter on these.", effort: "30 min", pointGain: Math.min(20, gap) }];
    if (k.includes("experience")) return [{ id: l(), pillar, title: "Add at least one detailed project entry", detail: "Use STAR: Situation · Task · Action · Result. Link the GitHub repo and live URL.", effort: "2 hrs", pointGain: Math.min(30, gap) }];
    if (k.includes("linked")) return [{ id: l(), pillar, title: "Add your LinkedIn URL to your DevScore profile", detail: "Without it, you forfeit 200 points immediately.", effort: "30 min", pointGain: Math.min(40, gap) }];
  }

  if (pillar === "code") {
    if (k.includes("streak")) return [{ id: l(), pillar, title: "Build a 14-day commit streak", detail: "Even small commits count — README updates, tests, refactors. Use a daily reminder. The 'green squares' are the #1 signal recruiters scan for.", effort: "1 week", pointGain: Math.min(60, gap), cta: { label: "Open GitHub", href: "https://github.com" } }];
    if (k.includes("recent commits")) return [{ id: l(), pillar, title: "Ship 30 commits this month", detail: "Pick one project and commit daily. Frequency > size.", effort: "1 month", pointGain: Math.min(60, gap) }];
    if (k.includes("stars") || k.includes("impact")) return [{ id: l(), pillar, title: "Polish your flagship repo for stars", detail: "Add: animated GIF demo · clear README with screenshots · one-line install · live deployed URL · 'good first issue' labels. Then post on r/webdev or HN Show.", effort: "1 week", pointGain: Math.min(50, gap) }];
    if (k.includes("repositories") || k.includes("repos")) return [{ id: l(), pillar, title: "Publish 3 small but real projects", detail: "Not tutorials. Solve a problem you actually have. A budget tracker, a study-buddy bot, anything real.", effort: "1 month", pointGain: Math.min(40, gap) }];
    if (k.includes("language") || k.includes("breadth")) return [{ id: l(), pillar, title: "Add 2 languages to your repo mix", detail: "Pick complementary ones — e.g. add Go or Rust if you're a JS dev. Each language seen on GitHub adds points.", effort: "1 week", pointGain: Math.min(20, gap) }];
    if (k.includes("followers")) return [{ id: l(), pillar, title: "Engage on GitHub", detail: "Follow 50 devs in your stack, star great repos, leave thoughtful PR comments. Followers grow naturally.", effort: "1 week", pointGain: Math.min(15, gap) }];
    if (k.includes("platform linked")) return [{ id: l(), pillar, title: "Connect your GitHub username", detail: "Without it, you forfeit 400 points — the largest pillar.", effort: "30 min", pointGain: 200 }];
  }

  if (pillar === "dsa") {
    if (k.includes("problems solved")) return [{ id: l(), pillar, title: "Cross 100 LeetCode problems", detail: "100 is the soft cutoff most product-based companies use. Solve 2/day for ~50 days.", effort: "1 month", pointGain: Math.min(80, gap), cta: { label: "Open LeetCode", href: "https://leetcode.com/problemset/" } }];
    if (k.includes("difficulty")) return [{ id: l(), pillar, title: "Solve 5 Hard + 15 Medium problems", detail: "Pick one Hard per week from the NeetCode 150 list. Mediums build pattern recognition.", effort: "1 month", pointGain: Math.min(80, gap) }];
    if (k.includes("acceptance")) return [{ id: l(), pillar, title: "Push acceptance rate above 70%", detail: "Slow down. Read the problem twice. Dry-run on paper before coding. One thoughtful submission > five wrong ones.", effort: "1 week", pointGain: Math.min(20, gap) }];
    if (k.includes("codechef")) return [{ id: l(), pillar, title: "Participate in 4 CodeChef contests", detail: "One contest a week. Even attempting 1–2 problems moves your rating. Aim for 1600+ rating (3★).", effort: "1 month", pointGain: Math.min(40, gap) }];
    if (k.includes("hackerrank")) return [{ id: l(), pillar, title: "Earn 5 HackerRank skill badges", detail: "Quick wins: Problem Solving, SQL, Java/Python. Each badge is a verified credential recruiters can filter on.", effort: "1 week", pointGain: Math.min(40, gap) }];
    if (k.includes("platform linked")) return [{ id: l(), pillar, title: "Connect your LeetCode handle", detail: "Without it, you forfeit 400 points and look like you avoid DSA.", effort: "30 min", pointGain: 150 }];
  }

  return [];
}

let _i = 0;
const l = () => `step-${++_i}`;
