import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Globe,
  Compass,
  FolderLock,
  CheckCircle2,
  GraduationCap,
  Languages,
  Plane,
  Home,
  Share2,
  AlertTriangle,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  Building2,
  Sliders,
  Sparkles,
  Cpu,
  HeartPulse,
  Coins,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useJourney } from '../../context/JourneyContext.js';
import { useNotifications } from '../../context/NotificationContext.js';
import { GlobalAssistantModal } from '../assistant/GlobalAssistantModal.js';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { activeJourney, readiness } = useJourney();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [assistantOpen, setAssistantOpen] = useState<boolean>(false);

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: Compass },
    { label: 'Mobility Twin', path: '/mobility-twin', icon: Cpu },
    { label: 'Cost Planner', path: '/cost-planner', icon: Coins },
    { label: 'Journey Stages', path: '/journey/stages', icon: Globe },
    { label: 'Document Vault', path: '/vault', icon: FolderLock },
    { label: 'Health Vault', path: '/health-vault', icon: HeartPulse },
    { label: 'Verification', path: '/verification', icon: CheckCircle2 },
    { label: 'Opportunities', path: '/scholarships', icon: GraduationCap },
    { label: 'Translator', path: '/translator', icon: Languages },
    { label: 'Travel Prep', path: '/travel-prep', icon: Plane },
    { label: 'Arrival Mode', path: '/arrival', icon: Home },
    { label: 'Selective Share', path: '/share', icon: Share2 },
    { label: 'Emergency', path: '/emergency', icon: AlertTriangle },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Admin Control', path: '/admin', icon: Sliders });
  }
  if (user?.role === 'AUTHORITY' || user?.role === 'ADMIN') {
    navItems.push({ label: 'Authority Queue', path: '/authority', icon: ShieldCheck });
  }
  if (user?.role === 'UNIVERSITY' || user?.role === 'ADMIN') {
    navItems.push({ label: 'Admissions Desk', path: '/institution', icon: Building2 });
  }

  const score = readiness ? readiness.overallScore : (activeJourney?.readiness_score ?? 0);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-7 w-7 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                <Globe className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white lowercase">
                midbridge <span className="text-emerald-400 font-mono text-xs">2.0</span>
              </span>
            </Link>

            {/* Active Journey Pill */}
            {activeJourney ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                <span className="text-white/60">Route:</span>
                <span className="text-white font-medium">
                  {activeJourney.from_country} → {activeJourney.to_country}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/80 uppercase font-mono">
                  {activeJourney.purpose}
                </span>
              </div>
            ) : (
              <Link
                to="/journey/builder"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white/90 transition-colors"
              >
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Initialize First Journey</span>
              </Link>
            )}
          </div>

          {/* Right Header Cluster */}
          <div className="flex items-center gap-4">
            {/* Readiness Gauge */}
            {activeJourney && (
              <Link
                to="/journey/stages"
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title="View Readiness Breakdown"
              >
                <div className="h-2 w-14 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-xs font-silkscreen text-white font-bold tracking-wider">
                  {score}%
                </span>
              </Link>
            )}

            {/* Notifications Button */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center font-mono">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* User Profile & Role */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <Link
                to="/profile"
                className="flex items-center gap-2 text-xs text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center font-semibold text-xs">
                  {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="font-medium text-white truncate max-w-[120px]">{user?.fullName || 'User'}</div>
                  <div className="text-[10px] text-white/50 font-mono">{user?.role}</div>
                </div>
              </Link>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Module Scrollbar for seamless multi-module mobility */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white border border-white/20 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Floating Global AI Assistant Launcher (Part 51) */}
      <button
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-2.5 text-white transition-all transform hover:scale-105 group"
        title="Open MidBridge 2.0 AI Assistant"
      >
        <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-emerald-300 animate-pulse" />
        </div>
        <span className="text-xs font-semibold tracking-wide">Ask MidBridge</span>
      </button>

      {/* Assistant Modal Drawer */}
      <GlobalAssistantModal isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
};
