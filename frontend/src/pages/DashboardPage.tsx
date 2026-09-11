import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  FolderLock,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Plus,
  Upload,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { ModuleCarousel3D } from '../components/3d/ModuleCarousel3D.js';
import { useJourney } from '../context/JourneyContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { ReminderItem } from '../types/index.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { activeJourney, stages, requirements, documents, readiness, loading } = useJourney();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  useEffect(() => {
    api.get<{ reminders: ReminderItem[] }>('/reminders')
      .then(res => setReminders(res.reminders || []))
      .catch(err => console.warn(err));
  }, []);

  const score = readiness ? readiness.overallScore : (activeJourney?.readiness_score ?? 0);
  const verifiedCount = documents.filter(d => ['VERIFIED', 'ISSUER_VERIFIED'].includes(d.verification_status)).length;
  const pendingCount = documents.filter(d => d.verification_status === 'VERIFICATION_PENDING').length;
  const mandatoryReqs = requirements.filter(r => r.mandatory);
  const uploadedCount = requirements.filter(r => r.mandatory && ['UPLOADED', 'AI_ANALYZED', 'VERIFIED'].includes(r.status)).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome & Active Journey Banner (Part 53) */}
        {activeJourney ? (
          <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Active Cross-Border Route</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                  <span>{activeJourney.from_country}</span>
                  <span className="text-white/40 font-light">→</span>
                  <span className="text-white">{activeJourney.to_country}</span>
                  <span className="text-xs font-mono font-normal uppercase px-2.5 py-1 rounded-full bg-white/10 text-white/90 border border-white/15">
                    {activeJourney.purpose}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-white/60 max-w-2xl">
                  {activeJourney.notes || 'MidBridge 2.0 journey initialized with customized requirements, document vault, and readiness pipeline.'}
                </p>
              </div>

              {/* Top Quick Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/vault"
                  className="px-4 py-2.5 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-2"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Document</span>
                </Link>
                <Link
                  to="/journey/builder"
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-white transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Journey</span>
                </Link>
              </div>
            </div>

            {/* PART 53: READINESS & STAGE STATS BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
              {/* Stat 1: Readiness Score (Using Silkscreen font) */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                  Readiness Level
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-white font-silkscreen tracking-wider">
                    {score}%
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">READY</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-700 rounded-full"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              {/* Stat 2: Current Stage */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                  Current Stage
                </div>
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  Stage {activeJourney.current_stage_number}: {activeJourney.current_stage_name}
                </div>
                <div className="text-[11px] text-white/50 truncate">
                  12 Total Mobility Stages
                </div>
              </div>

              {/* Stat 3: Mandatory Documents */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                  Mandatory Checklist
                </div>
                <div className="text-sm sm:text-base font-bold text-white">
                  {uploadedCount} / {mandatoryReqs.length} Satisfied
                </div>
                <div className="text-[11px] text-white/50">
                  {documents.length} Total Uploaded Files
                </div>
              </div>

              {/* Stat 4: Verification Status */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                  Official Verification
                </div>
                <div className="text-sm sm:text-base font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{verifiedCount} Verified</span>
                </div>
                <div className="text-[11px] text-amber-300">
                  {pendingCount > 0 ? `${pendingCount} Under Review` : 'No pending queue'}
                </div>
              </div>
            </div>

            {/* Next Recommended Action Banner */}
            {readiness?.nextRecommendedAction && (
              <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-white/90">
                  <Sparkles className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    <strong className="text-white">Next Priority:</strong> {readiness.nextRecommendedAction}
                  </span>
                </div>
                <Link
                  to="/journey/stages"
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold whitespace-nowrap"
                >
                  <span>Resolve in Checklist</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Empty Journey State (Part 47) */
          <div className="glass-panel rounded-3xl p-10 text-center max-w-xl mx-auto space-y-4">
            <Compass className="h-10 w-10 text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Create your first cross-border journey</h2>
            <p className="text-xs sm:text-sm text-white/60">
              Select where you are moving from, where you are going, and your purpose. MidBridge 2.0 will automatically generate your requirements roadmap, smart checklist, and readiness score.
            </p>
            <div className="pt-2">
              <Link
                to="/journey/builder"
                className="px-6 py-3 rounded-full btn-primary text-xs font-semibold text-white inline-flex items-center gap-2"
              >
                <span>Initialize Journey Roadmap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* PART 39: 3D SPATIAL MODULE CAROUSEL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="h-4 w-4 text-white/60" />
              <span>MidBridge 2.0 Spatial Modules</span>
            </h2>
            <span className="text-xs text-white/40 font-mono">Interactive 3D Hub</span>
          </div>

          <ModuleCarousel3D />
        </div>

        {/* Bottom Grid: Upcoming Reminders & Quick Readiness Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Reminders (Part 31) */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 font-mono flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span>Upcoming Mobility Milestones</span>
              </h3>
              <span className="text-xs text-white/40">{reminders.length} Active</span>
            </div>

            {reminders.length === 0 ? (
              <p className="text-xs text-white/40 py-6 text-center">
                No reminders scheduled. Add deadlines for blocked accounts, visas, or travel tickets.
              </p>
            ) : (
              <div className="space-y-2.5">
                {reminders.slice(0, 3).map(rem => (
                  <div
                    key={rem.id}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white">{rem.title}</div>
                      <div className="text-[10px] text-white/50">{rem.category}</div>
                    </div>
                    <div className="text-right font-mono text-white/70">
                      Due: {rem.due_date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Readiness Breakdown Penalties (Part 22) */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 font-mono flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Readiness Audit & Penalties</span>
              </h3>
              <span className="text-xs text-white/40 font-mono">
                {readiness?.penalties.length || 0} Factors
              </span>
            </div>

            {readiness?.penalties && readiness.penalties.length > 0 ? (
              <div className="space-y-2">
                {readiness.penalties.slice(0, 3).map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5"
                  >
                    <span className="font-mono text-amber-400 font-bold">•</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-center">
                All readiness criteria satisfied! Your cross-border departure profile is complete.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
