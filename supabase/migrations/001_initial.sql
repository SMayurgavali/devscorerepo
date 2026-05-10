-- =============================================================================
--  DevScore — Initial Postgres schema (Supabase-ready)
--  Run once in the Supabase SQL editor (Database → SQL → New query → Paste → Run)
-- =============================================================================

-- ---------------------------------------------------------------------------
--  Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS colleges (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  location     TEXT,
  plan         TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  created_at   BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  salt            TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('student','recruiter','tpo','admin')),
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  college_id      TEXT REFERENCES colleges(id) ON DELETE SET NULL,
  created_at      BIGINT NOT NULL,
  last_login_at   BIGINT
);
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_college_id   ON users(college_id);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio                  TEXT,
  location             TEXT,
  college_id           TEXT REFERENCES colleges(id) ON DELETE SET NULL,
  linkedin_url         TEXT,
  linkedin_checklist   JSONB,
  github_username      TEXT,
  gitlab_username      TEXT,
  leetcode_username    TEXT,
  codechef_username    TEXT,
  hackerrank_username  TEXT,
  visible_to_recruiters BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_student_profiles_college_id ON student_profiles(college_id);

CREATE TABLE IF NOT EXISTS recruiter_profiles (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name   TEXT,
  company_size   TEXT,
  industry       TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token        TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at   BIGINT NOT NULL,
  ip           TEXT,
  user_agent   TEXT,
  created_at   BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS stat_snapshots (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  captured_at   BIGINT NOT NULL,
  source        TEXT NOT NULL CHECK (source IN ('github','gitlab','leetcode','codechef','hackerrank','linkedin')),
  data          JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stat_snapshots_user_id ON stat_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_stat_snapshots_user_date ON stat_snapshots(user_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS score_history (
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date             TEXT NOT NULL,                -- YYYY-MM-DD
  total            INTEGER NOT NULL,
  grade            TEXT NOT NULL,
  linkedin_score   INTEGER NOT NULL,
  code_score       INTEGER NOT NULL,
  dsa_score        INTEGER NOT NULL,
  PRIMARY KEY (user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_score_history_user_id ON score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_score_history_date    ON score_history(date);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              TEXT NOT NULL CHECK (status IN ('queued','running','success','partial','failed')),
  started_at          BIGINT NOT NULL,
  finished_at         BIGINT,
  sources_attempted   JSONB NOT NULL DEFAULT '[]'::jsonb,
  errors              JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status  ON sync_jobs(status);

CREATE TABLE IF NOT EXISTS saved_searches (
  id              TEXT PRIMARY KEY,
  recruiter_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  filters         JSONB NOT NULL,
  created_at      BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_saved_searches_recruiter_id ON saved_searches(recruiter_id);

CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  link        TEXT,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT,
  metadata    JSONB,
  ip          TEXT,
  created_at  BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action  ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL CHECK (plan IN ('free','student_pro','recruiter_pro','college_enterprise')),
  status               TEXT NOT NULL CHECK (status IN ('active','past_due','cancelled')),
  current_period_end   BIGINT NOT NULL
);

-- ---------------------------------------------------------------------------
--  Row-Level Security (production hardening)
--  Uncomment and customise once you wire Supabase Auth (auth.uid()).
-- ---------------------------------------------------------------------------

-- ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_profiles   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stat_snapshots     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE score_history      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sync_jobs          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saved_searches     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;

-- Example: students can only see their own profile
-- CREATE POLICY "students_self" ON student_profiles
--   FOR ALL USING (user_id = auth.uid()::text);

-- Example: recruiters can read profiles where visible_to_recruiters = true
-- CREATE POLICY "recruiters_read_visible" ON student_profiles
--   FOR SELECT USING (visible_to_recruiters = true
--                AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'recruiter'));

-- Example: TPOs can read profiles in their college
-- CREATE POLICY "tpo_read_college" ON student_profiles
--   FOR SELECT USING (college_id = (SELECT college_id FROM users WHERE id = auth.uid()::text));
