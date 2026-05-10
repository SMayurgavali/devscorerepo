// =============================================================================
//  Supabase / Postgres adapter.
//  Activated when VITE_BACKEND=supabase and VITE_SUPABASE_URL/ANON_KEY are set.
//
//  Notes:
//   • TS code uses camelCase. Postgres uses snake_case. We translate both ways.
//   • Composite primary keys (score_history) use eq().eq() on the 2 columns.
//   • RLS policies are recommended; see supabase/migrations/001_initial.sql.
// =============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { STORES } from "../schema";
import type { Adapter, PK } from "./types";

// camelCase ↔ snake_case
const toSnake = (s: string) => s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function rowOut(o: any): any {
  if (Array.isArray(o)) return o.map(rowOut);
  if (o && typeof o === "object") {
    const r: any = {};
    for (const k of Object.keys(o)) r[toCamel(k)] = rowOut(o[k]);
    return r;
  }
  return o;
}
function rowIn(o: any): any {
  if (Array.isArray(o)) return o.map(rowIn);
  if (o && typeof o === "object") {
    const r: any = {};
    for (const k of Object.keys(o)) r[toSnake(k)] = rowIn(o[k]);
    return r;
  }
  return o;
}

// Map JS object-store names → Postgres table names
const TABLE: Record<string, string> = {
  [STORES.users]: "users",
  [STORES.studentProfiles]: "student_profiles",
  [STORES.recruiterProfiles]: "recruiter_profiles",
  [STORES.colleges]: "colleges",
  [STORES.sessions]: "sessions",
  [STORES.statSnapshots]: "stat_snapshots",
  [STORES.scoreHistory]: "score_history",
  [STORES.syncJobs]: "sync_jobs",
  [STORES.savedSearches]: "saved_searches",
  [STORES.notifications]: "notifications",
  [STORES.auditLog]: "audit_log",
  [STORES.subscriptions]: "subscriptions",
};

// Primary-key column(s) per table
const PK_COL: Record<string, string | [string, string]> = {
  users: "id", student_profiles: "user_id", recruiter_profiles: "user_id",
  colleges: "id", sessions: "token", stat_snapshots: "id",
  score_history: ["user_id", "date"], sync_jobs: "id",
  saved_searches: "id", notifications: "id", audit_log: "id",
  subscriptions: "user_id",
};

class SupabaseAdapter implements Adapter {
  readonly name = "supabase" as const;
  private client!: SupabaseClient;

  async init() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      throw new Error("Supabase backend selected but VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing.");
    }
    this.client = createClient(url, anon, { auth: { persistSession: false } });
  }

  private t(store: string) { return TABLE[store] || store; }

  async get<T>(store: string, key: PK) {
    const table = this.t(store);
    const pk = PK_COL[table];
    let q = this.client.from(table).select("*");
    if (Array.isArray(pk) && Array.isArray(key)) {
      q = q.eq(pk[0], key[0]).eq(pk[1], key[1]);
    } else {
      q = q.eq(pk as string, key as any);
    }
    const { data, error } = await q.limit(1).maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    return data ? (rowOut(data) as T) : undefined;
  }

  async getAll<T>(store: string) {
    const { data, error } = await this.client.from(this.t(store)).select("*");
    if (error) throw error;
    return rowOut(data || []) as T[];
  }

  async getByIndex<T>(store: string, column: string, value: any) {
    const { data, error } = await this.client.from(this.t(store)).select("*").eq(toSnake(column), value);
    if (error) throw error;
    return rowOut(data || []) as T[];
  }

  async put<T>(store: string, value: T) {
    const table = this.t(store);
    const pk = PK_COL[table];
    const onConflict = Array.isArray(pk) ? pk.join(",") : pk;
    const { error } = await this.client.from(table).upsert(rowIn(value as any), { onConflict });
    if (error) throw error;
  }

  async delete(store: string, key: PK) {
    const table = this.t(store);
    const pk = PK_COL[table];
    let q = this.client.from(table).delete();
    if (Array.isArray(pk) && Array.isArray(key)) {
      q = q.eq(pk[0], key[0]).eq(pk[1], key[1]);
    } else {
      q = q.eq(pk as string, key as any);
    }
    const { error } = await q;
    if (error) throw error;
  }

  async deleteWhere(store: string, predicate: (row: any) => boolean) {
    // Pull, filter client-side, delete by PK. Not for huge tables — use SQL there.
    const all = await this.getAll<any>(store);
    const targets = all.filter(predicate);
    const table = this.t(store);
    const pk = PK_COL[table];
    for (const row of targets) {
      const key = Array.isArray(pk) ? [row[toCamel(pk[0])], row[toCamel(pk[1])]] as PK : row[toCamel(pk as string)];
      await this.delete(store, key);
    }
    return targets.length;
  }
}

export const supabaseAdapter = new SupabaseAdapter();
