import React, { useState } from 'react';
import { ShieldCheck, Shield, Clock, AlertCircle, FileCheck, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { useJourney } from '../context/JourneyContext.js';
import { api } from '../services/api.js';

export const VerificationPage: React.FC = () => {
  const { documents, refreshJourney } = useJourney();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRequestVerification = async (docId: string) => {
    setSubmittingId(docId);
    try {
      await api.post('/verification/request', { documentId: docId });
      setFeedback('Verification request successfully lodged with competent authorities.');
      await refreshJourney();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit verification request.');
    } finally {
      setSubmittingId(null);
    }
  };

  const verifiedDocs = documents.filter(d => ['VERIFIED', 'ISSUER_VERIFIED'].includes(d.verification_status));
  const pendingDocs = documents.filter(d => d.verification_status === 'VERIFICATION_PENDING');
  const analyzedDocs = documents.filter(d => d.verification_status === 'AI_ANALYZED');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            Consular & Institutional Credential Verification
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Verification Center</h1>
          <p className="text-xs sm:text-sm text-white/60">
            Track certified authenticity, digital signatures, and consular reviews for your mobility records.
          </p>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Verification Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-1">
            <div className="text-[10px] font-mono text-white/50 uppercase">Officially Certified</div>
            <div className="text-3xl font-bold text-emerald-400 font-silkscreen">{verifiedDocs.length}</div>
            <p className="text-xs text-white/60">Government or issuer authenticated</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-1">
            <div className="text-[10px] font-mono text-white/50 uppercase">Verification Pending</div>
            <div className="text-3xl font-bold text-amber-300 font-silkscreen">{pendingDocs.length}</div>
            <p className="text-xs text-white/60">In authority review queue</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-1">
            <div className="text-[10px] font-mono text-white/50 uppercase">AI Analyzed Records</div>
            <div className="text-3xl font-bold text-blue-400 font-silkscreen">{analyzedDocs.length}</div>
            <p className="text-xs text-white/60">OCR extracted & hash validated</p>
          </div>
        </div>

        {/* Documents Pending Verification Request */}
        <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/15 space-y-4 shadow-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <span>Vault Documents Eligible for Verification</span>
          </h2>
          <p className="text-xs text-white/60">
            Submit your AI-analyzed records to competent authorities (e.g. APS India, German Consular Mission, University Registrar) for official credential certification.
          </p>

          {documents.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-white/50">
              No documents in vault yet. Upload documents to request verification.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {documents.map(doc => {
                const isVerified = ['VERIFIED', 'ISSUER_VERIFIED'].includes(doc.verification_status);
                const isPending = doc.verification_status === 'VERIFICATION_PENDING';

                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{doc.original_name}</span>
                        <span className="text-[10px] font-mono text-white/50 uppercase px-2 py-0.5 rounded bg-white/5">
                          {doc.category}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-white/60 truncate max-w-md">
                        SHA-256: {doc.file_hash.slice(0, 24)}...
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isVerified ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>CERTIFIED</span>
                        </div>
                      ) : isPending ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono">
                          <Clock className="h-3.5 w-3.5 animate-pulse" />
                          <span>REVIEW IN PROGRESS</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestVerification(doc.id)}
                          disabled={submittingId === doc.id}
                          className="px-4 py-2 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          <span>{submittingId === doc.id ? 'Submitting...' : 'Request Verification'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
