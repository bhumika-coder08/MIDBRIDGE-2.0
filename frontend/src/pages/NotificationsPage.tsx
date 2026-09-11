import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, CheckCircle2, Clock, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { useNotifications } from '../context/NotificationContext.js';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              In-App Notification Center
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Notifications</h1>
            <p className="text-xs sm:text-sm text-white/60">
              Live updates regarding your verification results, scholarship deadlines, and stage reminders.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="glass-panel rounded-3xl p-16 text-center text-xs text-white/50 space-y-2">
            <Bell className="h-8 w-8 text-white/40 mx-auto" />
            <h3 className="text-sm font-semibold text-white">You&apos;re all caught up.</h3>
            <p className="text-[11px] text-white/40">No pending notifications at this moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  n.is_read
                    ? 'bg-white/[0.02] border-white/5 text-white/70'
                    : 'bg-white/10 border-white/20 text-white shadow-lg'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{n.title}</span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded uppercase">
                      {n.category}
                    </span>
                    {!n.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{n.message}</p>
                  <div className="text-[10px] font-mono text-white/40 pt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>

                {n.link_url && (
                  <Link
                    to={n.link_url}
                    className="flex-shrink-0 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
