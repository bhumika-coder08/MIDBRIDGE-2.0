import React, { useState, useEffect } from 'react';
import { Building2, GraduationCap, FileCheck, CheckCircle2, ArrowRight, ExternalLink, Lock } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { api } from '../services/api.js';

interface ApplicationItem {
  id: string;
  share_token: string;
  recipient_name: string;
  applicant_email: string;
  applicant_name?: string;
  nationality?: string;
  destination_country?: string;
  intended_course?: string;
  document_count: number;
  created_at: string;
}

export const InstitutionPortalPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ packages: ApplicationItem[] }>('/institution/applications')
      .then(res => setApplications(res.packages || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-purple-400">
            University & Institutional Admissions Directorate
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
            Institutional Admissions Desk
          </h1>
          <p className="text-xs sm:text-sm text-white/60">
            Inspect applicant-disclosed academic credentials and identity records via selective disclosure packages.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Inbound Selective Disclosure Applications ({applications.length})
            </h3>
            <span className="text-xs text-white/50">Zero-Knowledge Protected</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-white/50">Loading application records...</div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-xs text-white/50 space-y-2">
              <Building2 className="h-8 w-8 text-white/30 mx-auto" />
              <p>No selective disclosure packages currently directed to your admissions office.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {app.applicant_name || app.applicant_email}
                      </span>
                      <span className="text-xs font-mono text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded-full">
                        {app.intended_course || 'Higher Education'}
                      </span>
                    </div>
                    <div className="text-xs text-white/60">
                      Destination: <span className="text-white">{app.destination_country || 'Europe'}</span> • Origin: <span className="text-white">{app.nationality || 'International'}</span>
                    </div>
                    <div className="text-[11px] text-white/40 font-mono">
                      Target Entity: {app.recipient_name} • {app.document_count} Authorized Document{app.document_count === 1 ? '' : 's'}
                    </div>
                  </div>

                  <a
                    href={`/verify/${app.share_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto shadow-lg"
                  >
                    <span>Inspect Credentials</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
