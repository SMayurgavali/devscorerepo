import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Sparkles, ArrowRight } from "lucide-react";
import { getAllUsers } from "../lib/db";
import { computeReport, gradeMeta } from "../lib/score";
import DemoDataPanel from "../components/DemoDataPanel";
import { currentUser } from "../lib/auth";

export default function Leaderboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 5000); return () => clearInterval(t); }, []);

  const ranked = useMemo(() => {
    void tick;
    return getAllUsers()
      .filter((u) => u.role === "student")
      .map((u) => ({ user: u, ...computeReport(u) }))
      .sort((a, b) => b.total - a.total);
  }, [tick]);

  const me = currentUser();

  if (ranked.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 text-indigo-600 grid place-items-center mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">No one's on the leaderboard yet</h1>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          The DevScore leaderboard is brand new. Be the first verified developer to get ranked.
        </p>
        <div className="mt-6 flex gap-2 justify-center flex-wrap">
          {!me && (
            <Link to="/auth?mode=signup&role=student" className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Be user #1
            </Link>
          )}
          {me?.role === "student" && (
            <Link to="/dashboard" className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 inline-flex items-center gap-2">
              Sync my score <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="mt-10 text-left">
          <DemoDataPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <Trophy className="w-9 h-9 mx-auto text-amber-500 mb-2" />
        <h1 className="text-2xl font-bold text-slate-900">Global Leaderboard</h1>
        <p className="text-slate-500 text-sm mt-1">Top developers ranked by live, verified DevScore.</p>
      </div>

      {/* podium (only show if 3+ ranked) */}
      {ranked.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[1, 0, 2].map((idx) => {
            const r = ranked[idx]; if (!r) return <div key={idx} />;
            const heights = ["h-28", "h-36", "h-24"];
            const colors = ["bg-slate-200", "bg-amber-300", "bg-amber-700/30"];
            const labels = [2, 1, 3];
            return (
              <Link to={`/u/${r.user.id}`} key={r.user.id} className="text-center group">
                <div className="w-14 h-14 mx-auto rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold text-lg mb-2 group-hover:scale-110 transition">{r.user.name[0]}</div>
                <div className="font-semibold text-sm text-slate-900 truncate">{r.user.name}</div>
                <div className="text-xs text-slate-500">{r.total}</div>
                <div className={`mt-2 ${heights[idx]} rounded-t-lg ${colors[idx]} grid place-items-center text-2xl font-bold text-slate-700`}>{labels[idx]}</div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {ranked.map((r, i) => {
          const m = gradeMeta(r.grade);
          const isMe = me?.id === r.user.id;
          return (
            <Link to={`/u/${r.user.id}`} key={r.user.id} className={`flex items-center gap-4 p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0 ${isMe ? "bg-indigo-50/40" : ""}`}>
              <div className="w-8 text-center text-slate-400 font-mono text-sm">#{i + 1}</div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold">{r.user.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  {r.user.name}
                  {isMe && <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">you</span>}
                </div>
                <div className="text-xs text-slate-500">{r.user.college} · {r.user.location}</div>
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${m.bg} ${m.color}`}>{r.grade}</span>
              <div className="w-20 text-right text-xl font-bold text-slate-900 tabular-nums">{r.total}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
