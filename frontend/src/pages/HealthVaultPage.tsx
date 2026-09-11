import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Upload,
  ShieldCheck,
  FileText,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Share2,
  X,
  ExternalLink,
  Lock,
  Calendar,
  Building,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { api } from '../services/api.js';

interface HealthDoc {
  id: string;
  category: string;
  title: string;
  original_name: string;
  file_size: number;
  file_hash: string;
  status: string;
  issuer?: string;
  issue_date?: string;
  expiry_date?: string;
  created_at: string;
  notes?: string;
}

interface HealthReadiness {
  healthReadinessScore: number;
  destination: string;
  items: Array<{
    id: string;
    category: string;
    title: string;
    mandatory: boolean;
    status: 'READY' | 'MISSING' | 'EXPIRED';
  }>;
  missingItems: string[];
  disclaimer: string;
}

export const HealthVaultPage: React.FC = () => {
  const [documents, setDocuments] = useState<HealthDoc[]>([]);
  const [readiness, setReadiness] = useState<HealthReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('HEALTH_INSURANCE');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Share modal state
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [allowDownload, setAllowDownload] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [generatedShare, setGeneratedShare] = useState<any | null>(null);
  const [sharing, setSharing] = useState(false);

  const categories = [
    { id: 'ALL', label: 'All Records' },
    { id: 'HEALTH_INSURANCE', label: 'Health Insurance' },
    { id: 'VACCINATION', label: 'Vaccination Records' },
    { id: 'MEDICAL_FITNESS', label: 'Medical Fitness' },
    { id: 'TRAVEL_INSURANCE', label: 'Travel Insurance' },
    { id: 'PRESCRIPTION', label: 'Prescriptions' },
    { id: 'REQUIRED_TEST', label: 'Required Tests' },
    { id: 'OTHER', label: 'Other' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, readyRes] = await Promise.all([
        api.get<{ documents: HealthDoc[] }>('/health-vault/documents'),
        api.get<HealthReadiness>('/health-vault/readiness'),
      ]);
      setDocuments(docsRes.documents || []);
      setReadiness(readyRes);
    } catch (err: any) {
      console.error('Failed to load health vault data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please choose a file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('category', category);
    if (issuer) formData.append('issuer', issuer);
    if (issueDate) formData.append('issueDate', issueDate);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    if (notes) formData.append('notes', notes);

    try {
      await api.post('/health-vault/upload', formData);
      setUploadOpen(false);
      setFile(null);
      setTitle('');
      setIssuer('');
      setIssueDate('');
      setExpiryDate('');
      setNotes('');
      await fetchData();
    } catch (err: any) {
      setUploadError(err.message || 'Health document upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this health record from your Health Vault? This cannot be undone.')) return;
    try {
      await api.delete(`/health-vault/documents/${id}`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete health document.');
    }
  };

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocs.length === 0) {
      alert('Select at least one health record to share.');
      return;
    }
    if (!recipientName) {
      alert('Please specify the recipient entity or university name.');
      return;
    }

    setSharing(true);
    try {
      const res = await api.post('/health-vault/share', {
        healthDocIds: selectedDocs,
        recipientName,
        recipientEmail,
        allowDownload,
        expiryDays: Number(expiryDays),
      });
      setGeneratedShare(res);
    } catch (err: any) {
      alert(err.message || 'Failed to generate health share token.');
    } finally {
      setSharing(false);
    }
  };

  const filteredDocs = activeCategory === 'ALL'
    ? documents
    : documents.filter(d => d.category === activeCategory);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Privacy Guarantee */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 uppercase tracking-wider mb-2">
              <Lock className="h-3 w-3" />
              <span>Private By Default • Explicit Sharing Only</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>MidBridge 2.0 Health Vault</span>
              <HeartPulse className="h-6 w-6 text-rose-400" />
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-3xl">
              Organize vaccination records, medical fitness certificates, health insurance, and travel coverage. Health files are completely isolated and never exposed to universities, authorities, or administrators without your explicit consent.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShareOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5 text-blue-400" />
              <span>Share Selected Records</span>
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="px-4 py-2 rounded-xl btn-primary text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Health File</span>
            </button>
          </div>
        </div>

        {/* Health Readiness & Compliance Card */}
        {readiness && (
          <div className="glass-card rounded-2xl p-6 border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase text-white/50 tracking-wider">Destination Compliance</div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span>{readiness.destination}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">Required Track</span>
              </div>
              <p className="text-xs text-white/50">{readiness.disclaimer}</p>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase text-white/50 tracking-wider">Health Readiness Score</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-mono font-bold text-emerald-400">{readiness.healthReadinessScore}%</span>
                <span className="text-xs text-white/50">compliant</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${readiness.healthReadinessScore}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase text-white/50 tracking-wider">Compliance Checklist</div>
              <div className="space-y-1.5">
                {readiness.items.map(it => (
                  <div key={it.id} className="flex items-center justify-between text-xs">
                    <span className="text-white/80 truncate max-w-[200px]">{it.title}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        it.status === 'READY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : it.status === 'EXPIRED'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {it.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === c.id
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Records List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-white/40">Loading Health Vault records...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center space-y-3 border border-dashed border-white/15">
            <HeartPulse className="h-10 w-10 text-white/20 mx-auto" />
            <h3 className="text-base font-semibold text-white">No health documents in this category</h3>
            <p className="text-xs text-white/50 max-w-md mx-auto">
              Securely store your mandatory health insurance certificate, vaccination certificates, or medical clearances.
            </p>
            <button
              onClick={() => setUploadOpen(true)}
              className="px-4 py-2 rounded-xl btn-primary text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Record</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => {
              const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
              return (
                <div key={doc.id} className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-colors">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/10 text-white/70">
                        {doc.category.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          isExpired
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isExpired ? 'EXPIRED' : doc.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white truncate">{doc.title}</h4>
                    <p className="text-xs text-white/50 truncate mt-0.5">{doc.original_name}</p>

                    <div className="space-y-1 mt-3 text-xs text-white/60">
                      {doc.issuer && (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3 w-3 text-white/40" />
                          <span className="truncate">{doc.issuer}</span>
                        </div>
                      )}
                      {doc.expiry_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-white/40" />
                          <span>Expires: {doc.expiry_date}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 p-2 rounded-xl bg-black/40 border border-white/5 text-[10px] font-mono text-white/40 truncate">
                      SHA-256: {doc.file_hash.slice(0, 16)}...{doc.file_hash.slice(-8)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                    <span className="text-[11px] text-white/40">{(doc.file_size / 1024).toFixed(0)} KB</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/health-vault/documents/${doc.id}/download`}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                        title="Download record"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title="Delete from Health Vault"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {uploadOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl p-6 border border-white/15 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-rose-400" />
                  <span>Upload to Health Vault</span>
                </h3>
                <button onClick={() => setUploadOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-3 text-xs">
                <div>
                  <label className="block text-white/70 mb-1">Select Health Document (PDF, PNG, JPG)</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setFile(e.target.files[0]);
                        if (!title) setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white/80 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-white"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Techniker Krankenkasse (TK) Certificate"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="HEALTH_INSURANCE">Health Insurance</option>
                      <option value="VACCINATION">Vaccination Records</option>
                      <option value="MEDICAL_FITNESS">Medical Fitness Certificate</option>
                      <option value="TRAVEL_INSURANCE">Travel Insurance</option>
                      <option value="PRESCRIPTION">Prescription / Medication</option>
                      <option value="REQUIRED_TEST">Required Medical Test</option>
                      <option value="OTHER">Other Health Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">Issuer Organization</label>
                    <input
                      type="text"
                      value={issuer}
                      onChange={e => setIssuer(e.target.value)}
                      placeholder="e.g. Health Ministry / TK / DAAD"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1">Expiry Date (If applicable)</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Confidential Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Private notes (never shared without permission)..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-5 py-2 rounded-xl btn-primary text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? 'Calculating SHA-256...' : 'Save to Health Vault'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Selective Health Share Modal */}
        {shareOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl p-6 border border-white/15 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-blue-400" />
                  <span>Selective Health Disclosure</span>
                </h3>
                <button onClick={() => { setShareOpen(false); setGeneratedShare(null); }} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {generatedShare ? (
                <div className="space-y-4 text-center py-4">
                  <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-2xl">
                    <QRCodeSVG value={`${window.location.origin}${generatedShare.shareUrl}`} size={160} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Health Share Package Generated</h4>
                    <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto">
                      Recipient <strong>{recipientName}</strong> can only view the specific health files selected below. Access automatically expires on {new Date(generatedShare.expiresAt).toLocaleDateString()}.
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-emerald-400 truncate">
                    {window.location.origin}{generatedShare.shareUrl}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${generatedShare.shareUrl}`);
                      alert('Share link copied to clipboard.');
                    }}
                    className="px-4 py-2 rounded-xl btn-primary text-xs font-semibold text-white cursor-pointer"
                  >
                    Copy Inspection URL
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateShare} className="space-y-3 text-xs">
                  <p className="text-white/60">
                    Select exactly which health files to disclose. Unchecked health records, prescriptions, and allergy details remain strictly private.
                  </p>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-black/40 border border-white/10">
                    {documents.map(d => (
                      <label key={d.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDocs.includes(d.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedDocs([...selectedDocs, d.id]);
                            else setSelectedDocs(selectedDocs.filter(id => id !== d.id));
                          }}
                          className="rounded border-white/20"
                        />
                        <div className="truncate">
                          <div className="text-white font-medium truncate">{d.title}</div>
                          <div className="text-[10px] text-white/40">{d.category} • {(d.file_size / 1024).toFixed(0)} KB</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">Recipient Entity / Organization</label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="e.g. University Admissions Office / Consular Health Desk"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/70 mb-1">Access Expiration</label>
                      <select
                        value={expiryDays}
                        onChange={e => setExpiryDays(Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                      >
                        <option value={3}>3 Days</option>
                        <option value={7}>7 Days</option>
                        <option value={14}>14 Days</option>
                        <option value={30}>30 Days</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-white/70">
                        <input
                          type="checkbox"
                          checked={allowDownload}
                          onChange={e => setAllowDownload(e.target.checked)}
                        />
                        <span>Allow File Download</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShareOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sharing}
                      className="px-5 py-2 rounded-xl btn-primary text-white font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {sharing ? 'Generating Secure Token...' : 'Create Selective Share'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
