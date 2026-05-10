// =============================================================================
//  Demo data loader.
//
//  IMPORTANT: this is NO LONGER called automatically on boot.
//  The platform starts completely empty so the first user becomes user #1.
//
//  Demo data can be loaded on-demand from:
//    • Auth page → "Load demo data" toggle
//    • TPO Admin → "Load demo data" button
//
//  Idempotent — safe to call multiple times; skips if data already exists.
// =============================================================================

import { hashPassword } from "./api";
import { uid } from "./database";
import {
  Colleges, RecruiterProfiles, ScoreHistory, StatSnapshots,
  StudentProfiles, Subscriptions, Users,
} from "./repositories";
import type { College, ScoreHistoryRow, StudentProfile, User } from "./schema";

export async function isDemoDataLoaded(): Promise<boolean> {
  const users = await Users.listAll();
  return users.some((u) => u.email.endsWith("@demo.devscore.app"));
}

export async function loadDemoData(): Promise<{ created: number }> {
  if (await isDemoDataLoaded()) return { created: 0 };

  const salt = "demo-salt";
  const pwd = await hashPassword("demo1234", salt);

  // -- Colleges
  const colleges: College[] = [
    { id: "col_demo_iitd", name: "IIT Delhi (demo)",      location: "New Delhi, IN",  plan: "enterprise", createdAt: Date.now() },
    { id: "col_demo_bits", name: "BITS Pilani (demo)",    location: "Pilani, IN",     plan: "pro",        createdAt: Date.now() },
    { id: "col_demo_coep", name: "COEP Pune (demo)",      location: "Pune, IN",       plan: "free",       createdAt: Date.now() },
  ];
  for (const c of colleges) await Colleges.upsert(c);

  // -- Demo recruiter
  await Users.insert({
    id: "usr_demo_recruiter", email: "recruiter@demo.devscore.app", name: "Demo Recruiter",
    role: "recruiter", emailVerified: true, passwordHash: pwd, salt, createdAt: Date.now(),
  });
  await RecruiterProfiles.upsert({ userId: "usr_demo_recruiter", companyName: "Demo Co", companySize: "51-200", industry: "SaaS" });
  await Subscriptions.upsert({ userId: "usr_demo_recruiter", plan: "recruiter_pro", status: "active", currentPeriodEnd: Date.now() + 1000*60*60*24*365 });

  // -- Demo TPO
  await Users.insert({
    id: "usr_demo_tpo", email: "tpo@demo.devscore.app", name: "Demo TPO",
    role: "tpo", emailVerified: true, passwordHash: pwd, salt,
    collegeId: "col_demo_iitd", createdAt: Date.now(),
  });

  // -- Demo students
  const studs: [string, string, string, string, number][] = [
    ["Demo · Priya Sharma",  "priya@demo.devscore.app",  "Bengaluru, IN", "col_demo_iitd", 920],
    ["Demo · Arjun Mehta",   "arjun@demo.devscore.app",  "Mumbai, IN",    "col_demo_bits", 865],
    ["Demo · Neha Patel",    "neha@demo.devscore.app",   "Pune, IN",      "col_demo_coep", 798],
    ["Demo · Raj Iyer",      "raj@demo.devscore.app",    "Hyderabad, IN", "col_demo_iitd", 740],
    ["Demo · Ananya Rao",    "ananya@demo.devscore.app", "Bengaluru, IN", "col_demo_iitd", 685],
    ["Demo · Vikram Singh",  "vikram@demo.devscore.app", "Delhi, IN",     "col_demo_iitd", 612],
  ];

  for (const [name, email, loc, collegeId, score] of studs) {
    const id = uid("usr_demo_");
    const u: User = {
      id, email, name, role: "student", emailVerified: true,
      passwordHash: pwd, salt, collegeId, createdAt: Date.now(),
    };
    await Users.insert(u);

    const handle = name.split(" ")[2].toLowerCase();
    const profile: StudentProfile = {
      userId: id,
      bio: "Demo profile — replace with your own real account to start ranking.",
      location: loc, collegeId, visibleToRecruiters: true,
      linkedinUrl: `https://linkedin.com/in/${handle}`,
      linkedinChecklist: {
        hasHeadline: true, hasSummary: true, hasExperience: true,
        hasSkills: true, hasRecommendations: Math.random() > 0.4, has500Plus: Math.random() > 0.5,
      },
      githubUsername: handle, leetcodeUsername: handle, codechefUsername: handle,
    };
    await StudentProfiles.upsert(profile);

    await StatSnapshots.insert({
      id: uid("snap_"), userId: id, capturedAt: Date.now(), source: "github",
      data: {
        followers: 50 + Math.round(Math.random() * 400),
        publicRepos: 15 + Math.round(Math.random() * 50),
        totalStars: 30 + Math.round(Math.random() * 800),
        totalForks: 10 + Math.round(Math.random() * 150),
        languages: { TypeScript: 35, Python: 30, Java: 15, "C++": 10, JavaScript: 10 },
        recentCommits: 25 + Math.round(Math.random() * 70),
        streakDays: 5 + Math.round(Math.random() * 50),
      },
    });
    await StatSnapshots.insert({
      id: uid("snap_"), userId: id, capturedAt: Date.now(), source: "leetcode",
      data: {
        totalSolved: 150 + Math.round(Math.random() * 500),
        easySolved: 80, mediumSolved: 70, hardSolved: 15,
        ranking: 15000 + Math.round(Math.random() * 180000),
        acceptanceRate: 55 + Math.random() * 35,
      },
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const noise = Math.sin(i / 3) * 10;
      const s = Math.max(0, Math.round(score - i * 4 + noise));
      const row: ScoreHistoryRow = {
        userId: id, date: d.toISOString().slice(0, 10),
        total: s,
        grade: s >= 850 ? "A+" : s >= 700 ? "A" : s >= 550 ? "B" : s >= 350 ? "C" : "D",
        linkedinScore: Math.round(s * 0.18), codeScore: Math.round(s * 0.42), dsaScore: Math.round(s * 0.40),
      };
      await ScoreHistory.upsertDay(row);
    }

    await Subscriptions.upsert({ userId: id, plan: "free", status: "active", currentPeriodEnd: Date.now() + 1000*60*60*24*365 });
  }

  return { created: studs.length + 2 };
}

/** Removes everything with @demo.devscore.app email. Real users untouched. */
export async function clearDemoData(): Promise<{ removed: number }> {
  const { db } = await import("./database");
  const a = await db();
  const all = await Users.listAll();
  const demoUsers = all.filter((u) => u.email.endsWith("@demo.devscore.app"));
  let removed = 0;

  // delete dependent rows first
  const stores = ["student_profiles", "recruiter_profiles", "stat_snapshots", "score_history", "sync_jobs", "saved_searches", "notifications", "subscriptions", "sessions"];
  for (const s of stores) {
    await a.deleteWhere(s, (row: any) => demoUsers.some((u) => u.id === (row.userId || row.user_id)));
  }
  // then users
  for (const u of demoUsers) { await a.delete("users", u.id); removed++; }
  // and demo colleges
  await a.deleteWhere("colleges", (c: any) => (c.id as string).startsWith("col_demo_"));

  return { removed };
}
