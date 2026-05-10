import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, Building2, Database, Download, GraduationCap, Search, Server, ShieldAlert, Users as UsersIcon,
} from "lucide-react";
import { currentUser } from "../lib/auth";
import { getCollegeStudents, getCollege, listAudit, listColleges } from "../server/api";
import type { College } from "../server/schema";
import { gradeMeta } from "../lib/score";
import { activeBackend } from "../server/database";
import DemoDataPanel from "../components/DemoDataPanel";

type Card = Awaited<ReturnType<typeof getCollegeStudents>>[number];

export default function Admin() {
  const u = currentUser();
  const [college, setCollege] = useState<College | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [students, setStudents] = useState<Card[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"students" | "audit">("students");

  useEffect(() => {
    (async () => {
      const all = await listColleges(); setColleges(all);
      if (u?.collegeId) {
        const c = await getCollege(u.collegeId); if (c) setCollege(c);
        setStudents(await getCollegeStudents(u.collegeId));
      }
      setAudit(await listAudit(80));
    })();
  }, [u?.id, u?.collegeId]);

  const filtered = useMemo(() => students.filter((s) =>
    !q || (s.user.name + " " + (s.profile.location || "")).toLowerCase().includes(q.toLowerCase())
  ), [students, q]);

  const stats = useMemo(() => {
    if (!students.length) return null;
    const avg = Math.round(students.reduce((a, s) => a + s.report.total, 0) / students.length);
    const placement = students.filter((s) => s.report.total >= 700).length;
    const atRisk = students.filter((s) => s.report.total < 350).length;
    const gradeDist: Record<string, number> = { "A+": 0, A: 0, B: 0, C: 0, D: 0 };
    students.forEach((s) => { gradeDist[s.report.grade] = (gradeDist[s.report.grade] || 0) + 1; });
    return { avg, placement, atRisk, gradeDist };
  }, [students]);

  function exportCsv() {
    const header = "Name,Email,Score,Grade,Linkedin,Code,DSA,GitHub,LeetCode,Location\n";
    const rows = filtered.map((s) =>
      [
        s.user.name, s.user.email, s.report.total, s.report.grade,
        ...s.report.pillars.map((p) => Math.round(p.score)),
        s.profile.githubUsername || "", s.profile.leetcodeUsername || "",
        s.profile.location || "",
      ].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${college?.name || "students"}-devscores.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!u || u.role !== "tpo") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="text-sm text-slate-500 inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {colleges.length} colleges in network</div>
          <h1 className="text-2xl font-bold text-slate-900">{college?.name || "TPO Admin"}</h1>
          <div className="text-sm text-slate-500">Placement readiness — live, batch-wide, on-demand.</div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm inline-flex items-center gap-2 hover:border-slate-400">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Kpi icon={<UsersIcon className="w-4 h-4 text-indigo-600" />} label="Total students" value={`${students.length}`} />
          <Kpi icon={<Activity className="w-4 h-4 text-emerald-600" />} label="Average DevScore" value={`${stats.avg}`} sub="/ 1000" />
          <Kpi icon={<GraduationCap className="w-4 h-4 text-sky-600" />} label="Placement-ready" value={`${stats.placement}`} sub={`(${Math.round(stats.placement / students.length * 100)}%)`} />
          <Kpi icon={<ShieldAlert className="w-4 h-4 text-rose-600" />} label="At-risk students" value={`${stats.atRisk}`} sub="below grade C" />
        </div>
      )}

      {/* Grade distribution */}
      {stats && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
          <div className="text-sm font-semibold mb-3 text-slate-900">Grade distribution</div>
          <div className="space-y-2">
            {(["A+", "A", "B", "C", "D"] as const).map((g) => {
              const m = gradeMeta(g);
              const n = stats.gradeDist[g] || 0;
              const pct = (n / students.length) * 100;
              return (
                <div key={g} className="flex items-center gap-3">
                  <span className={`text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded w-12 text-center ${m.bg} ${m.color}`}>{g}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${m.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm tabular-nums text-slate-700 w-12 text-right">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-6"><DemoDataPanel /></div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        <Tab active={tab === "students"} onClick={() => setTab("students")}>Students ({students.length})</Tab>
        <Tab active={tab === "audit"} onClick={() => setTab("audit")}>System Audit ({audit.length})</Tab>
      </div>

      {tab === "students" && (
        <>
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..."
              className="w-full max-w-md bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3 hidden md:table-cell">Location</th>
                  <th className="text-right p-3">LinkedIn</th>
                  <th className="text-right p-3">Code</th>
                  <th className="text-right p-3">DSA</th>
                  <th className="text-center p-3">Grade</th>
                  <th className="text-right p-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const m = gradeMeta(s.report.grade);
                  return (
                    <tr key={s.user.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="p-3">
                        <Link to={`/u/${s.user.id}`} className="flex items-center gap-2.5 hover:text-indigo-700">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-xs font-bold">{s.user.name[0]}</div>
                          <div>
                            <div className="font-medium text-slate-900">{s.user.name}</div>
                            <div className="text-xs text-slate-500">{s.user.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="p-3 hidden md:table-cell text-slate-600 text-xs">{s.profile.location || "—"}</td>
                      {s.report.pillars.map((p) => (
                        <td key={p.key} className="p-3 text-right text-slate-700 tabular-nums text-xs">{Math.round(p.score)}</td>
                      ))}
                      <td className="p-3 text-center">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${m.bg} ${m.color}`}>{s.report.grade}</span>
                      </td>
                      <td className="p-3 text-right font-bold tabular-nums text-slate-900">{s.report.total}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">No students yet — invite them to register with college email <code>{college?.id ? `?college=${college.id}` : ""}</code></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "audit" && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Database className="w-3.5 h-3.5" /> System Audit Log <span className="text-slate-400">— security & compliance trail</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-white text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left p-3">When</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Resource</th>
                <th className="text-left p-3">User</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="p-3 text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="p-3"><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{a.action}</code></td>
                  <td className="p-3 text-xs text-slate-600">{a.resource || "—"}</td>
                  <td className="p-3 text-xs text-slate-500 font-mono">{a.userId?.slice(0, 12) || "system"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center gap-2">
            <Server className="w-3.5 h-3.5" />
            <span>Storage backend:</span>
            <code className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${activeBackend() === "supabase" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>
              {activeBackend()}
            </code>
            <span className="text-slate-400">— set <code className="bg-slate-100 px-1 rounded">VITE_BACKEND=supabase</code> to swap</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500 inline-flex items-center gap-1.5">{icon}{label}</div>
      <div className="mt-1 font-bold text-slate-900 tabular-nums text-2xl">{value} <span className="text-sm font-normal text-slate-400">{sub}</span></div>
    </div>
  );
}
function Tab({ active, onClick, children }: any) {
  return (
    <button onClick={onClick}
      className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${active ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{children}</button>
  );
}
