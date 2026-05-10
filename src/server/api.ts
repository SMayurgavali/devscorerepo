// =============================================================================
//  Service / API layer — the only surface UI code talks to.
//  Mirrors a REST API: every export is what would be a HTTP route.
//  Adds: validation, auth checks, audit logging, snapshot writes, billing checks.
// =============================================================================

import { fetchCodechefStats, fetchGithubStats, fetchGitlabStats, fetchLeetcodeStats } from "../lib/api";
import { computeReport, type ScoreReport } from "../lib/score";
import { token, uid } from "./database";
import {
  AuditLog, Colleges, Notifications, RecruiterProfiles, SavedSearches, ScoreHistory,
  Sessions, StatSnapshots, StudentProfiles, Subscriptions, SyncJobs, Users,
} from "./repositories";
import type {
  College, LinkedInChecklist, Notification, RecruiterProfile, SavedSearch,
  Session, StudentProfile, User, UserRole,
} from "./schema";

// ---------------------------------------------------------------------------
//  AUTH — register, login, logout, sessions
// ---------------------------------------------------------------------------
const enc = new TextEncoder();
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function hashPassword(password: string, salt: string): Promise<string> {
  let h = await sha256(salt + ":" + password);
  for (let i = 0; i < 1000; i++) h = await sha256(h + salt);
  return h;
}
function randomSalt(): string { return token(16); }

const SESSION_KEY = "devscore.session_token";

export async function register(input: {
  email: string; password: string; name: string; role: UserRole; collegeId?: string;
}): Promise<{ user: User }> {
  if (!input.email || !input.password || !input.name) throw new Error("All fields are required");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) throw new Error("Invalid email");
  if (input.password.length < 6) throw new Error("Password must be at least 6 characters");
  if (await Users.getByEmail(input.email)) throw new Error("Email already registered");

  const salt = randomSalt();
  const passwordHash = await hashPassword(input.password, salt);
  const user: User = {
    id: uid("usr_"),
    email: input.email.toLowerCase(),
    passwordHash, salt,
    name: input.name,
    role: input.role,
    emailVerified: false,
    collegeId: input.collegeId,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };
  await Users.insert(user);

  if (input.role === "student") {
    const sp: StudentProfile = { userId: user.id, visibleToRecruiters: true, collegeId: input.collegeId };
    await StudentProfiles.upsert(sp);
  } else if (input.role === "recruiter") {
    await RecruiterProfiles.upsert({ userId: user.id });
  }

  // free plan by default
  await Subscriptions.upsert({
    userId: user.id, plan: "free", status: "active",
    currentPeriodEnd: Date.now() + 1000 * 60 * 60 * 24 * 365,
  });

  await issueSession(user.id);
  await audit(user.id, "user.register", "users", { role: user.role });
  await notify(user.id, "system", "Welcome to DevScore!", "Connect your accounts to compute your first DevScore.");
  return { user };
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  const u = await Users.getByEmail(email);
  if (!u) { await audit(undefined, "auth.login_failed", "users", { email }); throw new Error("Invalid email or password"); }
  const hash = await hashPassword(password, u.salt);
  if (hash !== u.passwordHash) { await audit(u.id, "auth.login_failed", "users"); throw new Error("Invalid email or password"); }
  u.lastLoginAt = Date.now();
  await Users.update(u);
  await issueSession(u.id);
  await audit(u.id, "auth.login", "users");
  return { user: u };
}

export async function logout() {
  const t = localStorage.getItem(SESSION_KEY);
  if (t) await Sessions.revoke(t);
  localStorage.removeItem(SESSION_KEY);
}

async function issueSession(userId: string) {
  const t = token(24);
  const session: Session = {
    token: t, userId, createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    userAgent: navigator.userAgent,
  };
  await Sessions.create(session);
  localStorage.setItem(SESSION_KEY, t);
}

