import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Briefcase, Code2, Copy, ExternalLink, Flame, GraduationCap, MapPin, Star, Target } from "lucide-react";
import { getUser } from "../lib/db";
import { computeReport, gradeMeta, type Pillar } from "../lib/score";
import ScoreRing from "../components/ScoreRing";

export default function Profile() {
  const { id } = useParams();
  const user = id ? getUser(id) : null;
  const report = useMemo(() => computeReport(user || {}), [user]);
  const [copied, setCopied] = useState(false);

  if (!user) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500">User not found.</div>;
  const m = gradeMeta(report.grade);
  const widgetCode = `<iframe src="${location.origin}/widget/${user.id}" width="320" height="120" frameborder="0"></iframe>`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/leaderboard" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back</Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 grid md:grid-cols-[auto_1fr_auto] gap-6 items-center">
        <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-700 grid place-items-center text-3xl font-bold">{user.name[0]}</div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
            {user.college && <span className="inline-flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />{user.college}</span>}
            {user.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{user.location}</span>}
          </div>
          <div className="text-sm mt-2 flex items-center gap-3 flex-wrap">
            {user.linkedin && <a href={user.linkedin} target="_blank" className="inline-flex items-center gap-1 text-indigo-600 hover:underline"><Briefcase className="w-3.5 h-3.5" />LinkedIn <ExternalLink className="w-3 h-3" /></a>}
            {user.github && <a href={`https://github.com/${user.github}`} target="_blank" className="inline-flex items-center gap-1 text-emerald-700 hover:underline"><Code2 className="w-3.5 h-3.5" />github/{user.github} <ExternalLink className="w-3 h-3" /></a>}
            {user.leetcode && <a href={`https://leetcode.com/${user.leetcode}`} target="_blank" className="inline-flex items-center gap-1 text-sky-700 hover:underline"><Target className="w-3.5 h-3.5" />leetcode/{user.leetcode} <ExternalLink className="w-3 h-3" /></a>}
          </div>
          {user.bio && <p className="mt-3 text-sm text-slate-600 max-w-xl">{user.bio}</p>}
        </div>
        <ScoreRing score={report.total} grade={report.grade} size={140} />
      </div>

      {/* Pillars summary */}
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        {report.pillars.map((p) => {
          const color = p.key === "linkedin" ? "bg-indigo-500" : p.key === "code" ? "bg-emerald-500" : "bg-sky-500";
          return (
            <div key={p.key} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">{p.label.split(" (")[0]}</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{Math.round(p.score)}<span className="text-slate-400 text-sm font-normal"> / {p.max}</span></div>
              <div className="h-1.5 mt-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color}`} style={{ width: `${(p.score / p.max) * 100}%` }} /></div>
            </div>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <Stat label="Grade" value={report.grade} accent={`${m.bg} ${m.color}`} />
        <Stat label="GitHub stars" value={`${user.stats?.github?.totalStars ?? 0}`} icon={<Star className="w-4 h-4 text-amber-500" />} />
        <Stat label="Streak" value={`${user.stats?.github?.streakDays ?? 0}d`} icon={<Flame className="w-4 h-4 text-orange-500" />} />
        <Stat label="LC solved" value={`${user.stats?.leetcode?.totalSolved ?? 0}`} icon={<Target className="w-4 h-4 text-sky-600" />} />
      </div>

      {/* Trend */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900 mb-3">DevScore trend</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={user.history || []}>
            <defs>
              <linearGradient id="p" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(d) => d.slice(5)} />
            <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 1000]} />
            <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#p)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Detail */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {report.pillars.map((p: Pillar) => {
          const dot = p.key === "linkedin" ? "bg-indigo-500" : p.key === "code" ? "bg-emerald-500" : "bg-sky-500";
          return (
            <div key={p.key} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="font-semibold text-slate-900 flex items-center gap-2 mb-3"><span className={`w-2 h-2 rounded-full ${dot}`} />{p.label.split(" (")[0]}</div>
              <div className="space-y-2">
                {p.items.map((it) => (
                  <div key={it.label}>
                    <div className="flex justify-between text-xs"><span className="text-slate-700">{it.label}</span><span className="text-slate-400 tabular-nums">{Math.round(it.value)}/{it.max}</span></div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-1"><div className={`h-full ${dot}`} style={{ width: `${(it.value / it.max) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Embed widget */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Embed this profile</div>
        <p className="text-xs text-slate-500 mt-1">Add a live DevScore badge to your portfolio site or LinkedIn featured section.</p>
        <div className="mt-3 flex gap-3 items-start flex-wrap">
          <iframe src={`/widget/${user.id}`} width={320} height={120} className="rounded-lg border border-slate-200" />
          <div className="flex-1 min-w-[280px]">
            <pre className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto text-slate-700"><code>{widgetCode}</code></pre>
            <button onClick={() => { navigator.clipboard.writeText(widgetCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:border-indigo-400 inline-flex items-center gap-1.5 text-slate-700">
              <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy embed code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, accent }: any) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500 flex items-center gap-1.5">{icon}{label}</div>
      <div className={`mt-1 font-bold ${accent ? `inline-block px-2 py-0.5 rounded text-xs uppercase tracking-wider ${accent}` : "text-xl text-slate-900"}`}>{value}</div>
    </div>
  );
}
