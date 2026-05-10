// =============================================================================
//  Storage factory.
//  Picks the adapter at boot based on VITE_BACKEND. Default = indexeddb.
//
//  To swap to Postgres in production:
//    1. Run supabase/migrations/001_initial.sql in your Supabase project.
//    2. Set env vars in your hosting provider:
//         VITE_BACKEND=supabase
//         VITE_SUPABASE_URL=https://xxx.supabase.co
//         VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
//    3. Redeploy. Zero code changes.
// =============================================================================

import { indexedDBAdapter } from "./adapters/indexeddb";
import { supabaseAdapter } from "./adapters/supabase";
import type { Adapter } from "./adapters/types";

let _adapter: Adapter | null = null;

export async function db(): Promise<Adapter> {
  if (_adapter) return _adapter;
  const backend = (import.meta.env.VITE_BACKEND as string) || "indexeddb";
  _adapter = backend === "supabase" ? supabaseAdapter : indexedDBAdapter;
  await _adapter.init();
  return _adapter;
}

export function activeBackend(): "indexeddb" | "supabase" {
  return _adapter?.name ?? ((import.meta.env.VITE_BACKEND as string) === "supabase" ? "supabase" : "indexeddb");
}

// crypto-safe helpers (backend-agnostic)
export function uid(prefix = ""): string {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return prefix + [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function token(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}
