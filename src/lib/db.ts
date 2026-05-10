// =============================================================================
//  Compatibility shim. The real persistence layer lives in src/server/.
//  Pages built earlier consume a sync, in-memory cache; we hydrate it from
//  IndexedDB on app boot (see src/server/index.ts → bootstrap()).
//
//  New code should import directly from "../server/api".
// =============================================================================

export type UserRole = "student" | "recruiter" | "tpo" | "admin";

export interface LinkedInChecklist {
  hasHeadline: boolean; hasSummary: boolean; hasExperience: boolean;
  hasSkills: boolean; hasRecommendations: boolean; has500Plus: boolean;
}

export interface UserStats {
  github?: { followers: number; publicRepos: number; totalStars: number; totalForks: number;
    languages: Record<string, number>; recentCommits: number; streakDays: number; avatar?: string };
  gitlab?: { publicRepos: number; followers: number };
  leetcode?: { totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number;
    ranking: number; acceptanceRate: number };
  hackerrank?: { badges: number; rank?: string };
  codechef?: { rating: number; stars: number; problemsSolved: number };
  lastSyncedAt: number;
}

export interface ScoreSnapshot { date: string; score: number; grade: string }

// "User" as understood by older UI code — flattened view of users + student_profiles + score_history
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  createdAt: number;
  // student fields
  linkedin?: string;
  linkedinChecklist?: LinkedInChecklist;
  github?: string;
  gitlab?: string;
  leetcode?: string;
  hackerrank?: string;
  codechef?: string;
  bio?: string;
  location?: string;
  college?: string;
  collegeId?: string;
  stats?: UserStats;
  history?: ScoreSnapshot[];
}

// ---------- in-memory cache (hydrated from IndexedDB at boot) ----------
let _users: User[] = [];

export function _hydrate(users: User[]) { _users = users; }
export function getAllUsers(): User[] { return _users; }
export function getUser(id: string): User | undefined { return _users.find((u) => u.id === id); }
export function findUserByEmail(email: string) {
  return _users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
export function upsertUser(user: User) {
  const i = _users.findIndex((u) => u.id === user.id);
  if (i >= 0) _users[i] = user; else _users.push(user);
  // async write-through to IndexedDB happens via dedicated server APIs.
}

// session cache (just used by older Layout/auth code)
export interface Session { userId: string; token: string; expiresAt: number }
let _session: Session | null = null;
export function getSession(): Session | null {
  if (!_session) return null;
  if (_session.expiresAt < Date.now()) { _session = null; return null; }
  return _session;
}
export function setSession(s: Session | null) { _session = s; }

export async function ensureSeed() { /* handled by server/seed.ts */ }
