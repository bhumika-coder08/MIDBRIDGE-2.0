import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  HeartPulse,
  Coins,
  FileText,
  Plane,
  Home,
  RefreshCw,
  SlidersHorizontal,
  X,
  Compass,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { api } from '../services/api.js';

interface TwinData {
  journeyId: string;
  origin: string;
  destination: string;
  purpose: string;
  currentStageNumber: number;
  currentStageName: string;
  overallReadiness: number;
  components: {
    docReadiness: number;
    docCount: number;
    mandatoryCount: number;
    satisfiedCount: number;
    healthReadiness: number;
    healthDocCount: number;
    financialReadiness: number;
    yearOneCost: number;
    confirmedFunding: number;
    visaReadiness: number;
    travelReadiness: number;
    arrivalReadiness: number;
  };
  currentBlocker: string;
  recommendedAction: string;
  stageNodes: Array<{
    id: string;
    label: string;
    sub: string;
    status: 'COMPLETED' | 'ACTIVE' | 'BLOCKED' | 'PENDING';
  }>;
}

export const MobilityTwinPage: React.FC = () => {
  const [twin, setTwin] = useState<TwinData | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulation modal
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simDest, setSimDest] = useState('Japan');
  const [simPurpose, setSimPurpose] = useState('Study');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [applying, setApplying] = useState(false);

  const fetchTwin = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ hasJourney: boolean; twin?: TwinData }>('/mobility-twin');
      if (res.hasJourney && res.twin) {
        setTwin(res.twin);
      }
    } catch (err: any) {
      console.error('Failed to load mobility twin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const res = await api.post('/mobility-twin/simulate', {
        simulatedDestination: simDest,
        simulatedPurpose: simPurpose,
      });
      setSimResult(res.comparison);
    } catch (err: any) {
      alert(err.message || 'Simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const handleApplyScenario = async () => {
    if (!window.confirm(`Apply this scenario? Your active roadmap will switch to ${simDest} (${simPurpose}).`)) return;
    setApplying(true);
    try {
      await api.post('/mobility-twin/apply', {
        destination: simDest,
        purpose: simPurpose,
      });
      setSimModalOpen(false);
      setSimResult(null);
      await fetchTwin();
      alert(`Roadmap updated! Your active journey is now ${simDest} (${simPurpose}).`);
    } catch (err: any) {
      alert(err.message || 'Failed to apply scenario.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 uppercase tracking-wider mb-2">
              <Cpu className="h-3 w-3" />
              <span>Live Synthesis • Real Stored State</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>MidBridge 2.0 Mobility Twin</span>
              <Sparkles className="h-6 w-6 text-cyan-400" />
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-3xl">
              Live computational model of your international mobility trajectory. Continuously monitors requirement satisfaction, health records, solvency coverage, and consular readiness without fabricated figures.
            </p>
          </div>

          <button
            onClick={() => setSimModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-semibold text-white shadow-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Scenario Simulator</span>
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-white/40">Synthesizing Mobility Twin state...</div>
        ) : !twin ? (
          <div className="glass-card rounded-2xl p-12 text-center space-y-3 border border-white/10">
            <Compass className="h-10 w-10 text-white/20 mx-auto" />
            <h3 className="text-base font-semibold text-white">No active journey initialized</h3>
            <p className="text-xs text-white/50 max-w-md mx-auto">
              Choose your origin, destination, and travel purpose in Journey Builder to activate your Mobility Twin.
            </p>
          </div>
        ) : (
          <>
            {/* Primary Twin Hero Card */}
            <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/15 relative overflow-hidden space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-cyan-400 tracking-wider">
                    Trajectory Node: {twin.origin} → {twin.destination}
                  </span>
                  <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <span>{twin.origin}</span>
                    <ArrowRight className="h-6 w-6 text-white/40" />
                    <span className="text-cyan-400">{twin.destination}</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 font-normal">
                      {twin.purpose}
                    </span>
                  </h2>
                  <p className="text-xs text-white/60">
                    Current Stage: <strong>Stage {twin.currentStageNumber} — {twin.currentStageName}</strong>
                  </p>
                </div>

                {/* Overall Score Dial */}
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div>
                    <div className="text-[11px] font-mono text-white/50 uppercase">Overall Readiness</div>
                    <div className="text-4xl font-mono font-bold text-cyan-400">{twin.overallReadiness}%</div>
                  </div>
                  <div className="h-12 w-px bg-white/10" />
                  <div className="space-y-1 text-xs text-white/70">
                    <div>Docs: <strong className="text-white">{twin.components.satisfiedCount}/{twin.components.mandatoryCount}</strong></div>
                    <div>Health: <strong className="text-white">{twin.components.healthReadiness}%</strong></div>
                    <div>Solvency: <strong className="text-white">{twin.components.financialReadiness}%</strong></div>
                  </div>
                </div>
              </div>

              {/* Blocker & Recommended Next Action Banners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider block text-amber-400">Current Blocker</span>
                    <span className="text-xs font-medium">{twin.currentBlocker}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-cyan-400 mt-0.5" />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider block text-cyan-400">Recommended Next Action</span>
                    <span className="text-xs font-medium">{twin.recommendedAction}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 Real Component Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { title: 'Documents', score: twin.components.docReadiness, detail: `${twin.components.satisfiedCount}/${twin.components.mandatoryCount} ready`, icon: FileText, color: 'text-emerald-400' },
                { title: 'Health Vault', score: twin.components.healthReadiness, detail: `${twin.components.healthDocCount} records stored`, icon: HeartPulse, color: 'text-rose-400' },
                { title: 'Financial Proof', score: twin.components.financialReadiness, detail: `€${twin.components.confirmedFunding.toLocaleString()} confirmed`, icon: Coins, color: 'text-amber-400' },
                { title: 'Visa Readiness', score: twin.components.visaReadiness, detail: `Stage ${twin.currentStageNumber}/12`, icon: Shield, color: 'text-blue-400' },
                { title: 'Travel Protocol', score: twin.components.travelReadiness, detail: 'Pre-flight check', icon: Plane, color: 'text-purple-400' },
                { title: 'Arrival Mode', score: twin.components.arrivalReadiness, detail: 'Municipal registry', icon: Home, color: 'text-cyan-400' },
              ].map((c, idx) => {
                const Icon = c.icon;
                return (
                  <div key={idx} className="glass-card rounded-2xl p-4 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/50 uppercase">{c.title}</span>
                      <Icon className={`h-4 w-4 ${c.color}`} />
                    </div>
                    <div className="text-2xl font-mono font-bold text-white">{c.score}%</div>
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <div className="bg-white/80 h-full rounded-full" style={{ width: `${c.score}%` }} />
                    </div>
                    <p className="text-[10px] text-white/50 truncate">{c.detail}</p>
                  </div>
                );
              })}
            </div>

            {/* Visual 3D Journey Pipeline (Section 15) */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase text-white/50 tracking-wider">
                Trajectory Pipeline Nodes
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
                {twin.stageNodes.map((node, i) => (
                  <div
                    key={node.id}
                    className={`glass-card rounded-xl p-3 border transition-all ${
                      node.status === 'COMPLETED'
                        ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                        : node.status === 'ACTIVE'
                        ? 'border-cyan-500/50 bg-cyan-500/[0.06] shadow-lg'
                        : node.status === 'BLOCKED'
                        ? 'border-amber-500/40 bg-amber-500/[0.04]'
                        : 'border-white/5 bg-white/[0.02] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-white/40">0{i + 1}</span>
                      <span
                        className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                          node.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : node.status === 'ACTIVE'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : node.status === 'BLOCKED'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {node.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{node.label}</div>
                    <div className="text-[10px] text-white/50 truncate mt-0.5">{node.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Mobility Simulator Modal (Section 16) */}
        {simModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl p-6 border border-white/15 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-cyan-400" />
                  <span>Mobility Twin Scenario Simulator</span>
                </h3>
                <button onClick={() => setSimModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-white/60">
                Ask <em>"What changes if I choose Japan instead of Germany?"</em> or <em>"What if my purpose changes from Study to Work?"</em>. Simulating tests requirement differences and cost impacts without altering your active roadmap.
              </p>

              <form onSubmit={handleSimulate} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-white/70 mb-1">Simulated Destination</label>
                  <select
                    value={simDest}
                    onChange={e => setSimDest(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Japan">Japan (JP)</option>
                    <option value="United States">United States (US)</option>
                    <option value="United Kingdom">United Kingdom (GB)</option>
                    <option value="Canada">Canada (CA)</option>
                    <option value="Australia">Australia (AU)</option>
                    <option value="France">France (FR)</option>
                    <option value="Switzerland">Switzerland (CH)</option>
                    <option value="Singapore">Singapore (SG)</option>
                    <option value="Germany">Germany (DE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Simulated Purpose</label>
                  <select
                    value={simPurpose}
                    onChange={e => setSimPurpose(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Study">Study (Higher Education)</option>
                    <option value="Work">Work (Employment Permit)</option>
                    <option value="Research">Research (Academic Fellowship)</option>
                    <option value="Immigration">Immigration (Permanent Relocation)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={simulating}
                    className="px-5 py-2 rounded-xl btn-primary text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
                  >
                    {simulating ? 'Computing Diff Matrix...' : 'Run Simulation'}
                  </button>
                </div>
              </form>

              {/* Simulation Results Table */}
              {simResult && (
                <div className="space-y-4 pt-4 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] font-mono text-white/40 uppercase">Simulation</span>
                      <div className="text-base font-bold text-white">
                        {simResult.current.destination} → {simResult.simulated.destination} ({simResult.simulated.purpose})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Simulated Readiness</span>
                      <div className="text-lg font-mono font-bold text-cyan-400">
                        {simResult.simulated.simulatedReadiness}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Visa Processing Time</span>
                      <div className="text-white font-medium">~{simResult.simulated.visaProcessingWeeks} Weeks</div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Est. Solvency Proof</span>
                      <div className="text-white font-medium">
                        {simResult.simulated.currency} {simResult.simulated.estimatedLivingProof.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-mono uppercase text-white/50">Requirements Comparison</div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 max-h-40 overflow-y-auto">
                      {simResult.simulated.missingRequirements.map((r: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-amber-300 truncate max-w-[280px]">⚠️ {r.title}</span>
                          <span className="text-[10px] text-white/40">{r.category}</span>
                        </div>
                      ))}
                      {simResult.simulated.matchedRequirements.map((r: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-emerald-300 truncate max-w-[280px]">✅ {r.title}</span>
                          <span className="text-[10px] text-white/40">Already Satisfied</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                    <span className="text-cyan-200">Like this scenario? You can apply it to replace your active roadmap.</span>
                    <button
                      onClick={handleApplyScenario}
                      disabled={applying}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs cursor-pointer disabled:opacity-50"
                    >
                      {applying ? 'Applying...' : 'APPLY THIS SCENARIO'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
