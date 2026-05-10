import { gradeMeta, type Grade } from "../lib/score";

export default function ScoreRing({
  score, grade, size = 180, max = 1000,
}: { score: number; grade: Grade; size?: number; max?: number }) {
  const radius = (size - 16) / 2;
  const c = 2 * Math.PI * radius;
  const pct = Math.min(1, score / max);
  const dash = c * pct;
  const m = gradeMeta(grade);
  const stroke = grade === "A+" ? "#10b981" : grade === "A" ? "#6366f1" : grade === "B" ? "#0ea5e9" : grade === "C" ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth="10" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} stroke={stroke} strokeWidth="10" fill="none"
          strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 800ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-4xl font-bold tabular-nums text-slate-900">{score}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400">/ {max}</div>
          <div className={`mt-1 text-xs font-bold ${m.color}`}>Grade {grade} · {m.label}</div>
        </div>
      </div>
    </div>
  );
}
