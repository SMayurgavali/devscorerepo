import { useMemo } from "react";
import { ArrowRight, Briefcase, Clock, Code2, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { buildRoadmap, type RoadmapStep } from "../lib/roadmap";
import { gradeMeta, type ScoreReport } from "../lib/score";

export default function Roadmap({ report }: { report: ScoreReport }) {
  const plan = useMemo(() => buildRoadmap(report), [report]);
  const m = gradeMeta(report.grade);
  const nextM = plan.nextGrade ? gradeMeta(plan.nextGrade) : null;
  const totalPossibleGain = plan.steps.reduce((a, s) => a + s.pointGain, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 shadow-sm overflow-hidden">
      {/* header */}
      <div className="px-5 py-4 bg-white/60 border-b border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 grid place-items-center text-white">
          <Sparkles className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            Your Level-Up Roadmap
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">AI</span>
          </div>
          <div className="text-xs text-slate-500">
            Don't just see your grade. <span className="text-slate-700 font-medium">Fix it.</span>
          </div>
        </div>
      </div>

      {/* path */}
      <div className="px-5 py-5">
        {plan.nextGrade ? (
          <div className="flex items-center gap-3 mb-5">
            <div className={`px-4 py-2 rounded-xl ${m.bg} ${m.color} font-extrabold text-lg`}>{report.grade}</div>
            <div className="flex-1">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${Math.min(100, (totalPossibleGain / Math.max(plan.pointsToNext, 1)) * 100)}%` }} />
              </div>
              <div className="text-xs text-slate-600 mt-1.5 text-center">
                <b className="text-indigo-700">+{plan.pointsToNext} points</b> to reach Grade {plan.nextGrade}
                <span className="text-slate-400"> · this plan unlocks ~{totalPossibleGain} pts</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl ${nextM!.bg} ${nextM!.color} font-extrabold text-lg`}>{plan.nextGrade}</div>
          </div>
        ) : (
          <div className="text-center py-3 mb-3">
            <div className={`inline-block px-4 py-2 rounded-xl ${m.bg} ${m.color} font-extrabold`}>You're at Grade {report.grade} 🏆</div>
            <p className="text-xs text-slate-500 mt-2">You're at the top tier. Keep your streak alive to stay there.</p>
          </div>
        )}

        {/* steps */}
        {plan.steps.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-6">No actions needed — your profile is dialed in. 🎯</div>
        ) : (
          <ol className="space-y-2.5">
            {plan.steps.map((s, i) => <Step key={s.id} step={s} index={i + 1} />)}
          </ol>
        )}
      </div>
    </div>
  );
}

function Step({ step, index }: { step: RoadmapStep; index: number }) {
  const cfg = pillarCfg(step.pillar);
  return (
    <li className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition">
      <div className={`w-7 h-7 shrink-0 rounded-lg ${cfg.bg} ${cfg.text} grid place-items-center text-xs font-bold`}>{index}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-slate-900 text-sm">{step.title}</div>
          <div className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">+{step.pointGain} pts</div>
        </div>
        <div className="text-xs text-slate-600 mt-1">{step.detail}</div>
        <div className="mt-2 flex items-center gap-3 text-[11px]">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} font-medium`}>
            {cfg.icon} {cfg.label}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" />{step.effort}</span>
          {step.cta && (
            <a href={step.cta.href} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
              {step.cta.label} <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

function pillarCfg(p: RoadmapStep["pillar"]) {
  if (p === "linkedin") return { bg: "bg-indigo-50", text: "text-indigo-700", label: "LinkedIn", icon: <Briefcase className="w-3 h-3" /> };
  if (p === "code") return { bg: "bg-emerald-50", text: "text-emerald-700", label: "Code", icon: <Code2 className="w-3 h-3" /> };
  return { bg: "bg-sky-50", text: "text-sky-700", label: "DSA", icon: <Target className="w-3 h-3" /> };
}

export function RoadmapTeaser() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white grid place-items-center"><Zap className="w-6 h-6" /></div>
      <div className="flex-1">
        <div className="font-bold text-slate-900 flex items-center gap-2">Level-Up Roadmap <span className="text-[10px] uppercase tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">AI</span></div>
        <div className="text-xs text-slate-500">Click "Sync now" — we'll generate your personalized path to the next grade.</div>
      </div>
      <TrendingUp className="w-5 h-5 text-slate-300" />
    </div>
  );
}
