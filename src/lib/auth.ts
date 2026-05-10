// =============================================================================
//  Auth shim — delegates to the real backend in src/server/api.ts but exposes
//  the sync-flavoured helpers the existing pages were built against.
// =============================================================================

import * as api from "../server/api";
import { _hydrate, getAllUsers, setSession, type User as UIUser } from "./db";
import { syncStudent, getStudentProfile } from "../server/api";

let _currentUserId: string | null = null;

export async function bootAuth() {
  const u = await api.getCurrentUser();
  if (u) {
    _currentUserId = u.id;
    setSession({ userId: u.id, token: "live", expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  }
}

export function currentUser(): UIUser | null {
  if (!_currentUserId) return null;
  return getAllUsers().find((u) => u.id === _currentUserId) || null;
}

export async function login(email: string, password: string): Promise<UIUser> {
  const { user } = await api.login(email, password);
  _currentUserId = user.id;
  setSession({ userId: user.id, token: "live", expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  // refresh cache so new logins surface immediately
  await refreshUserCache();
  return getAllUsers().find((u) => u.id === user.id)!;
}

export async function signup(args: {
  email: string; password: string; name: string; role: UIUser["role"];
}): Promise<UIUser> {
  const { user } = await api.register(args);
  _currentUserId = user.id;
  setSession({ userId: user.id, token: "live", expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  await refreshUserCache();
  return getAllUsers().find((u) => u.id === user.id)!;
}

export function logout() {
  _currentUserId = null;
  setSession(null);
  void api.logout();
}

export async function hashPassword(password: string, salt: string) {
  return api.hashPassword(password, salt);
}

// ---------------------------------------------------------------------------
//  Cache hydration — pull users + profiles + score history from IndexedDB
//  and flatten to the legacy UIUser shape the components expect.
// ---------------------------------------------------------------------------
export async function refreshUserCache() {
  const { Users, StudentProfiles, ScoreHistory, StatSnapshots, Colleges } = await import("../server/repositories");
  const [users, profiles, colleges] = await Promise.all([
    Users.listAll(), StudentProfiles.listAll(), Colleges.listAll(),
  ]);
  const collegeMap = new Map(colleges.map((c) => [c.id, c.name]));
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  const flat: UIUser[] = await Promise.all(users.map(async (u) => {
    const p = profileMap.get(u.id);
    const snaps = await StatSnapshots.listForUser(u.id, 6);
    const stats: any = { lastSyncedAt: Date.now() };
    for (const s of snaps) if (!stats[s.source]) stats[s.source] = s.data;
    const hist = await ScoreHistory.listForUser(u.id, 30);
    return {
      id: u.id, email: u.email, name: u.name, role: u.role as any,
      passwordHash: u.passwordHash, salt: u.salt, createdAt: u.createdAt,
      linkedin: p?.linkedinUrl, linkedinChecklist: p?.linkedinChecklist,
      github: p?.githubUsername, gitlab: p?.gitlabUsername,
      leetcode: p?.leetcodeUsername, hackerrank: p?.hackerrankUsername, codechef: p?.codechefUsername,
      bio: p?.bio, location: p?.location,
      collegeId: p?.collegeId || u.collegeId,
      college: p?.collegeId ? collegeMap.get(p.collegeId) : (u.collegeId ? collegeMap.get(u.collegeId) : undefined),
      stats: Object.keys(stats).length > 1 ? stats : undefined,
      history: hist.map((h) => ({ date: h.date, score: h.total, grade: h.grade })),
    };
  }));

  _hydrate(flat);
}

/** Persists a sync from the dashboard back to IndexedDB. */
export async function saveStudentSync(uiUser: UIUser, _stats: any) {
  await api.updateStudentProfile(uiUser.id, {
    linkedinUrl: uiUser.linkedin,
    linkedinChecklist: uiUser.linkedinChecklist,
    githubUsername: uiUser.github,
    gitlabUsername: uiUser.gitlab,
    leetcodeUsername: uiUser.leetcode,
    hackerrankUsername: uiUser.hackerrank,
    codechefUsername: uiUser.codechef,
    bio: uiUser.bio,
    location: uiUser.location,
  });
  // ensure a profile exists
  await getStudentProfile(uiUser.id);
  // fire a sync (non-blocking refresh of stats)
  try { await syncStudent(uiUser.id); } catch {/* swallow */}
  await refreshUserCache();
}
