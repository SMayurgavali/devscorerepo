// =============================================================================
//  Background jobs — the "cron" running in the browser tab.
//  In production these would be Supabase Edge Functions, GitHub Actions,
//  or a dedicated worker (e.g. BullMQ). The code shape is identical.
// =============================================================================

import { syncStudent, audit } from "./api";
import { Sessions, Users } from "./repositories";

let _started = false;

export function startBackgroundJobs() {
  if (_started) return;
  _started = true;

  // 1) Cleanup expired sessions every 5 minutes.
  setInterval(() => { Sessions.cleanupExpired().catch(() => {}); }, 5 * 60 * 1000);

  // 2) Daily auto-sync — runs every 30 minutes; in prod this would be a
  //    nightly cron. We re-sync any student profile not synced in 12+ hours.
  const tickAutoSync = async () => {
    try {
      const students = await Users.listByRole("student");
      const cutoff = Date.now() - 12 * 60 * 60 * 1000;
      for (const u of students) {
        // demo: only auto-sync if it's been a while
        const last = (u as any).lastSyncAttempt || 0;
        if (last > cutoff) continue;
        (u as any).lastSyncAttempt = Date.now();
        await Users.update(u);
        try { await syncStudent(u.id); } catch { /* swallow */ }
      }
      await audit(undefined, "cron.auto_sync_complete", "sync_jobs", { count: students.length });
    } catch {/* swallow */}
  };
  setInterval(tickAutoSync, 30 * 60 * 1000);
}
