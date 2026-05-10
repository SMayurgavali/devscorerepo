import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, signup } from "../lib/auth";
import { Loader2, Sparkles } from "lucide-react";
import DemoDataPanel from "../components/DemoDataPanel";

export default function Auth() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">((params.get("mode") as any) || "login");
  const [role, setRole] = useState<"student" | "recruiter">((params.get("role") as any) || "student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const u = mode === "login"
        ? await login(email, password)
        : await signup({ email, password, name, role });
      nav(u.role === "student" ? "/dashboard" : "/recruiter");
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally { setBusy(false); }
  }

  function fillDemo(kind: "student" | "recruiter" | "tpo") {
    setMode("login");
    if (kind === "recruiter") setEmail("recruiter@demo.devscore.app");
    else if (kind === "tpo") setEmail("tpo@demo.devscore.app");
    else setEmail("priya@demo.devscore.app");
    setPassword("demo1234");
  }
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-6">
        <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-600 grid place-items-center text-white font-extrabold text-xl mb-3">D</div>
        <h1 className="text-2xl font-bold text-slate-900">{mode === "login" ? "Welcome back" : "Create your DevScore"}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {mode === "signup" ? "Be the first user on your DevScore. It's free." : "Sign in to view your live score"}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-5 text-sm">
          <button onClick={() => setMode("login")} className={`py-2 rounded-md font-medium ${mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Sign in</button>
          <button onClick={() => setMode("signup")} className={`py-2 rounded-md font-medium ${mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Sign up</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600">I am a</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(["student", "recruiter"] as const).map((r) => (
                    <button type="button" key={r} onClick={() => setRole(r)}
                      className={`py-2.5 rounded-lg border text-sm capitalize font-medium ${role === r ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                    >{r}</button>
                  ))}
                </div>
              </div>
              <Field label="Full name" value={name} onChange={setName} placeholder="Priya Sharma" />
            </>
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@university.edu" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />

          {err && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{err}</div>}

          <button disabled={busy} className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-slate-200">
          <button onClick={() => setShowDemo((s) => !s)} className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {showDemo ? "Hide demo options" : "Just exploring? Show demo options"}
          </button>
          {showDemo && (
            <div className="mt-3 space-y-3">
              <DemoDataPanel />
              <div className="text-[11px] text-slate-500">After loading demo data, sign in as:</div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => fillDemo("student")} className="py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-xs text-slate-700">Student</button>
                <button onClick={() => fillDemo("recruiter")} className="py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-xs text-slate-700">Recruiter</button>
                <button onClick={() => fillDemo("tpo")} className="py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-xs text-slate-700">TPO</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder}
        className="mt-1 w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}
