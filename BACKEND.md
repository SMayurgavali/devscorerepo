# DevScore — Backend & Storage Guide

DevScore ships with a **pluggable storage adapter**. The same product runs on:

| Backend | When to use | Setup time |
|---|---|---|
| **IndexedDB** *(default)* | Local dev · static deploys · single-user demos · investor pitches | 0 minutes |
| **Supabase / Postgres** | Production · multi-device · multi-user · real SaaS | ~15 minutes |

Switching backends is a **single environment variable** — zero code changes.

---

## How it works

```
┌────────────────────────────┐
│  React UI (pages/*)        │
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│  src/server/api.ts         │  ← service layer (auth, sync, search, audit…)
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│  src/server/repositories.ts│  ← typed CRUD per table
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│  Adapter (interface)       │  ← src/server/adapters/types.ts
└──┬─────────────────────┬───┘
   │                     │
┌──▼──────────┐     ┌────▼───────┐
│ IndexedDB   │     │ Supabase   │
│ adapter     │     │ adapter    │
└─────────────┘     └────────────┘
```

Repositories know nothing about storage. Adapters implement six methods (`get`, `getAll`, `getByIndex`, `put`, `delete`, `deleteWhere`).

---

## Swap from IndexedDB → Supabase (production)

### 1. Create a Supabase project
1. Go to https://supabase.com → **New project**
2. Note your **Project URL** and **anon public key** from *Project Settings → API*

### 2. Run the schema migration
1. Open **SQL Editor → New query**
2. Paste the entire contents of `supabase/migrations/001_initial.sql`
3. Click **Run**. Done — 12 tables + indexes are live.

### 3. Set environment variables in your hosting provider

For local dev, create `.env.local`:
```env
VITE_BACKEND=supabase
VITE_SUPABASE_URL=https://YOURPROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

For Vercel / Netlify / Cloudflare Pages: add the same three env vars in your dashboard.

### 4. Redeploy
That's it. The same code that ran on IndexedDB now talks to Postgres.

You can verify in the **TPO Admin → System Audit** tab — the footer shows which adapter is active.

---

## Optional production hardening

The migration file ships with **Row-Level Security** examples commented at the bottom. Enable them once you've migrated to Supabase Auth (`auth.uid()`):

```sql
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_self" ON student_profiles
  FOR ALL USING (user_id = auth.uid()::text);
```

Other recommendations for prod:
- **Move password hashing to a server function.** The current PBKDF2 stretching runs in the browser; a server-side bcrypt/argon2 is stronger.
- **Use Supabase Auth** for OAuth (GitHub, Google) instead of the built-in email/password.
- **Run the daily sync as a Supabase Edge Function** triggered by `pg_cron` instead of `setInterval` in the browser.
- **Add rate limits** on sync endpoints (Supabase has built-in API rate limiting).

---

## Adding a new storage backend

Implement the `Adapter` interface (6 methods) in a new file under `src/server/adapters/` and register it in `src/server/database.ts`. Anything that speaks key/value works — Firestore, DynamoDB, Cloudflare D1, etc.
