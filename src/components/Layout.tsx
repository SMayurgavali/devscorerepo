import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Search, LayoutDashboard, User as UserIcon, Building2 } from "lucide-react";
import { currentUser, logout } from "../lib/auth";
import { cn } from "../utils/cn";
import NotificationsBell from "./NotificationsBell";

export default function Layout() {
  const user = currentUser();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 grid place-items-center text-white font-extrabold text-lg shadow-sm">D</div>
            <div className="leading-tight">
              <div className="font-bold text-slate-900">DevScore</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">ATS Grader for Devs</div>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {user?.role === "student" && (
              <NavItem to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>My Score</NavItem>
            )}
            {user?.role === "recruiter" && (
              <NavItem to="/recruiter" icon={<Search className="w-4 h-4" />}>Find Talent</NavItem>
            )}
            {user?.role === "tpo" && (
              <NavItem to="/admin" icon={<Building2 className="w-4 h-4" />}>TPO Admin</NavItem>
            )}

            {user ? (
              <div className="flex items-center gap-1 ml-2 pl-3 border-l border-slate-200">
                <NotificationsBell userId={user.id} />
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-xs font-bold ml-1">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <button onClick={() => { logout(); nav("/"); }} className="text-slate-400 hover:text-slate-700 p-2" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/auth" className="ml-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
                Get my score
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="border-t border-slate-200 mt-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-slate-500 flex flex-col sm:flex-row gap-2 justify-between">
          <div>© 2026 DevScore · Verifiable proof of work for the modern hiring stack.</div>
          <div>Built for students · recruiters · placement cells</div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition",
        isActive ? "text-indigo-700 bg-indigo-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
      )}
    >
      {icon}<span className="hidden sm:inline">{children}</span>
    </NavLink>
  );
}

export function ProtectedRoute({ role, children }: { role?: "student" | "recruiter" | "tpo" | "admin"; children: React.ReactNode }) {
  const u = currentUser();
  if (!u) { window.location.href = "/auth"; return null; }
  if (role && u.role !== role) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 rounded-2xl bg-white border border-slate-200 text-center">
        <UserIcon className="w-10 h-10 mx-auto text-slate-400 mb-3" />
        <h2 className="text-xl font-bold mb-2">This area is for {role}s</h2>
        <p className="text-slate-500 text-sm">You're signed in as a {u.role}.</p>
      </div>
    );
  }
  return <>{children}</>;
}
