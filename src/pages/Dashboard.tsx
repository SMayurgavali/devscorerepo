import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertCircle, Briefcase, CheckCircle2, ChevronRight, Code2, Database, ExternalLink, Flame,
  Lightbulb, Loader2, RefreshCw, Star, Target, TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { currentUser, saveStudentSync } from "../lib/auth";
import { activeBackend } from "../server/database";
import { upsertUser, type LinkedInChecklist } from "../lib/db";
import { fetchCodechefStats, fetchGithubStats, fetchGitlabStats, fetchLeetcodeStats } from "../lib/api";
import { appendDailySnapshot, computeReport, gradeMeta, type Pillar } from "../lib/score";
import ScoreRing from "../components/ScoreRing";
import Roadmap from "../components/Roadmap";

export default function Dashboard() {
  const [user, setUser] = useState(currentUser());
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [github, setGithub] = useState(user?.github || "");
  const [gitlab, setGitlab] = useState(user?.gitlab || "");
  const [leetcode, setLeetcode] = useState(user?.leetcode || "");
  const [hackerrank, setHackerrank] = useState(user?.hackerrank || "");
  const [codechef, setCodechef] = useState(user?.codechef || "");
  const [checklist, setChecklist] = useState<LinkedInChecklist>(
    user?.linkedinChecklist || {
      hasHeadline: false, hasSummary: false, hasExperience: false,
      hasSkills: false, hasRecommendations: false, has500Plus: false,
    },
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const report = useMemo(
    () => computeReport({ ...user, linkedin, linkedinChecklist: checklist }),
    [user, linkedin, checklist],
  );

  useEffect(() => {
    if (user && !user.stats && (user.github || user.leetcode)) void sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sync() {
    if (!user) return;
    setBusy(true); setMsg(null);
    try {
      const stats: any = { lastSyncedAt: Date.now() };
      const errors: string[] = [];
      const tasks: Promise<void>[] = [];
      if (github) tasks.push(fetchGithubStats(github).then(s => { stats.github = s; }).catch(e => { errors.push(`GitHub: ${e.message}`); }));
      if (gitlab) tasks.push(fetchGitlabStats(gitlab).then(s => { stats.gitlab = s; }).catch(e => { errors.push(`GitLab: ${e.message}`); }));
      if (leetcode) tasks.push(fetchLeetcodeStats(leetcode).then(s => { stats.leetcode = s; }).catch(e => { errors.push(`LeetCode: ${e.message}`); }));
      if (codechef) tasks.push(fetchCodechefStats(codechef).then(s => { stats.codechef = s; }).catch(e => { errors.push(`CodeChef: ${e.message}`); }));
      await Promise.all(tasks);

      const next = {
        ...user, linkedin, linkedinChecklist: checklist,
        github, gitlab, leetcode, hackerrank, codechef, stats,
      };
      const r = computeReport(next);
      next.history = appendDailySnapshot(next, r.total, r.grade);
      upsertUser(next);
      // Persist to IndexedDB through the backend API (creates a sync_job,
      // writes stat_snapshots, updates score_history, fires notifications).
      await saveStudentSync(next, stats);
      setUser({ ...next });
      setMsg(errors.length
        ? { kind: "err", text: "Synced with warnings — " + errors.join(" · ") }
        : { kind: "ok", text: "Profile synced. Your DevScore is up to date." });
    } catch (e: any) {
      setMsg({ kind: "err", text: e.message || "Sync failed" });
    } finally { setBusy(false); }
  }

  if (!user) return null;
  const m = gradeMeta(report.grade);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="text-sm text-slate-500">Hi {user.name.split(" ")[0]} 👋</div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Your DevScore Report</h1>
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${activeBackend() === "supabase" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}>
              <Database className="w-3 h-3" />
              {activeBackend() === "supabase" ? "Cloud Sync Active (Supabase)" : "Local Storage Mode"}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/u/${user.id}`} className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-slate-400 text-sm inline-flex items-center gap-2 text-slate-700">
            <ExternalLink className="w-4 h-4" /> Public profile
          </Link>
          <button onClick={sync} disabled={busy} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm inline-flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {busy ? "Syncing…" : "Sync now"}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 rounded-lg p-3 text-sm flex items-start gap-2 ${msg.kind === "ok" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
          {msg.kind === "ok" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* HERO REPORT CARD */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 grid md:grid-cols-[auto_1fr] gap-6 items-center">
        <ScoreRing score={report.total} grade={report.grade} />
        <div className="space-y-3">
          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold ${m.bg} ${m.color}`}>
            Grade {report.grade} — {m.label}
          </div>
          <div className="text-sm text-slate-600">
            Your score is calculated from three pillars recruiters actually check:
            <b> LinkedIn</b>, <b>GitHub/GitLab</b>, and <b>DSA platforms</b>.
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-2">
            {report.pillars.map((p) => <PillarBar key={p.key} p={p} />)}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* LEFT: connections */}
        <div className="space-y-6">
          <Card title="1. LinkedIn" subtitle="Branding · 200 pts" tone="indigo">
            <Field label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/your-name" icon={<Briefcase className="w-3.5 h-3.5" />} />
            <div className="mt-4 text-xs font-medium text-slate-600 mb-2">Self-attest your profile (recruiters will verify):</div>
            <div className="space-y-1.5">
              {[
                ["hasHeadline", "Keyword-rich headline"],
                ["hasSummary", "About / Summary section"],
                ["hasExperience", "Experience or projects listed"],
                ["hasSkills", "10+ skills added"],
                ["hasRecommendations", "1+ recommendation"],
                ["has500Plus", "500+ connections"],
              ].map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(checklist as any)[k]}
                    onChange={(e) => setChecklist({ ...checklist, [k]: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Card>

          <Card title="2. Code" subtitle="Proof of Work · 400 pts" tone="emerald">
            <Field label="GitHub" value={github} onChange={setGithub} placeholder="username or profile URL" icon={<Code2 className="w-3.5 h-3.5" />} />
            <Field label="GitLab" value={gitlab} onChange={setGitlab} placeholder="username or profile URL" icon={<Code2 className="w-3.5 h-3.5" />} />
          </Card>

          <Card title="3. DSA" subtitle="Logic · 400 pts" tone="sky">
            <Field label="LeetCode" value={leetcode} onChange={setLeetcode} placeholder="username or profile URL" icon={<Target className="w-3.5 h-3.5" />} />
            <Field label="CodeChef" value={codechef} onChange={setCodechef} placeholder="handle or profile URL" icon={<Target className="w-3.5 h-3.5" />} />
            <Field label="HackerRank" value={hackerrank} onChange={setHackerrank} placeholder="handle or profile URL" icon={<Target className="w-3.5 h-3.5" />} />
          </Card>

          <button onClick={sync} disabled={busy} className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Save & re-grade
          </button>
        </div>

        {/* RIGHT: details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Level-Up Roadmap */}
          <Roadmap report={report} />

          {/* Trend */}
          <Card title="Score trend (last 30 days)" icon={<TrendingUp className="w-4 h-4 text-slate-400" />}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={(user.history || []).slice(-30)}>
                <defs>
                  <linearGradient id="ds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 1000]} />
                <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#ds)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Quick stats */}
          {user.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Mini icon={<Flame className="w-4 h-4 text-orange-500" />} label="Commit streak" value={`${user.stats.github?.streakDays ?? 0}d`} />
              <Mini icon={<Star className="w-4 h-4 text-amber-500" />} label="GitHub stars" value={`${user.stats.github?.totalStars ?? 0}`} />
              <Mini icon={<Target className="w-4 h-4 text-sky-600" />} label="LC solved" value={`${user.stats.leetcode?.totalSolved ?? 0}`} />
              <Mini icon={<Code2 className="w-4 h-4 text-emerald-600" />} label="Repos" value={`${user.stats.github?.publicRepos ?? 0}`} />
            </div>
          )}

          {/* Detailed pillar breakdowns */}
          {report.pillars.map((p) => <PillarReport key={p.key} pillar={p} />)}
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, icon, tone, children }: any) {
  const tones: Record<string, string> = {
    indigo: "border-l-indigo-500", emerald: "border-l-emerald-500", sky: "border-l-sky-500",
  };
  const cls = tone ? `border-l-4 ${tones[tone]}` : "";
  return (
    <div className={`rounded-2xl bg-white border border-slate-200 shadow-sm p-5 ${cls}`}>
      {(title || subtitle) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-slate-900">{title}</div>
            {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
          </div>
          {icon}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, icon }: any) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="text-xs font-medium text-slate-600 flex items-center gap-1 mb-1">{icon}{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
    </div>
  );
}

function Mini({ icon, label, value }: any) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">{icon}{label}</div>
      <div className="font-bold text-xl text-slate-900 mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

function PillarBar({ p }: { p: Pillar }) {
  const pct = (p.score / p.max) * 100;
  const color = p.key === "linkedin" ? "bg-indigo-500" : p.key === "code" ? "bg-emerald-500" : "bg-sky-500";
  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-slate-700">{p.label.split(" (")[0]}</span>
        <span className="tabular-nums text-slate-500">{Math.round(p.score)}/{p.max}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PillarReport({ pillar }: { pillar: Pillar }) {
  const tone = pillar.key === "linkedin" ? "indigo" : pillar.key === "code" ? "emerald" : "sky";
  const dot = pillar.key === "linkedin" ? "bg-indigo-500" : pillar.key === "code" ? "bg-emerald-500" : "bg-sky-500";
  return (
    <Card tone={tone}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-slate-900 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {pillar.label}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Score: <b>{Math.round(pillar.score)}</b> / {pillar.max}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
      <div className="space-y-2.5">
        {pillar.items.map((it) => {
          const pct = (it.value / it.max) * 100;
          return (
            <div key={it.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700">{it.label}</span>
                <span className="text-slate-400 tabular-nums">{Math.round(it.value)}/{it.max}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${dot}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{it.note}</div>
            </div>
          );
        })}
      </div>
      {pillar.insights.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> How to improve
          </div>
          <ul className="space-y-1 text-xs text-amber-900">
            {pillar.insights.map((i, k) => <li key={k} className="flex gap-1.5"><span>•</span>{i}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}
