import React, { useState, useEffect } from 'react';
import { Sliders, Users, Globe, Shield, Activity, FileText, CheckCircle2, Plus, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { api } from '../services/api.js';

interface AdminMetrics {
  totalUsers: number;
  totalJourneys: number;
  totalDocuments: number;
  totalVerifications: number;
  averageReadiness: number;
  roles: Array<{ role: string; count: string }>;
}

export const AdminPortalPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'requirements' | 'audit'>('metrics');

  // New requirement policy form
  const [destination, setDestination] = useState('DE');
  const [purpose, setPurpose] = useState('Study');
  const [category, setCategory] = useState('Academic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mandatory, setMandatory] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ metrics: AdminMetrics; recentAuditLogs: any[] }>('/admin/metrics')
      .then(res => {
        setMetrics(res.metrics);
        setAuditLogs(res.recentAuditLogs || []);
      })
      .catch(err => console.error(err));

    api.get<{ users: any[] }>('/admin/users')
      .then(res => setUsers(res.users || []))
      .catch(err => console.error(err));
  }, []);

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      await api.post('/admin/requirements', {
        destination,
        purpose,
        category,
        title,
        description,
        mandatory,
      });
      setFeedback(`Requirement '${title}' added to ${destination} ${purpose} registry.`);
      setTitle('');
      setDescription('');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to add requirement policy.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            Platform Infrastructure & RBAC
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">MidBridge 2.0 Control (Admin)</h1>
          <p className="text-xs sm:text-sm text-white/60">
            System metrics, user directory, consular requirement policies, and immutable security audit logs.
          </p>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          {[
            { id: 'metrics', label: 'Analytics' },
            { id: 'users', label: `Users (${users.length})` },
            { id: 'requirements', label: 'Requirement Registry' },
            { id: 'audit', label: 'Audit Logs' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeTab === t.id
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Metrics */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-1">
                <div className="text-[10px] font-mono uppercase text-white/50">Total Accounts</div>
                <div className="text-3xl font-bold text-white font-silkscreen">{metrics.totalUsers}</div>
                <div className="text-xs text-white/50">Across all RBAC roles</div>
              </div>

              <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-1">
                <div className="text-[10px] font-mono uppercase text-white/50">Active Journeys</div>
                <div className="text-3xl font-bold text-blue-400 font-silkscreen">{metrics.totalJourneys}</div>
                <div className="text-xs text-white/50">Live cross-border routes</div>
              </div>

              <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-1">
                <div className="text-[10px] font-mono uppercase text-white/50">Hashed Documents</div>
                <div className="text-3xl font-bold text-purple-400 font-silkscreen">{metrics.totalDocuments}</div>
                <div className="text-xs text-white/50">SHA-256 protected files</div>
              </div>

              <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-1">
                <div className="text-[10px] font-mono uppercase text-white/50">Avg Readiness Score</div>
                <div className="text-3xl font-bold text-emerald-400 font-silkscreen">{metrics.averageReadiness}%</div>
                <div className="text-xs text-white/50">Platform-wide average</div>
              </div>
            </div>

            {/* Role distribution */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Role Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {metrics.roles.map(r => (
                  <div key={r.role} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                    <div className="text-xs font-mono text-white/50">{r.role}</div>
                    <div className="text-xl font-bold text-white mt-1 font-silkscreen">{r.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users */}
        {activeTab === 'users' && (
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white">Registered Users & Role Assignments</h3>
            <div className="space-y-2">
              {users.map(u => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">{u.full_name || u.email}</span>
                    <span className="text-white/50 ml-2 font-mono">{u.email}</span>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      {u.nationality ? `${u.nationality} → ${u.destination_country} (${u.purpose})` : 'Profile pending'}
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-mono text-[10px] uppercase font-bold self-start sm:self-auto">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Requirement Policy Manager */}
        {activeTab === 'requirements' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Add Country Requirement Policy</h3>
              <p className="text-xs text-white/60">
                Define mandatory or optional checklist criteria automatically dispatched to new journeys.
              </p>
            </div>

            <form onSubmit={handleAddRequirement} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/70 mb-1 font-medium">Destination Code</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1 font-medium">Purpose</label>
                  <select
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Study">Study</option>
                    <option value="Work">Work</option>
                    <option value="Immigration">Immigration</option>
                    <option value="Research">Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Identity">Identity</option>
                    <option value="Academic">Academic</option>
                    <option value="Immigration">Immigration</option>
                    <option value="Financial">Financial</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Arrival">Arrival</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/70 mb-1 font-medium">Requirement Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Biometric Residence Permit Card Application"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1 font-medium">Detailed Instructions</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Guidance for applicant..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mandatory}
                  onChange={e => setMandatory(e.target.checked)}
                  className="rounded bg-black border-white/20 text-emerald-400"
                />
                <span className="text-white">Mandatory Requirement (Affects Readiness Score)</span>
              </label>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-full btn-primary text-xs font-semibold text-white shadow-lg"
              >
                Publish Requirement Policy
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white">System Security Audit Trail</h3>
            <div className="space-y-2">
              {auditLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="space-y-0.5">
                    <span className="text-emerald-400 font-semibold">{log.action}</span>
                    <span className="text-white/40 ml-2">by [{log.actor_role}]</span>
                    <div className="text-[10px] text-white/50">{log.resource_type}: {log.resource_id || 'N/A'}</div>
                  </div>
                  <div className="text-white/40 text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
