import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { listNotifications, markAllNotificationsRead, markNotificationRead, unreadCount } from "../server/api";
import type { Notification } from "../server/schema";

export default function NotificationsBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function refresh() {
    setItems(await listNotifications(userId));
    setCount(await unreadCount(userId));
  }
  useEffect(() => { void refresh(); const t = setInterval(refresh, 15000); return () => clearInterval(t); }, [userId]);
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100">
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center">{count > 9 ? "9+" : count}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="font-semibold text-sm text-slate-900">Notifications</div>
            {count > 0 && (
              <button onClick={async () => { await markAllNotificationsRead(userId); refresh(); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <div className="p-6 text-sm text-slate-400 text-center">You're all caught up</div>}
            {items.map((n) => (
              <button key={n.id} onClick={async () => { await markNotificationRead(n.id); refresh(); }}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${!n.read ? "bg-indigo-50/40" : ""}`}>
                <div className="flex items-start gap-2">
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{n.body}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
