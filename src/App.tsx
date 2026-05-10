import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout, { ProtectedRoute } from "./components/Layout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Recruiter from "./pages/Recruiter";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Widget from "./pages/Widget";
import Admin from "./pages/Admin";
import { bootstrap } from "./server";

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { bootstrap().then(() => setReady(true)); }, []);
  if (!ready) return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-600 grid place-items-center text-white font-extrabold text-xl mb-3 animate-pulse">D</div>
        <div className="text-sm text-slate-500">Booting DevScore backend…</div>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/widget/:id" element={<Widget />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute role="student"><Dashboard /></ProtectedRoute>} />
          <Route path="/recruiter" element={<ProtectedRoute role="recruiter"><Recruiter /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="tpo"><Admin /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/u/:id" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
