import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  FileCheck,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Globe,
  QrCode,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar.js';
import { Footer } from '../components/layout/Footer.js';
import { api } from '../services/api.js';

interface AuthorizedPackage {
  id: string;
  recipientName: string;
  expiresAt: string;
  allowDownload: boolean;
  userName: string;
  nationality: string;
  authorizedDocuments: Array<{
    id: string;
    category: string;
    original_name: string;
    file_size: number;
    file_hash: string;
    verification_status: string;
    issuer?: string;
    issue_date?: string;
    expiry_date?: string;
    created_at: string;
  }>;
}

export const VerifierPortalPage: React.FC = () => {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState(token || '');
  const [packageData, setPackageData] = useState<AuthorizedPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVerification = async (tok: string) => {
    if (!tok.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.get<{ package: AuthorizedPackage }>(`/share/verify/${tok.trim()}`);
      setPackageData(res.package);
    } catch (err: any) {
      setError(err.message || 'Verification record not found or access has been revoked.');
      setPackageData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchVerification(token);
    }
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      navigate(`/verify/${tokenInput.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-emerald-400 border border-white/15">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>MidBridge 2.0 Authorized Verifier Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Document Verification Portal
          </h1>
          <p className="text-xs sm:text-sm text-white/60">
            Inspect zero-knowledge selective disclosures, cryptographic SHA-256 hashes, and consular certifications.
          </p>
        </div>

        {/* Search / Token Input Form */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 max-w-xl mx-auto mb-8 shadow-xl">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Enter verification identifier or share token..."
                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="px-6 py-2.5 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-40"
            >
              <span>Inspect</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </form>
        </div>

        {error && (
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {packageData && (
          <div className="glass-strong rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl space-y-8 animate-fadeIn">
            {/* Record Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-emerald-400 font-bold">
                    SELECTIVE DISCLOSURE VERIFIED
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Applicant: {packageData.userName}
                </h2>
                <p className="text-xs text-white/60">
                  Nationality: <strong className="text-white">{packageData.nationality}</strong> • Intended Recipient: <strong className="text-white">{packageData.recipientName}</strong>
                </p>
              </div>

              <div className="text-right text-xs font-mono text-white/50">
                <div>Valid Through: <span className="text-white">{new Date(packageData.expiresAt).toLocaleDateString()}</span></div>
                <div>Status: <span className="text-emerald-400 font-bold">ACTIVE DEPOSIT</span></div>
              </div>
            </div>

            {/* Authorized Disclosed Documents */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <span>Authorized Documents Disclosed ({packageData.authorizedDocuments.length})</span>
              </h3>

              <div className="space-y-3">
                {packageData.authorizedDocuments.map(doc => {
                  const isVerified = ['VERIFIED', 'ISSUER_VERIFIED'].includes(doc.verification_status);

                  return (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{doc.original_name}</span>
                            <span className="text-[10px] font-mono text-white/50 uppercase px-1.5 py-0.5 rounded bg-white/5">
                              {doc.category}
                            </span>
                          </div>
                          <div className="text-xs text-white/60 mt-0.5">
                            {doc.issuer ? `Issuer: ${doc.issuer}` : 'Issuing Competent Body'}
                          </div>
                        </div>

                        {/* Status Stamp */}
                        {isVerified ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold self-start sm:self-auto">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>OFFICIALLY VERIFIED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono self-start sm:self-auto">
                            <Lock className="h-3.5 w-3.5" />
                            <span>AI ANALYZED</span>
                          </div>
                        )}
                      </div>

                      {/* Cryptographic Hash Box */}
                      <div className="p-3 rounded-xl bg-black border border-white/5 space-y-1">
                        <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center justify-between">
                          <span>SHA-256 Cryptographic Fingerprint</span>
                          <span className="text-white/40">Integrity Validated</span>
                        </div>
                        <div className="text-[11px] font-mono text-white/80 break-all select-all">
                          {doc.file_hash}
                        </div>
                      </div>

                      {packageData.allowDownload && (
                        <div className="flex justify-end pt-1">
                          <a
                            href={`/api/documents/${doc.id}/download`}
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download Authorized Copy</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zero-Knowledge Security Notice */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/60 leading-relaxed">
              <strong className="text-white">MidBridge 2.0 Selective Disclosure Guarantee:</strong> This link exposes solely the documents explicitly selected by the applicant for {packageData.recipientName}. No medical, financial, or personal records outside this package are visible.
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
