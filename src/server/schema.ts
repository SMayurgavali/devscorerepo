// =============================================================================
//  DevScore — Backend Schema (single source of truth)
// =============================================================================
//  This file documents every table, every column, and every relationship.
//  The IndexedDB adapter (database.ts) and the API layer (api.ts) both consume
//  these types so the schema cannot drift.
//
//  When you migrate to Postgres / Supabase, the SQL DDL in the comment blocks
//  is the migration you run. The TypeScript types stay identical.
// =============================================================================

// -----------------------------------------------------------------------------
//  TABLE: users
//  Every authenticated principal — students, recruiters, college TPOs, admins.
// -----------------------------------------------------------------------------
//  CREATE TABLE users (
//    id              TEXT PRIMARY KEY,
//    email           TEXT UNIQUE NOT NULL,
//    password_hash   TEXT NOT NULL,
//    salt            TEXT NOT NULL,
//    name            TEXT NOT NULL,
//    role            TEXT NOT NULL CHECK (role IN ('student','recruiter','tpo','admin')),
//    email_verified  BOOLEAN DEFAULT FALSE,
//    college_id      TEXT REFERENCES colleges(id),
//    created_at      BIGINT NOT NULL,
//    last_login_at   BIGINT
//  );
export type UserRole = "student" | "recruiter" | "tpo" | "admin";
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  collegeId?: string;
  createdAt: number;
  lastLoginAt?: number;
}

// -----------------------------------------------------------------------------
//  TABLE: student_profiles  (1:1 with users where role='student')
// -----------------------------------------------------------------------------
//  CREATE TABLE student_profiles (
//    user_id            TEXT PRIMARY KEY REFERENCES users(id),
//    bio                TEXT, location TEXT, college_id TEXT REFERENCES colleges(id),
//    linkedin_url       TEXT, linkedin_checklist JSONB,
//    github_username    TEXT, gitlab_username TEXT,
//    leetcode_username  TEXT, codechef_username TEXT, hackerrank_username TEXT,
//    visible_to_recruiters BOOLEAN DEFAULT TRUE
//  );
export interface LinkedInChecklist {
  hasHeadline: boolean; hasSummary: boolean; hasExperience: boolean;
  hasSkills: boolean; hasRecommendations: boolean; has500Plus: boolean;
}
export interface StudentProfile {
  userId: string;
  bio?: string;
  location?: string;
  collegeId?: string;
  linkedinUrl?: string;
  linkedinChecklist?: LinkedInChecklist;
  githubUsername?: string;
  gitlabUsername?: string;
  leetcodeUsername?: string;
  codechefUsername?: string;
  hackerrankUsername?: string;
  visibleToRecruiters: boolean;
}

// -----------------------------------------------------------------------------
//  TABLE: recruiter_profiles
// -----------------------------------------------------------------------------
//  CREATE TABLE recruiter_profiles (
//    user_id TEXT PRIMARY KEY REFERENCES users(id),
//    company_name TEXT, company_size TEXT, industry TEXT
//  );
export interface RecruiterProfile {
  userId: string;
  companyName?: string;
  companySize?: string;
  industry?: string;
}

// -----------------------------------------------------------------------------
//  TABLE: colleges  (multi-tenant for TPO / placement-cell customers)
// -----------------------------------------------------------------------------
//  CREATE TABLE colleges (
//    id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT,
//    plan TEXT DEFAULT 'free', created_at BIGINT NOT NULL
//  );
export interface College {
  id: string;
  name: string;
  location?: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: number;
}

// -----------------------------------------------------------------------------
//  TABLE: sessions  (stateful auth — opaque tokens, server-revocable)
// -----------------------------------------------------------------------------
//  CREATE TABLE sessions (
//    token TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
//    expires_at BIGINT NOT NULL, ip TEXT, user_agent TEXT, created_at BIGINT
//  );
export interface Session {
  token: string;
  userId: string;
  expiresAt: number;
  ip?: string;
  userAgent?: string;
  createdAt: number;
}

