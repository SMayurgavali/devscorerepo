import { useParams } from "react-router-dom";
import { getUser } from "../lib/db";
import { computeReport, gradeMeta } from "../lib/score";
import { Flame, Star } from "lucide-react";

export default function Widget() {
  const { id } = useParams();
  const u = id ? getUser(id) : null;
  if (!u) return <div className="p-4 text-xs text-slate-500">Profile not found.</div>;
  const r = computeReport(u);
  const m = gradeMeta(r.grade);
  return (
    <div className="p-3 bg-white min-h-screen">
      <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3 shadow-sm">
        <div className="w-12 h-12 rounded-lg bg-indigo-600 grid place-items-center text-white font-extrabold text-xl">D</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">DevScore · Live</div>
          <div className="font-semibold truncate text-sm text-slate-900">{u.name}</div>
          <div className="text-[10px] text-slate-500 flex gap-2 mt-0.5">
            <span className="inline-flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-amber-500" />{u.stats?.github?.totalStars ?? 0}</span>
            <span className="inline-flex items-center gap-0.5"><Flame className="w-2.5 h-2.5 text-orange-500" />{u.stats?.github?.streakDays ?? 0}d</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold leading-none tabular-nums text-slate-900">{r.total}</div>
          <div className={`mt-1 text-[10px] uppercase tracking-wider font-bold inline-block px-1.5 py-0.5 rounded ${m.bg} ${m.color}`}>{r.grade}</div>
        </div>
      </div>
    </div>
  );
}
