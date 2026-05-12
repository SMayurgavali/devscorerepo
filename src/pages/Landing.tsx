import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, BadgeCheck, Briefcase, CheckCircle2, Code2, FileX,
  Search, ShieldCheck, Sparkles, Target, TrendingUp, Zap,
} from "lucide-react";

export default function Landing() {
  return (
    <div>
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 grid place-items-center text-white font-extrabold text-lg">D</div>
            <span className="font-bold text-xl tracking-tight text-slate-900">DevScore</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign in</Link>
            <Link to="/auth?mode=signup&role=student" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Get Started</Link>
          </div>
        </div>
      </header>

      {/* ───────────────── Option 1 — The Anti-Resume (Bold hero) ───────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-rose-50 via-white to-indigo-50" />
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold mb-5">
              <FileX className="w-3.5 h-3.5" /> The Anti-Resume Movement
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              Resumes are dead.<br />
              <span className="relative inline-block">
                <span className="text-slate-400 line-through decoration-rose-500 decoration-4">AI wrote them anyway.</span>
              </span>
            </h1>
            <p className="mt-5 text-slate-600 text-lg leading-relaxed max-w-xl">
              DevScore bypasses the fluff. We pull your <b>real-time data</b> from GitHub and LeetCode
              to give you a <b className="text-indigo-700">Verified Proof-of-Work Grade</b>.
              Don't just tell them you can code — <span className="underline decoration-indigo-400 decoration-2">prove it</span>.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/auth?mode=signup&role=student" className="px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 inline-flex items-center gap-2">
                Get my Verified Grade <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/auth?mode=signup&role=recruiter" className="px-6 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:border-slate-400">
                I hire developers
              </Link>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Free for students · Be the first user on your DevScore.
            </div>
          </div>

          {/* Resume vs DevScore comparison card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-5 relative">
              <div className="absolute -top-2 left-3 text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded uppercase tracking-wider">Old way</div>
              <FileX className="w-7 h-7 text-rose-400 mt-2" />
              <div className="mt-2 font-bold text-slate-900">Static PDF Resume</div>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                <li>✕ AI-generated fluff</li>
                <li>✕ Outdated within a week</li>
                <li>✕ Unverifiable claims</li>
                <li>✕ Hidden in 500 others</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-indigo-300 bg-white p-5 shadow-lg shadow-indigo-100 relative">
              <div className="absolute -top-2 left-3 text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">DevScore</div>
              <BadgeCheck className="w-7 h-7 text-indigo-600 mt-2" />
              <div className="mt-2 font-bold text-slate-900">Live Proof-of-Work</div>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                <li>✓ Pulled from real APIs</li>
                <li>✓ Refreshed every day</li>
                <li>✓ Un-fakeable signals</li>
                <li>✓ Ranked & searchable</li>
              </ul>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[10px] uppercase text-slate-400 tracking-wider">Live grade</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-emerald-600">A+</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-900 tabular-nums">920 / 1000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Option 2 — CIBIL Score for Devs (Trust band) ───────────────── */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold mb-4">
              <ShieldCheck className="w-3.5 h-3.5" /> The CIBIL Score for Developers
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              The Global Standard for <span className="text-indigo-300">Technical Trust</span>.
            </h2>
            <p className="mt-4 text-white/70 max-w-2xl mx-auto text-lg">
              One score. Three pillars. Zero doubt.<br className="hidden sm:inline" />
              DevScore combines your logic, your projects, and your professional footprint into a single, un-fakeable grade.
            </p>
          </div>

          {/* Three pillars */}
          <div className="grid md:grid-cols-3 gap-4">
            <Pillar tone="indigo" pts={200} icon={<Briefcase className="w-5 h-5" />} title="Branding"
              source="LinkedIn"
              checks={["Keyword-rich headline", "Strong About section", "Recommendations", "500+ connections"]} />
            <Pillar tone="emerald" pts={400} icon={<Code2 className="w-5 h-5" />} title="Proof of Work"
              source="GitHub / GitLab"
              checks={["Daily commit streak", "Open-source stars", "Repo quality & breadth", "Language diversity"]} />
            <Pillar tone="sky" pts={400} icon={<Target className="w-5 h-5" />} title="Logic"
              source="LeetCode · HackerRank · CodeChef"
              checks={["Problems solved", "Difficulty mix", "Acceptance rate", "Contest rating"]} />
          </div>

          {/* Grade scale */}
          <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="text-xs uppercase tracking-wider text-white/50 mb-3 text-center">The DevScore Scale (1000 pts total)</div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { g: "A+", min: "850+", c: "bg-emerald-500" },
                { g: "A",  min: "700+", c: "bg-indigo-500" },
                { g: "B",  min: "550+", c: "bg-sky-500" },
                { g: "C",  min: "350+", c: "bg-amber-500" },
                { g: "D",  min: "<350", c: "bg-rose-500" },
              ].map((x) => (
                <div key={x.g}>
                  <div className={`${x.c} text-white font-extrabold py-3 rounded-lg text-xl`}>{x.g}</div>
                  <div className="text-[11px] text-white/60 mt-1.5">{x.min}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Option 3 — Level Up (Outcome) ───────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Powered by AI
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Don't just see your Grade.<br />
              <span className="text-emerald-600">Fix it.</span>
            </h2>
            <p className="mt-4 text-slate-600 text-lg max-w-md">
              Most platforms tell you where you rank. <b>We tell you how to climb.</b>
              Get your DevScore and an AI-powered roadmap to move from Grade D to Grade A —
              with specific, ROI-ranked actions for every gap.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
              <Bullet>Personalised step-by-step plan, every week</Bullet>
              <Bullet>Each action shows estimated point-gain & time required</Bullet>
              <Bullet>Sorted by ROI — the easiest wins first</Bullet>
              <Bullet>Re-grades the moment you finish a task</Bullet>
            </ul>
            <div className="mt-7">
              <Link to="/auth?mode=signup&role=student" className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 inline-flex items-center gap-2">
                Generate my Roadmap — free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Roadmap mock */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50 border border-slate-200 shadow-xl shadow-indigo-100/40 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 grid place-items-center text-white"><Zap className="w-4 h-4" strokeWidth={2.5} /></div>
              <div>
                <div className="text-sm font-bold text-slate-900">Your Level-Up Roadmap</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Sample · Grade C → Grade A</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-extrabold text-sm">C</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-500 w-2/3" /></div>
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-sm">A</span>
            </div>
            <div className="space-y-2">
              <Mock step="1" title="Cross 100 LeetCode problems" tag="DSA" tagBg="bg-sky-50 text-sky-700" gain="+80" time="1 month" />
              <Mock step="2" title="Build a 14-day commit streak" tag="Code" tagBg="bg-emerald-50 text-emerald-700" gain="+60" time="1 week" />
              <Mock step="3" title="Request 2 LinkedIn recommendations" tag="LinkedIn" tagBg="bg-indigo-50 text-indigo-700" gain="+30" time="30 min" />
              <Mock step="4" title="Polish flagship repo for stars" tag="Code" tagBg="bg-emerald-50 text-emerald-700" gain="+50" time="1 week" />
            </div>
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
          <Audience icon={<TrendingUp />} title="For Students"
            body="Get a brutally honest grade. Get an exact roadmap. Watch your score climb every week." />
          <Audience icon={<Search />} title="For Recruiters"
            body="Search verified candidates by score, language, location. Skip resume screening — go straight to people whose code speaks for them." />
          <Audience icon={<BadgeCheck />} title="For Placement Cells"
            body="Track your entire batch's placement readiness in real time. Spot top performers and at-risk students months in advance." />
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Stop guessing. Start grading.
        </h2>
        <p className="mt-3 text-slate-500 max-w-xl mx-auto">
          Join the developers who let their work speak louder than their resume.
        </p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Link to="/auth?mode=signup&role=student" className="px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800">
            Get my DevScore
          </Link>
          <Link to="/leaderboard" className="px-6 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:border-slate-400 inline-flex items-center gap-2">
            See live leaderboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Activity className="w-3.5 h-3.5 text-emerald-500" /> Live, refreshed daily — no static PDFs.
        </div>
      </section>
    </div>
  );
}

function Pillar({ tone, pts, icon, title, source, checks }: any) {
  const tones: Record<string, string> = {
    indigo: "border-indigo-400/30 bg-indigo-500/10 text-indigo-200",
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    sky: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  };
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition">
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold border ${tones[tone]}`}>
        {icon}{source}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="text-2xl font-extrabold text-white/90 tabular-nums">{pts}<span className="text-sm text-white/40">/{pts === 200 ? "200" : "400"}</span></div>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-white/70">
        {checks.map((c: string) => (
          <li key={c} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />{c}</li>
        ))}
      </ul>
    </div>
  );
}

function Audience({ icon, title, body }: any) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center mb-3">{icon}</div>
      <h4 className="font-bold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{children}</li>;
}

function Mock({ step, title, tag, tagBg, gain, time }: any) {
  return (
    <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-slate-200">
      <div className="w-6 h-6 shrink-0 rounded bg-slate-100 text-slate-600 grid place-items-center text-xs font-bold">{step}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate">{title}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tagBg}`}>{tag}</span>
          <span className="text-[10px] text-slate-400">⏱ {time}</span>
        </div>
      </div>
      <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">{gain}</div>
    </div>
  );
}
