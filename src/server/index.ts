// Bootstrap the backend: open DB, hydrate UI cache, start jobs.
// NOTE: no auto-seed. Platform starts empty. First user to register becomes #1.
import { startBackgroundJobs } from "./jobs";
import { bootAuth, refreshUserCache } from "../lib/auth";
import { db } from "./database";

export async function bootstrap() {
  await db();              // open IndexedDB / connect Supabase
  await refreshUserCache();
  await bootAuth();
  startBackgroundJobs();
}