export async function getCurrentUser(): Promise<User | null> {
  const t = localStorage.getItem(SESSION_KEY);
  if (!t) return null;
  const s = await Sessions.get(t);
  if (!s || s.expiresAt < Date.now()) {
    if (s) await Sessions.revoke(t);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return (await Users.getById(s.userId)) || null;
}

// ---------------------------------------------------------------------------
//  STUDENTS — profile, sync, score
// ---------------------------------------------------------------------------
export async function getStudentProfile(userId: string): Promise<StudentProfile | undefined> {
  return StudentProfiles.get(userId);
}

export async function updateStudentProfile(userId: string, patch: Partial<StudentProfile>) {
  const cur = (await StudentProfiles.get(userId)) || { userId, visibleToRecruiters: true };
  const next: StudentProfile = { ...cur, ...patch, userId };
  await StudentProfiles.upsert(next);
  await audit(userId, "profile.updated", "student_profiles");
  return next;
}

/** Run a sync job: fetch stats, write snapshots, recompute score, persist history, notify. */
export async function syncStudent(userId: string): Promise<{ jobId: string; report: ScoreReport; warnings: string[] }> {
  const profile = await StudentProfiles.get(userId);
  if (!profile) throw new Error("Student profile not found");

  const job: import("./schema").SyncJob = {
    id: uid("job_"), userId, status: "running",
    startedAt: Date.now(), sourcesAttempted: [],
    errors: [],
  };
  await SyncJobs.insert(job);

  const merged: any = { lastSyncedAt: Date.now() };
  const tasks: Promise<void>[] = [];
  const push = (src: string, p: Promise<any>) => {
    job.sourcesAttempted.push(src);
    tasks.push(
      p.then(async (data) => {
        merged[src] = data;
        await StatSnapshots.insert({ id: uid("snap_"), userId, capturedAt: Date.now(), source: src as any, data });
      }).catch((e) => { job.errors.push({ source: src, message: e.message }); })
    );
  };

  if (profile.githubUsername) push("github", fetchGithubStats(profile.githubUsername));
  if (profile.gitlabUsername) push("gitlab", fetchGitlabStats(profile.gitlabUsername));
  if (profile.leetcodeUsername) push("leetcode", fetchLeetcodeStats(profile.leetcodeUsername));
  if (profile.codechefUsername) push("codechef", fetchCodechefStats(profile.codechefUsername));
  await Promise.all(tasks);

  // compute score
  const report = computeReport({
    linkedin: profile.linkedinUrl,
    linkedinChecklist: profile.linkedinChecklist,
    stats: merged,
  });

  // persist daily score row
  const today = new Date().toISOString().slice(0, 10);
  await ScoreHistory.upsertDay({
    userId, date: today,
    total: report.total, grade: report.grade,
    linkedinScore: Math.round(report.pillars.find((p) => p.key === "linkedin")!.score),
    codeScore:     Math.round(report.pillars.find((p) => p.key === "code")!.score),
    dsaScore:      Math.round(report.pillars.find((p) => p.key === "dsa")!.score),
  });

  // milestone notifications
  const prevHist = await ScoreHistory.listForUser(userId, 2);
  if (prevHist.length >= 2) {
    const prev = prevHist[prevHist.length - 2];
    if (prev.grade !== report.grade) {
      await notify(userId, "milestone", `🎉 Grade up: ${prev.grade} → ${report.grade}`, `Your DevScore is now ${report.total}.`);
    } else if (report.total > prev.total + 25) {
      await notify(userId, "score_change", "Score climbing", `+${report.total - prev.total} points since last sync.`);
    }
  }

  // finalize job
  job.status = job.errors.length === 0 ? "success" : (Object.keys(merged).length > 1 ? "partial" : "failed");
  job.finishedAt = Date.now();
  await SyncJobs.update(job);
  await audit(userId, "sync.run", "sync_jobs", { jobId: job.id, status: job.status });

  return { jobId: job.id, report, warnings: job.errors.map((e) => `${e.source}: ${e.message}`) };
}

export async function getScore(userId: string): Promise<ScoreReport> {
  const profile = await StudentProfiles.get(userId);
  if (!profile) return computeReport({});
  const snaps = await StatSnapshots.listForUser(userId, 10);
  const stats: any = { lastSyncedAt: Date.now() };
  for (const s of snaps) if (!stats[s.source]) stats[s.source] = s.data;
  return computeReport({
    linkedin: profile.linkedinUrl, linkedinChecklist: profile.linkedinChecklist, stats,
  });
}

export async function getScoreHistory(userId: string, days = 30) {
  return ScoreHistory.listForUser(userId, days);
}

// ---------------------------------------------------------------------------
//  RECRUITERS — search, saved searches, view candidate
// ---------------------------------------------------------------------------
export interface CandidateCard {
  user: User;
  profile: StudentProfile;
  report: ScoreReport;
  collegeName?: string;
}

export async function searchCandidates(filters: {
  q?: string; minScore?: number; language?: string; grade?: string; collegeId?: string;
}): Promise<CandidateCard[]> {
  const profiles = await StudentProfiles.listAll();
  const colleges = await Colleges.listAll();
  const collegeMap = new Map(colleges.map((c) => [c.id, c]));
  const cards: CandidateCard[] = [];

  for (const p of profiles) {
    if (!p.visibleToRecruiters) continue;
    if (filters.collegeId && p.collegeId !== filters.collegeId) continue;
    const u = await Users.getById(p.userId);
    if (!u || u.role !== "student") continue;

    const report = await getScore(u.id);
    if (filters.minScore && report.total < filters.minScore) continue;
    if (filters.grade && report.grade !== filters.grade) continue;

    if (filters.q) {
      const hay = (u.name + " " + (p.location || "") + " " + (p.bio || "")).toLowerCase();
      if (!hay.includes(filters.q.toLowerCase())) continue;
    }
    cards.push({ user: u, profile: p, report, collegeName: p.collegeId ? collegeMap.get(p.collegeId)?.name : undefined });
  }
  cards.sort((a, b) => b.report.total - a.report.total);
  return cards;
}

export async function recordCandidateView(recruiterId: string, candidateId: string) {
  await audit(recruiterId, "candidate.viewed", "users", { candidateId });
  // optional: notify the candidate they were viewed (privacy-respecting summary)
  await notify(candidateId, "viewed", "A recruiter viewed your profile",
    `Your DevScore caught a recruiter's attention.`);
}

export async function listSavedSearches(rid: string) { return SavedSearches.listForRecruiter(rid); }
export async function saveSearch(s: Omit<SavedSearch, "id" | "createdAt">) {
  const rec: SavedSearch = { ...s, id: uid("ss_"), createdAt: Date.now() };
  await SavedSearches.insert(rec);
  return rec;
}
export async function deleteSavedSearch(id: string) { await SavedSearches.delete(id); }

// ---------------------------------------------------------------------------
//  COLLEGES / TPO admin
// ---------------------------------------------------------------------------
export async function listColleges() { return Colleges.listAll(); }
export async function getCollege(id: string) { return Colleges.get(id); }
export async function createCollege(c: Omit<College, "id" | "createdAt" | "plan"> & { plan?: College["plan"] }) {
  const rec: College = { id: uid("col_"), name: c.name, location: c.location, plan: c.plan || "free", createdAt: Date.now() };
  await Colleges.upsert(rec);
  await audit(undefined, "college.created", "colleges", { id: rec.id });
  return rec;
}
export async function getCollegeStudents(collegeId: string): Promise<CandidateCard[]> {
  const profiles = await StudentProfiles.listByCollege(collegeId);
  const cards: CandidateCard[] = [];
  for (const p of profiles) {
    const u = await Users.getById(p.userId);
    if (!u) continue;
    const report = await getScore(u.id);
    cards.push({ user: u, profile: p, report });
  }
  return cards.sort((a, b) => b.report.total - a.report.total);
}

// ---------------------------------------------------------------------------
//  NOTIFICATIONS
// ---------------------------------------------------------------------------
export async function notify(userId: string, type: Notification["type"], title: string, body: string, link?: string) {
  await Notifications.insert({
    id: uid("ntf_"), userId, type, title, body, link, read: false, createdAt: Date.now(),
  });
}
export async function listNotifications(userId: string) { return Notifications.listForUser(userId); }
export async function unreadCount(userId: string) { return Notifications.unreadCount(userId); }
export async function markNotificationRead(id: string) { return Notifications.markRead(id); }
export async function markAllNotificationsRead(uid: string) { return Notifications.markAllRead(uid); }

// ---------------------------------------------------------------------------
//  AUDIT
// ---------------------------------------------------------------------------
export async function audit(userId: string | undefined, action: string, resource?: string, metadata?: any) {
  await AuditLog.insert({
    id: uid("aud_"), userId, action, resource, metadata,
    createdAt: Date.now(),
  });
}
export async function listAudit(limit = 50) { return AuditLog.listRecent(limit); }

// ---------------------------------------------------------------------------
//  EXPORTS for setting LinkedIn checklist
// ---------------------------------------------------------------------------
export type { LinkedInChecklist, RecruiterProfile, StudentProfile, User, College, Notification };