// -----------------------------------------------------------------------------
//  TABLE: stat_snapshots  (raw scraped/API data, retained for ~60 days)
// -----------------------------------------------------------------------------
//  CREATE TABLE stat_snapshots (
//    id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
//    captured_at BIGINT NOT NULL, source TEXT,
//    data JSONB NOT NULL
//  );
//  -- index on (user_id, captured_at)
export interface StatSnapshot {
  id: string;
  userId: string;
  capturedAt: number;
  source: "github" | "gitlab" | "leetcode" | "codechef" | "hackerrank" | "linkedin";
  data: any;
}

// -----------------------------------------------------------------------------
//  TABLE: score_history  (one row per user per day — the time-series)
// -----------------------------------------------------------------------------
//  CREATE TABLE score_history (
//    user_id TEXT, date DATE,
//    total INT, grade TEXT,
//    linkedin_score INT, code_score INT, dsa_score INT,
//    PRIMARY KEY (user_id, date)
//  );
export interface ScoreHistoryRow {
  userId: string;
  date: string; // YYYY-MM-DD
  total: number;
  grade: string;
  linkedinScore: number;
  codeScore: number;
  dsaScore: number;
}

// -----------------------------------------------------------------------------
//  TABLE: sync_jobs  (every API fetch is a job — for retries + observability)
// -----------------------------------------------------------------------------
//  CREATE TABLE sync_jobs (
//    id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
//    status TEXT CHECK (status IN ('queued','running','success','partial','failed')),
//    started_at BIGINT, finished_at BIGINT,
//    sources_attempted JSONB, errors JSONB
//  );
export interface SyncJob {
  id: string;
  userId: string;
  status: "queued" | "running" | "success" | "partial" | "failed";
  startedAt: number;
  finishedAt?: number;
  sourcesAttempted: string[];
  errors: { source: string; message: string }[];
}

// -----------------------------------------------------------------------------
//  TABLE: saved_searches  (recruiter feature — saved candidate filters)
// -----------------------------------------------------------------------------
//  CREATE TABLE saved_searches (
//    id TEXT PRIMARY KEY, recruiter_id TEXT REFERENCES users(id),
//    name TEXT, filters JSONB, created_at BIGINT
//  );
export interface SavedSearch {
  id: string;
  recruiterId: string;
  name: string;
  filters: { q?: string; minScore?: number; language?: string; grade?: string; collegeId?: string };
  createdAt: number;
}

// -----------------------------------------------------------------------------
//  TABLE: notifications  (in-app inbox)
// -----------------------------------------------------------------------------
//  CREATE TABLE notifications (
//    id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
//    type TEXT, title TEXT, body TEXT, link TEXT,
//    read BOOLEAN DEFAULT FALSE, created_at BIGINT
//  );
export interface Notification {
  id: string;
  userId: string;
  type: "score_change" | "viewed" | "system" | "milestone";
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: number;
}

// -----------------------------------------------------------------------------
//  TABLE: audit_log  (security & compliance trail)
// -----------------------------------------------------------------------------
//  CREATE TABLE audit_log (
//    id TEXT PRIMARY KEY, user_id TEXT, action TEXT, resource TEXT,
//    metadata JSONB, ip TEXT, created_at BIGINT
//  );
export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  resource?: string;
  metadata?: any;
  ip?: string;
  createdAt: number;
}

// -----------------------------------------------------------------------------
//  TABLE: subscriptions  (billing — paid plans)
// -----------------------------------------------------------------------------
export interface Subscription {
  userId: string;
  plan: "free" | "student_pro" | "recruiter_pro" | "college_enterprise";
  status: "active" | "past_due" | "cancelled";
  currentPeriodEnd: number;
}

// =============================================================================
//  Database object-store names (must match database.ts)
// =============================================================================
export const STORES = {
  users: "users",
  studentProfiles: "student_profiles",
  recruiterProfiles: "recruiter_profiles",
  colleges: "colleges",
  sessions: "sessions",
  statSnapshots: "stat_snapshots",
  scoreHistory: "score_history",
  syncJobs: "sync_jobs",
  savedSearches: "saved_searches",
  notifications: "notifications",
  auditLog: "audit_log",
  subscriptions: "subscriptions",
} as const;

export const DB_NAME = "devscore_db";
export const DB_VERSION = 1;
