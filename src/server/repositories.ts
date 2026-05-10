// =============================================================================
//  Repository layer — typed CRUD per table.
//  Talks ONLY through the Adapter interface, so swapping IndexedDB ↔ Supabase
//  requires zero changes here.
// =============================================================================

import { db } from "./database";
import {
  STORES, type AuditLogEntry, type College, type Notification, type RecruiterProfile,
  type SavedSearch, type ScoreHistoryRow, type Session, type StatSnapshot,
  type StudentProfile, type Subscription, type SyncJob, type User,
} from "./schema";

// ---------- users ----------
export const Users = {
  async insert(u: User) { (await db()).put(STORES.users, u); },
  async update(u: User) { (await db()).put(STORES.users, u); },
  async getById(id: string) { return (await db()).get<User>(STORES.users, id); },
  async getByEmail(email: string) {
    const rows = await (await db()).getByIndex<User>(STORES.users, "email", email.toLowerCase());
    return rows[0];
  },
  async listAll() { return (await db()).getAll<User>(STORES.users); },
  async listByRole(role: User["role"]) {
    return (await db()).getByIndex<User>(STORES.users, "role", role);
  },
  async listByCollege(collegeId: string) {
    return (await db()).getByIndex<User>(STORES.users, "collegeId", collegeId);
  },
};

// ---------- student profiles ----------
export const StudentProfiles = {
  async upsert(p: StudentProfile) { (await db()).put(STORES.studentProfiles, p); },
  async get(userId: string) { return (await db()).get<StudentProfile>(STORES.studentProfiles, userId); },
  async listAll() { return (await db()).getAll<StudentProfile>(STORES.studentProfiles); },
  async listByCollege(collegeId: string) {
    return (await db()).getByIndex<StudentProfile>(STORES.studentProfiles, "collegeId", collegeId);
  },
};

// ---------- recruiter profiles ----------
export const RecruiterProfiles = {
  async upsert(p: RecruiterProfile) { (await db()).put(STORES.recruiterProfiles, p); },
  async get(userId: string) { return (await db()).get<RecruiterProfile>(STORES.recruiterProfiles, userId); },
};

// ---------- colleges ----------
export const Colleges = {
  async upsert(c: College) { (await db()).put(STORES.colleges, c); },
  async get(id: string) { return (await db()).get<College>(STORES.colleges, id); },
  async listAll() { return (await db()).getAll<College>(STORES.colleges); },
};

// ---------- sessions ----------
export const Sessions = {
  async create(s: Session) { (await db()).put(STORES.sessions, s); },
  async get(t: string) { return (await db()).get<Session>(STORES.sessions, t); },
  async revoke(t: string) { (await db()).delete(STORES.sessions, t); },
  async revokeAllForUser(userId: string) {
    await (await db()).deleteWhere(STORES.sessions, (s: Session) => s.userId === userId);
  },
  async cleanupExpired() {
    const now = Date.now();
    return (await db()).deleteWhere(STORES.sessions, (s: Session) => s.expiresAt < now);
  },
};

// ---------- stat snapshots ----------
export const StatSnapshots = {
  async insert(s: StatSnapshot) { (await db()).put(STORES.statSnapshots, s); },
  async listForUser(userId: string, limit = 30) {
    const rows = await (await db()).getByIndex<StatSnapshot>(STORES.statSnapshots, "userId", userId);
    return rows.sort((a, b) => b.capturedAt - a.capturedAt).slice(0, limit);
  },
};

// ---------- score history ----------
export const ScoreHistory = {
  async upsertDay(row: ScoreHistoryRow) { (await db()).put(STORES.scoreHistory, row); },
  async listForUser(userId: string, days = 60) {
    const rows = await (await db()).getByIndex<ScoreHistoryRow>(STORES.scoreHistory, "userId", userId);
    return rows.sort((a, b) => a.date.localeCompare(b.date)).slice(-days);
  },
  async latest(userId: string) {
    const rows = await this.listForUser(userId, 1);
    return rows[rows.length - 1];
  },
};

// ---------- sync jobs ----------
export const SyncJobs = {
  async insert(j: SyncJob) { (await db()).put(STORES.syncJobs, j); },
  async update(j: SyncJob) { (await db()).put(STORES.syncJobs, j); },
  async get(id: string) { return (await db()).get<SyncJob>(STORES.syncJobs, id); },
  async listForUser(userId: string, limit = 20) {
    const rows = await (await db()).getByIndex<SyncJob>(STORES.syncJobs, "userId", userId);
    return rows.sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
  },
  async listRecent(limit = 20) {
    const rows = await (await db()).getAll<SyncJob>(STORES.syncJobs);
    return rows.sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
  },
};

// ---------- saved searches ----------
export const SavedSearches = {
  async insert(s: SavedSearch) { (await db()).put(STORES.savedSearches, s); },
  async listForRecruiter(rid: string) {
    return (await db()).getByIndex<SavedSearch>(STORES.savedSearches, "recruiterId", rid);
  },
  async delete(id: string) { (await db()).delete(STORES.savedSearches, id); },
};

// ---------- notifications ----------
export const Notifications = {
  async insert(n: Notification) { (await db()).put(STORES.notifications, n); },
  async listForUser(userId: string, limit = 30) {
    const rows = await (await db()).getByIndex<Notification>(STORES.notifications, "userId", userId);
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
  async unreadCount(userId: string) {
    const rows = await this.listForUser(userId, 100);
    return rows.filter((r) => !r.read).length;
  },
  async markRead(id: string) {
    const a = await db();
    const n = await a.get<Notification>(STORES.notifications, id);
    if (n) { n.read = true; await a.put(STORES.notifications, n); }
  },
  async markAllRead(userId: string) {
    const list = await this.listForUser(userId, 200);
    for (const n of list.filter((x) => !x.read)) await this.markRead(n.id);
  },
};

// ---------- audit log ----------
export const AuditLog = {
  async insert(e: AuditLogEntry) { (await db()).put(STORES.auditLog, e); },
  async listRecent(limit = 50) {
    const rows = await (await db()).getAll<AuditLogEntry>(STORES.auditLog);
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
  async listForUser(userId: string, limit = 50) {
    const rows = await (await db()).getByIndex<AuditLogEntry>(STORES.auditLog, "userId", userId);
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
};

// ---------- subscriptions ----------
export const Subscriptions = {
  async upsert(s: Subscription) { (await db()).put(STORES.subscriptions, s); },
  async get(userId: string) { return (await db()).get<Subscription>(STORES.subscriptions, userId); },
};
