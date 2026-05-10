// DevScore engine — three pillars only.
//   1. LinkedIn (Branding & Network)         — 200 pts
//   2. GitHub / GitLab (Proof of Work)       — 400 pts
//   3. LeetCode / HackerRank / CodeChef DSA  — 400 pts
//   ────────────────────────────────────────────────
//   Total                                    1000 pts
//
// Letter grade: A+ ≥850 · A ≥700 · B ≥550 · C ≥350 · D <350
// Designed to mirror common ATS rubrics so recruiters can interpret quickly.

import type { LinkedInChecklist, ScoreSnapshot, User, UserStats } from "./db";

export type Grade = "A+" | "A" | "B" | "C" | "D";

export interface Pillar {
  key: "linkedin" | "code" | "dsa";
  label: string;
  score: number;
  max: number;
  items: { label: string; value: number; max: number; note: string }[];
  insights: string[]; // actionable suggestions
}
export interface ScoreReport {
  total: number;
  grade: Grade;
  pillars: Pillar[];
}

export function gradeFor(score: number): Grade {
  if (score >= 850) return "A+";
  if (score >= 700) return "A";
  if (score >= 550) return "B";
  if (score >= 350) return "C";
  return "D";
}

export function gradeMeta(g: Grade) {
  switch (g) {
    case "A+": return { label: "Excellent", color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", bar: "bg-emerald-500" };
    case "A":  return { label: "Strong",    color: "text-indigo-700",  bg: "bg-indigo-50",  ring: "ring-indigo-200",  bar: "bg-indigo-500" };
    case "B":  return { label: "Good",      color: "text-sky-700",     bg: "bg-sky-50",     ring: "ring-sky-200",     bar: "bg-sky-500" };
    case "C":  return { label: "Average",   color: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-200",   bar: "bg-amber-500" };
    default:   return { label: "Needs Work",color: "text-rose-700",    bg: "bg-rose-50",    ring: "ring-rose-200",    bar: "bg-rose-500" };
  }
}

const cap = (v: number, max: number) => Math.min(max, Math.max(0, v));

export function computeReport(user?: Partial<User>): ScoreReport {
  const stats: UserStats | undefined = user?.stats;
  const pillars: Pillar[] = [
    linkedinPillar(user?.linkedin, user?.linkedinChecklist),
    codePillar(stats),
    dsaPillar(stats),
  ];
  const total = Math.round(pillars.reduce((a, p) => a + p.score, 0));
  return { total, grade: gradeFor(total), pillars };
}

function linkedinPillar(url?: string, c?: LinkedInChecklist): Pillar {
  const items: Pillar["items"] = [];
  const insights: string[] = [];
  const linked = !!url && url.includes("linkedin.com");

  const link = linked ? 40 : 0;
  items.push({ label: "Profile linked", value: link, max: 40, note: linked ? "Verified URL" : "Add your LinkedIn URL" });
  if (!linked) insights.push("Add your LinkedIn URL to start scoring this pillar.");

  const cl: LinkedInChecklist = c || {
    hasHeadline: false, hasSummary: false, hasExperience: false,
    hasSkills: false, hasRecommendations: false, has500Plus: false,
  };

  const headline = cl.hasHeadline ? 25 : 0;
  items.push({ label: "Keyword-rich headline", value: headline, max: 25, note: cl.hasHeadline ? "Set" : "Add a 220-char headline with target role + stack" });
  if (!cl.hasHeadline) insights.push("Recruiters search by keywords — put your stack in your headline.");

  const summary = cl.hasSummary ? 25 : 0;
  items.push({ label: "Summary / About section", value: summary, max: 25, note: cl.hasSummary ? "Set" : "Write a short pitch with metrics" });
  if (!cl.hasSummary) insights.push("Add an About section that quantifies impact (e.g. '300+ users', '10k req/min').");

  const exp = cl.hasExperience ? 30 : 0;
  items.push({ label: "Experience / projects", value: exp, max: 30, note: cl.hasExperience ? "Set" : "Add at least one role or project" });
  if (!cl.hasExperience) insights.push("Add internships, freelance work, or detailed project entries.");

  const skills = cl.hasSkills ? 20 : 0;
  items.push({ label: "Skills section filled", value: skills, max: 20, note: cl.hasSkills ? "Set" : "Add 10+ relevant skills" });

  const rec = cl.hasRecommendations ? 30 : 0;
  items.push({ label: "Recommendations", value: rec, max: 30, note: cl.hasRecommendations ? "1+ received" : "Ask a teammate or professor" });
  if (!cl.hasRecommendations) insights.push("Request 1–2 recommendations — they hugely boost recruiter trust.");

  const conn = cl.has500Plus ? 30 : 0;
  items.push({ label: "500+ connections", value: conn, max: 30, note: cl.has500Plus ? "Reached" : "Grow your network past 500" });

  const score = items.reduce((a, b) => a + b.value, 0);
  return { key: "linkedin", label: "Branding (LinkedIn)", score, max: 200, items, insights };
}

function codePillar(stats?: UserStats): Pillar {
  const items: Pillar["items"] = [];
  const insights: string[] = [];

  const g = stats?.github;
  const gl = stats?.gitlab;
  const linked = !!g || !!gl;

  if (!linked) {
    insights.push("Connect GitHub or GitLab — this is the #1 thing recruiters check.");
    return {
      key: "code", label: "Proof of Work (GitHub / GitLab)", score: 0, max: 400,
      items: [{ label: "Code platform linked", value: 0, max: 400, note: "No repository host connected" }],
      insights,
    };
  }

  // Streak (the 'green squares')
  const streak = g?.streakDays ?? 0;
  const streakPts = cap(streak * 6, 100);
  items.push({ label: "Commit streak (green squares)", value: streakPts, max: 100, note: `${streak} consecutive day${streak === 1 ? "" : "s"}` });
  if (streak < 7) insights.push("Build a 7-day commit streak to demonstrate consistency.");

  // Recent commits
  const commits = g?.recentCommits ?? 0;
  const commitPts = cap(commits * 1.5, 90);
  items.push({ label: "Recent commits (30d)", value: commitPts, max: 90, note: `${commits} commits this month` });
  if (commits < 30) insights.push("Aim for 1+ commit per day this month.");

  // OSS impact: stars
  const stars = g?.totalStars ?? 0;
  const starPts = cap(Math.log2(stars + 1) * 18, 90);
  items.push({ label: "Open-source impact (stars)", value: starPts, max: 90, note: `${stars} stars across all repos` });
  if (stars < 10) insights.push("Polish a flagship repo (clear README, screenshots, deployed link) to attract stars.");

  // Repo volume
  const repos = (g?.publicRepos ?? 0) + (gl?.publicRepos ?? 0);
  const repoPts = cap(repos * 2, 60);
  items.push({ label: "Public repositories", value: repoPts, max: 60, note: `${repos} public repos` });

  // Language breadth
  const langs = Object.keys(g?.languages || {}).length;
  const langPts = cap(langs * 10, 40);
  items.push({ label: "Language breadth", value: langPts, max: 40, note: `${langs} languages used` });

  // Network
  const followers = (g?.followers ?? 0) + (gl?.followers ?? 0);
  const fPts = cap(Math.log2(followers + 1) * 4, 20);
  items.push({ label: "Developer followers", value: fPts, max: 20, note: `${followers} followers` });

  const score = items.reduce((a, b) => a + b.value, 0);
  return { key: "code", label: "Proof of Work (GitHub / GitLab)", score, max: 400, items, insights };
}

function dsaPillar(stats?: UserStats): Pillar {
  const items: Pillar["items"] = [];
  const insights: string[] = [];
  const lc = stats?.leetcode;
  const cc = stats?.codechef;
  const hr = stats?.hackerrank;
  const linked = !!lc || !!cc || !!hr;

  if (!linked) {
    insights.push("Connect at least one DSA platform (LeetCode is the recruiter standard).");
    return {
      key: "dsa", label: "DSA (LeetCode / HackerRank / CodeChef)", score: 0, max: 400,
      items: [{ label: "DSA platform linked", value: 0, max: 400, note: "No coding-judge profile connected" }],
      insights,
    };
  }

  if (lc) {
    const v = cap(lc.totalSolved * 0.4, 120);
    items.push({ label: "LeetCode problems solved", value: v, max: 120, note: `${lc.totalSolved} total` });
    if (lc.totalSolved < 100) insights.push("Cross 100 LeetCode problems — recruiters use this as a soft cutoff.");

    const mix = cap(lc.hardSolved * 4 + lc.mediumSolved * 1.5, 120);
    items.push({ label: "Difficulty mix (LC)", value: mix, max: 120, note: `${lc.hardSolved}H · ${lc.mediumSolved}M · ${lc.easySolved}E` });
    if (lc.hardSolved < 5) insights.push("Solve 5+ Hard problems to prove depth.");

    const acc = cap(lc.acceptanceRate * 0.5, 40);
    items.push({ label: "LC acceptance rate", value: acc, max: 40, note: `${lc.acceptanceRate.toFixed(1)}%` });
  }

  if (cc) {
    const r = cap((cc.rating - 1200) * 0.06, 60);
    items.push({ label: "CodeChef rating", value: Math.max(0, r), max: 60, note: `${cc.rating} (${cc.stars}★)` });
  } else {
    items.push({ label: "CodeChef rating", value: 0, max: 60, note: "Not linked" });
    insights.push("Add CodeChef for contest credibility (1600+ rating = strong signal).");
  }

  if (hr) {
    const b = cap(hr.badges * 6, 60);
    items.push({ label: "HackerRank badges", value: b, max: 60, note: `${hr.badges} badges` });
  } else {
    items.push({ label: "HackerRank badges", value: 0, max: 60, note: "Not linked" });
  }

  const score = items.reduce((a, b) => a + b.value, 0);
  return { key: "dsa", label: "DSA (LeetCode / HackerRank / CodeChef)", score, max: 400, items, insights };
}

export function appendDailySnapshot(user: User, score: number, grade: Grade): ScoreSnapshot[] {
  const today = new Date().toISOString().slice(0, 10);
  const hist = [...(user.history || [])];
  const last = hist[hist.length - 1];
  const snap: ScoreSnapshot = { date: today, score, grade };
  if (last && last.date === today) hist[hist.length - 1] = snap;
  else hist.push(snap);
  return hist.slice(-60);
}
