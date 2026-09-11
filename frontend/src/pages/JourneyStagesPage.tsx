import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Upload,
  ExternalLink,
  Shield,
  FileText,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { useJourney } from '../context/JourneyContext.js';
import { RequirementItem, JourneyStage } from '../types/index.js';

export const JourneyStagesPage: React.FC = () => {
  const { activeJourney, stages, requirements, readiness, updateStage, updateRequirementStatus } = useJourney();
  const navigate = useNavigate();
  const [selectedStageNum, setSelectedStageNum] = useState<number>(activeJourney?.current_stage_number || 1);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  if (!activeJourney) {
    return (
      <DashboardLayout>
        <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <Compass className="h-10 w-10 text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">No active journey detected</h2>
          <p className="text-xs text-white/60">
            Create your personalized cross-border journey to generate the 12-stage mobility timeline.
          </p>
          <Link to="/journey/builder" className="inline-block px-6 py-2.5 rounded-full btn-primary text-xs font-semibold text-white">
            Initialize Journey
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const selectedStage = stages.find(s => s.stage_number === selectedStageNum) || stages[0];

  // Requirements for the selected stage or all
  const stageReqs = requirements.filter(r => {
    const matchesStage = selectedStageNum === 0 || r.stage_number === selectedStageNum;
    const matchesCategory = filterCategory === 'ALL' || r.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesStage && matchesCategory;
  });

  const categories = ['ALL', 'Identity', 'Academic', 'Immigration', 'Financial', 'Insurance', 'Medical', 'Arrival'];

  const getStatusBadge = (status: RequirementItem['status']) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">OFFICIALLY VERIFIED</span>;
      case 'AI_ANALYZED':
        return <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">AI ANALYZED</span>;
      case 'VERIFICATION_PENDING':
        return <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">VERIFICATION PENDING</span>;
      case 'UPLOADED':
        return <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono">UPLOADED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/70 border border-white/15 text-[10px] font-mono">IN PROGRESS</span>;
      case 'NOT_UPLOADED':
      default:
        return <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 border border-white/5 text-[10px] font-mono">NOT UPLOADED</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              Personalized Mobility Timeline
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
              12 Stages: {activeJourney.from_country} → {activeJourney.to_country}
            </h1>
            <p className="text-xs sm:text-sm text-white/60">
              Purpose: <strong className="text-white">{activeJourney.purpose}</strong> • Overall Readiness:{' '}
              <strong className="text-emerald-400 font-silkscreen">{activeJourney.readiness_score}%</strong>
            </p>
          </div>

          <Link
            to="/vault"
            className="px-5 py-2.5 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-2 self-start sm:self-auto"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Go to Document Vault</span>
          </Link>
        </div>

        {/* 12-Stage Horizontal Progress Scroller (Part 12) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/50 font-mono">
            Journey Trajectory
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
            {stages.map(st => {
              const isSelected = selectedStageNum === st.stage_number;
              const isCompleted = st.status === 'COMPLETED';
              const isInProgress = st.status === 'IN_PROGRESS';

              return (
                <button
                  key={st.stage_number}
                  onClick={() => setSelectedStageNum(st.stage_number)}
                  className={`flex-shrink-0 text-left p-3.5 rounded-2xl border transition-all w-48 ${
                    isSelected
                      ? 'bg-white/15 border-white/35 shadow-lg'
                      : isCompleted
                      ? 'bg-emerald-950/20 border-emerald-800/30 hover:bg-emerald-950/30'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-white/40">
                      STAGE {st.stage_number.toString().padStart(2, '0')}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : isInProgress ? (
                      <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-white/20" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-white truncate">{st.stage_name}</div>
                  <div className="text-[10px] text-white/50 truncate mt-0.5 capitalize font-mono">
                    {st.status.replace('_', ' ').toLowerCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Stage Detail & Checklist Controls (Part 14) */}
        {selectedStage && (
          <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                  Active Stage Focus • Stage {selectedStage.stage_number} of 12
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedStage.stage_name}</h2>
                <p className="text-xs text-white/60 mt-1 max-w-xl">{selectedStage.description}</p>
              </div>

              {/* Stage Status Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateStage(selectedStage.stage_number, 'IN_PROGRESS')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedStage.status === 'IN_PROGRESS'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => updateStage(selectedStage.stage_number, 'COMPLETED')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedStage.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Mark Completed
                </button>
              </div>
            </div>

            {/* Smart Checklist for this Stage */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-white">
                  Stage Requirements Checklist ({stageReqs.length})
                </h3>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <Filter className="h-3.5 w-3.5 text-white/40 mr-1" />
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                        filterCategory === cat
                          ? 'bg-white text-black font-semibold'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {stageReqs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-white/50">
                  No specific document requirements bound directly to this stage. Review general travel & arrival guidelines.
                </div>
              ) : (
                <div className="space-y-3">
                  {stageReqs.map(req => (
                    <div
                      key={req.user_requirement_id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{req.title}</span>
                          {req.mandatory && (
                            <span className="text-[10px] font-mono text-red-300 bg-red-950/40 border border-red-800/40 px-1.5 py-0.5 rounded">
                              MANDATORY
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-white/50 uppercase px-1.5 py-0.5 rounded bg-white/5">
                            {req.category}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">{req.description}</p>
                        {req.source_url && (
                          <a
                            href={req.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline pt-0.5"
                          >
                            <span>Official Protocol Source</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {getStatusBadge(req.status)}
                        {req.status === 'NOT_UPLOADED' ? (
                          <Link
                            to={`/vault?requirementId=${req.requirement_id}&category=${req.category.toUpperCase()}`}
                            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-colors flex items-center gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            <span>Upload</span>
                          </Link>
                        ) : (
                          <Link
                            to="/vault"
                            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-colors"
                          >
                            Inspect in Vault
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
