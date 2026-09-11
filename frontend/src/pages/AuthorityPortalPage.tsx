import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, FileText, CheckCircle2, XCircle, Clock, Download, ExternalLink, Sparkles } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { api } from '../services/api.js';

interface QueueItem {
  id: string;
  original_name: string;
  category: string;
  file_hash: string;
  verification_status: string;
  user_email: string;
  user_full_name?: string;
  from_country?: string;
  to_country?: string;
  purpose?: string;
  ai_analysis?: any;
  created_at: string;
}

export const AuthorityPortalPage: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [reason, setReason] = useState('Document authenticated against national registry archives.');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await api.get<{ queue: QueueItem[] }>('/verification/queue');
      setQueue(res.queue || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDecision = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedItem) return;
    setProcessing(true);

    try {
      await api.post('/verification/review', {
        documentId: selectedItem.id,
        status,
        reason,
      });

      setFeedback(`Document ${selectedItem.original_name} marked as ${status}. Digital signature stamp dispatched.`);
      setSelectedItem(null);
      await fetchQueue();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to record verification decision.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-blue-400">
            Competent Consular & Verification Authority
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Authority Verification Console</h1>
          <p className="text-xs sm:text-sm text-white/60">
            Official adjudication docket for incoming applicant identity, academic, and financial credentials.
          </p>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left List: Inbound Queue */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Submitted Verification Queue ({queue.length})
              </h3>
              <span className="text-xs text-white/50">Live Consular Stream</span>
            </div>

            {queue.length === 0 ? (
              <div className="p-12 text-center text-xs text-white/50">
                No documents currently pending verification review.
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  const isVerified = item.verification_status === 'VERIFIED';
                  const isPending = item.verification_status === 'VERIFICATION_PENDING';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-white/15 border-white/40 shadow-xl'
                          : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{item.original_name}</span>
                          <span className="text-[10px] font-mono text-white/50 uppercase px-1.5 py-0.5 rounded bg-white/5">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-xs text-white/60">
                          Applicant: <strong className="text-white">{item.user_full_name || item.user_email}</strong>{' '}
                          {item.from_country && `(${item.from_country} → ${item.to_country})`}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isVerified ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                            VERIFIED
                          </span>
                        ) : isPending ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono animate-pulse">
                            PENDING REVIEW
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-mono">
                            {item.verification_status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Adjudication Inspection & Action Box */}
          <div>
            {selectedItem ? (
              <div className="glass-strong rounded-3xl p-6 border border-white/15 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-mono uppercase text-blue-400 font-bold">Document Adjudication</span>
                  <a
                    href={`/api/documents/${selectedItem.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                    title="Download Source Document"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-bold text-white text-base">{selectedItem.original_name}</div>
                  <div className="text-white/60">Applicant: <span className="text-white">{selectedItem.user_full_name || selectedItem.user_email}</span></div>
                  <div className="text-white/60">Category: <span className="text-white font-mono uppercase">{selectedItem.category}</span></div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-white/40">SHA-256 Hash Verification:</span>
                    <div className="text-[10px] font-mono text-white/80 break-all select-all">
                      {selectedItem.file_hash}
                    </div>
                  </div>
                </div>

                {/* Adjudication Decision Form */}
                <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
                  <label className="block text-white/70 font-medium">Official Adjudication Note / Reason</label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleDecision('VERIFIED')}
                      disabled={processing}
                      className="py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Certify & Verify</span>
                    </button>
                    <button
                      onClick={() => handleDecision('REJECTED')}
                      disabled={processing}
                      className="py-2.5 rounded-full bg-red-600/80 hover:bg-red-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject Record</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 text-center text-xs text-white/40 space-y-2">
                <ShieldCheck className="h-8 w-8 text-white/30 mx-auto" />
                <p>Select a document from the queue to inspect metadata and issue an official certification decision.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
