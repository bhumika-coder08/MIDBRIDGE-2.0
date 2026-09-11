import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Share2,
  Lock,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Plus,
  AlertCircle,
  X,
  FileCheck,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { useJourney } from '../context/JourneyContext.js';
import { SharePackage } from '../types/index.js';
import { api } from '../services/api.js';

export const SharePackagesPage: React.FC = () => {
  const { documents } = useJourney();
  const [packages, setPackages] = useState<SharePackage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [allowDownload, setAllowDownload] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<SharePackage | null>(null);

  const fetchPackages = async () => {
    try {
      const res = await api.get<{ packages: SharePackage[] }>('/share');
      setPackages(res.packages || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const toggleDocSelection = (id: string) => {
    setSelectedDocs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocs.length === 0) {
      setError('Please select at least one document to include in this package.');
      return;
    }
    if (!recipientName.trim()) {
      setError('Please provide recipient entity name.');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await api.post('/share', {
        documentIds: selectedDocs,
        recipientName,
        allowDownload,
        expiryDays,
        notes,
      });
      await fetchPackages();
      setModalOpen(false);
      setSelectedDocs([]);
      setRecipientName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create share package.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke access to this verification package immediately?')) return;
    try {
      await api.post(`/share/${id}/revoke`);
      await fetchPackages();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke package.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              Zero-Knowledge Credential Sharing
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Selective Disclosure Packages</h1>
            <p className="text-xs sm:text-sm text-white/60">
              Disclose only what universities or embassies need. Never expose unrelated medical or financial records.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-2 self-start sm:self-auto shadow-xl"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Share Package</span>
          </button>
        </div>

        {/* Existing Share Packages */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            <span>Active Selective Disclosures ({packages.length})</span>
          </h2>

          {packages.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center text-xs text-white/50 space-y-2">
              <Share2 className="h-8 w-8 text-white/40 mx-auto" />
              <p>You have not generated any selective disclosure packages yet.</p>
              <p className="text-[11px] text-white/40">Packages allow third-party verifiers to inspect authorized records via QR.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map(pkg => {
                const isExpired = new Date(pkg.expires_at) < new Date();
                const shareUrl = `${window.location.origin}/verify/${pkg.share_token}`;

                return (
                  <div
                    key={pkg.id}
                    className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between space-y-4 shadow-xl"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                            RECIPIENT ENTITY
                          </span>
                          <h3 className="text-lg font-bold text-white mt-0.5">{pkg.recipient_name}</h3>
                          <p className="text-xs text-white/50">
                            {pkg.document_count || 1} Disclosed Document{pkg.document_count === 1 ? '' : 's'}
                          </p>
                        </div>

                        {pkg.is_revoked ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-mono">
                            REVOKED
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-white/70 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-white/40">Token:</span>
                          <span className="text-white select-all">{pkg.share_token.slice(0, 16)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Expires:</span>
                          <span className="text-white">{new Date(pkg.expires_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Download Allowed:</span>
                          <span className="text-white">{pkg.allow_download ? 'Yes' : 'View Only'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveQrModal(pkg)}
                          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                        >
                          View QR Code
                        </button>
                        <a
                          href={`/verify/${pkg.share_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                          title="Open Verifier View"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>

                      {!pkg.is_revoked && !isExpired && (
                        <button
                          onClick={() => handleRevoke(pkg.id)}
                          className="px-3 py-1.5 rounded-full bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-800/30 text-xs transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CREATE PACKAGE MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-lg glass-strong rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-bold text-white">Create Selective Disclosure</h3>
                  <p className="text-xs text-white/50">Authorize specific files with automatic expiration</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-full text-white/60 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Recipient Entity</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="e.g. TUM International Admissions, German Embassy"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  />
                </div>

                {/* Document Selection Checkboxes */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-white/70">Select Authorized Documents ({selectedDocs.length})</label>
                  <div className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-xl bg-black/40 border border-white/10">
                    {documents.length === 0 ? (
                      <div className="text-xs text-white/40 text-center py-4">No documents available in your vault.</div>
                    ) : (
                      documents.map(d => (
                        <label
                          key={d.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(d.id)}
                            onChange={() => toggleDocSelection(d.id)}
                            className="rounded bg-black border-white/20 text-emerald-400 focus:ring-0"
                          />
                          <div className="flex-1 truncate">
                            <span className="text-white font-medium">{d.original_name}</span>
                            <span className="text-[10px] text-white/40 ml-2 font-mono uppercase">({d.category})</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">Expiration Period</label>
                    <select
                      value={expiryDays}
                      onChange={e => setExpiryDays(parseInt(e.target.value, 10))}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value={1}>24 Hours</option>
                      <option value={3}>3 Days</option>
                      <option value={7}>7 Days</option>
                      <option value={30}>30 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">Permissions</label>
                    <label className="flex items-center gap-2 mt-2 text-xs text-white/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowDownload}
                        onChange={e => setAllowDownload(e.target.checked)}
                        className="rounded bg-black border-white/20 text-emerald-400 focus:ring-0"
                      />
                      <span>Allow File Download</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating || selectedDocs.length === 0}
                  className="w-full py-3 rounded-full btn-primary text-xs font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <span>{creating ? 'Generating Token...' : 'Generate Secure Disclosure Link'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* QR CODE DISPLAY MODAL */}
        {activeQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-sm glass-strong rounded-3xl p-6 border border-white/15 shadow-2xl text-center space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold">MidBridge 2.0 Verifier QR</span>
                <button onClick={() => setActiveQrModal(null)} className="p-1 rounded-full text-white/60 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-2xl">
                <QRCodeSVG
                  value={`${window.location.origin}/verify/${activeQrModal.share_token}`}
                  size={190}
                  level="H"
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-white">{activeQrModal.recipient_name}</div>
                <p className="text-[11px] text-white/50">
                  Scan with mobile camera or verification scanner to inspect authorized records.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/verify/${activeQrModal.share_token}`);
                    alert('Share link copied to clipboard!');
                  }}
                  className="w-full py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                >
                  Copy Verification URL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
