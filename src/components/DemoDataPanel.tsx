import { useEffect, useState } from "react";
import { Database, Loader2, Sparkles, Trash2 } from "lucide-react";
import { isDemoDataLoaded, loadDemoData, clearDemoData } from "../server/seed";
import { refreshUserCache } from "../lib/auth";

type Tone = "soft" | "hero";

export default function DemoDataPanel({ tone = "soft" }: { tone?: Tone }) {
  const [loaded, setLoaded] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { isDemoDataLoaded().then(setLoaded); }, []);

  async function load() {
    setBusy(true); setMsg(null);
    try {
      const r = await loadDemoData();
      await refreshUserCache();
      setLoaded(true);
      setMsg(r.created === 0 ? "Demo data already present." : `Loaded ${r.created} demo accounts (1 recruiter, 1 TPO, 6 students).`);
    } catch (e: any) { setMsg(e.message || "Failed to load demo data"); }
    finally { setBusy(false); }
  }

  async function clear() {
    if (!confirm("Remove all demo accounts? Your real account stays.")) return;
    setBusy(true); setMsg(null);
    try {
      const r = await clearDemoData();
      await refreshUserCache();
      setLoaded(false);
      setMsg(`Removed ${r.removed} demo accounts.`);
    } catch (e: any) { setMsg(e.message || "Failed to clear demo data"); }
    finally { setBusy(false); }
  }

  if (loaded === null) return null;

  const baseCls = tone === "hero"
    ? "rounded-2xl border border-amber-200 bg-amber-50 p-5"
    : "rounded-xl border border-slate-200 bg-slate-50 p-4";

  return (
    <div className={baseCls}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-200 text-amber-700 grid place-items-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900">
            {loaded ? "Demo data is loaded" : "Demo mode (optional)"}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            {loaded
              ? "Demo accounts (priya@, arjun@, recruiter@, tpo@…) currently exist alongside your real users."
              : "Want to see how the platform feels with a populated leaderboard? Load a sample dataset (1 recruiter, 1 TPO, 6 students). Useful for investor demos."}
          </div>
          {msg && <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">{msg}</div>}
          <div className="mt-3 flex gap-2 flex-wrap">
            {!loaded ? (
              <button onClick={load} disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                Load demo data
              </button>
            ) : (
              <button onClick={clear} disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:border-rose-300 hover:text-rose-700 disabled:opacity-50">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Remove demo data
              </button>
            )}
            {loaded && (
              <span className="text-[11px] text-slate-500 inline-flex items-center">
                Demo logins: <code className="ml-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">priya@demo.devscore.app</code> · pwd <code className="ml-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">demo1234</code>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
