import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, Flame, Target, ChevronRight, GraduationCap, Users } from "lucide-react";
import { getAllUsers } from "../lib/db";
import { computeReport, gradeMeta } from "../lib/score";
import DemoDataPanel from "../components/DemoDataPanel";

export default function Recruiter() {
  const [q, setQ] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [language, setLanguage] = useState("");
  const [grade, setGrade] = useState<string>("");

  const candidates = useMemo(() => {
    return getAllUsers()
      .filter((u) => u.role === "student")
      .map((u) => ({ user: u, ...computeReport(u) }))
      .filter(({ user, total, grade: g }) => {
        if (total < minScore) return false;
        if (grade && g !== grade) return false;
        if (q) {
          const hay = (user.name + " " + (user.location || "") + " " + (user.college || "") + " " + (user.bio || "")).toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        if (language) {
          const langs = Object.keys(user.stats?.github?.languages || {});
          if (!langs.some((l) => l.toLowerCase().includes(language.toLowerCase()))) return false;
        }
        return true;
      })
      .sort((a, b) => b.total - a.total);
  }, [q, minScore, language, grade]);

  const allLangs = useMemo(() => {
    const s = new Set<string>();
    getAllUsers().forEach((u) => Object.keys(u.stats?.github?.languages || {}).forEach((l) => s.add(l)));
    return [...s].sort();
  }, []);

  const totalStudents = useMemo(() => getAllUsers().filter((u) => u.role === "student").length, []);

  if (totalStudents === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 text-indigo-600 grid place-items-center mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">No candidates yet</h1>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          The talent pool is empty. As soon as students sign up and sync their profiles, you'll see them ranked here by verified DevScore.
        </p>
        <div className="mt-8 text-left">
          <DemoDataPanel tone="hero" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Find verified developers</h1>
      <p className="text-slate-500 mt-1 text-sm">
        Every score below is computed from public, verifiable activity on LinkedIn, GitHub, and DSA platforms.
      </p>

      <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, college, location..."
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm">
            <option value="">Any language</option>
            {allLangs.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm">
            <option value="">Any grade</option>
            <option>A+</option><option>A</option><option>B</option><option>C</option><option>D</option>
          </select>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <span>Min score: <b className="text-indigo-600 tabular-nums">{minScore}</b></span>
          <input type="range" min={0} max={1000} step={50} value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="flex-1 max-w-xs accent-indigo-600" />
          <span className="ml-auto"><b className="text-slate-700">{candidates.length}</b> candidates match</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {candidates.map(({ user, total, grade: g }, i) => {
          const m = gradeMeta(g);
          return (
            <Link key={user.id} to={`/u/${user.id}`} className="group rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm p-4 flex items-center gap-4 transition">
              <div className="text-slate-400 font-mono w-6 text-center text-sm">#{i + 1}</div>
              <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold">{user.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold text-slate-900">{user.name}</div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${m.bg} ${m.color}`}>{g} · {m.label}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                  {user.college && <span className="inline-flex items-center gap-1"><GraduationCap className="w-3 h-3" />{user.college}</span>}
                  {user.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{user.location}</span>}
                  {user.stats?.github && <span className="inline-flex items-center gap-1"><Star className="w-3 h-3" />{user.stats.github.totalStars}</span>}
                  {user.stats?.github && <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" />{user.stats.github.streakDays}d</span>}
                  {user.stats?.leetcode && <span className="inline-flex items-center gap-1"><Target className="w-3 h-3" />{user.stats.leetcode.totalSolved} LC</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Object.keys(user.stats?.github?.languages || {}).slice(0, 5).map((l) => (
                    <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{l}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold tabular-nums text-slate-900">{total}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">DevScore</div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition" />
            </Link>
          );
        })}
        {candidates.length === 0 && (
          <div className="text-center py-20 text-slate-500">No candidates match your filters.</div>
        )}
      </div>
    </div>
  );
}
