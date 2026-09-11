import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FolderLock,
  Upload,
  FileText,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Eye,
  Lock,
  X,
  FileCheck,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { useJourney } from '../context/JourneyContext.js';
import { VaultDocument } from '../types/index.js';
import { api } from '../services/api.js';

export const VaultPage: React.FC = () => {
  const { activeJourney, documents, deleteDocument, refreshJourney } = useJourney();
  const [searchParams] = useSearchParams();

  const reqParam = searchParams.get('requirementId');
  const catParam = searchParams.get('category');

  const [activeCategory, setActiveCategory] = useState<string>(catParam || 'ALL');
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(!!reqParam);
  const [selectedDocForAnalysis, setSelectedDocForAnalysis] = useState<VaultDocument | null>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>(catParam || 'IDENTITY');
  const [requirementId, setRequirementId] = useState<string>(reqParam || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const categories = [
    'ALL', 'IDENTITY', 'ACADEMIC', 'EDUCATION', 'IMMIGRATION', 'FINANCIAL', 'HEALTH', 'EMPLOYMENT', 'OTHER'
  ];

  const filteredDocs = documents.filter(d => {
    if (activeCategory === 'ALL') return true;
    return d.category.toUpperCase() === activeCategory.toUpperCase();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

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
    formData.append('category', category);
    if (activeJourney) formData.append('journeyId', activeJourney.id);
    if (requirementId) formData.append('requirementId', requirementId);

    try {
      await api.post('/documents/upload', formData);
      await refreshJourney();
      setUploadModalOpen(false);
      setFile(null);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleRequestVerification = async (docId: string) => {
    try {
      await api.post('/verification/request', { documentId: docId });
      setVerificationFeedback('Verification request dispatched to competent authorities.');
      await refreshJourney();
      setTimeout(() => setVerificationFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit verification request.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              Cryptographic Storage & Analysis
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">MidBridge 2.0 Vault</h1>
            <p className="text-xs sm:text-sm text-white/60">
              SHA-256 hashed document storage with client-side verification and selective disclosure packages.
            </p>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-2 self-start sm:self-auto shadow-xl"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Document to Vault</span>
          </button>
        </div>

        {verificationFeedback && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{verificationFeedback}</span>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Document Grid / Table */}
        {filteredDocs.length === 0 ? (
          /* PART 47: Premium Empty State */
          <div className="glass-panel rounded-3xl p-16 text-center max-w-lg mx-auto space-y-4">
            <FolderLock className="h-12 w-12 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Your vault is ready</h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Upload your first document to begin building your MidBridge 2.0 readiness profile. Every upload receives a SHA-256 cryptographic hash and instant AI field extraction.
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-6 py-2.5 rounded-full btn-primary text-xs font-semibold text-white inline-flex items-center gap-2 mt-2"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Identity or Academic Record</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => {
              const isVerified = ['VERIFIED', 'ISSUER_VERIFIED'].includes(doc.verification_status);
              const isPending = doc.verification_status === 'VERIFICATION_PENDING';

              return (
                <div
                  key={doc.id}
                  className="glass-panel rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 shadow-xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white truncate max-w-[170px]" title={doc.original_name}>
                            {doc.original_name}
                          </h4>
                          <span className="text-[10px] font-mono text-white/50 uppercase">
                            {doc.category} • {formatBytes(doc.file_size)}
                          </span>
                        </div>
                      </div>

                      {/* Verification Status Badge */}
                      {isVerified ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                          VERIFIED
                        </span>
                      ) : isPending ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                          PENDING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                          AI ANALYZED
                        </span>
                      )}
                    </div>

                    {/* Cryptographic SHA-256 Hash Display (Part 18) */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-white/40 uppercase">
                        <span className="flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5 text-emerald-400" />
                          SHA-256 Integrity Hash
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-white/70 truncate select-all" title={doc.file_hash}>
                        {doc.file_hash}
                      </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="text-xs text-white/60 space-y-0.5">
                      {doc.issuer && <div>Issuer: <span className="text-white">{doc.issuer}</span></div>}
                      {doc.expiry_date && <div>Validity: <span className="text-white">{doc.expiry_date}</span></div>}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedDocForAnalysis(doc)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
                        title="Inspect AI Analysis & Verification Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
                        title="Download Document"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 rounded-full bg-white/5 hover:bg-red-950/40 text-white/70 hover:text-red-300 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {!isVerified && !isPending && (
                      <button
                        onClick={() => handleRequestVerification(doc.id)}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-medium text-white transition-colors flex items-center gap-1"
                      >
                        <Shield className="h-3 w-3 text-emerald-400" />
                        <span>Request Verify</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPLOAD MODAL (Working File Picker & Validation - Part 15) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-strong rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white">Upload to MidBridge 2.0 Vault</h3>
                <p className="text-xs text-white/50">Supports PDF, JPG, PNG (Max 15MB)</p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl p-6 text-center cursor-pointer relative bg-white/[0.01] transition-colors">
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <Upload className="h-8 w-8 text-emerald-400 mx-auto" />
                  <div className="text-sm font-semibold text-white">
                    {file ? file.name : 'Choose a file or drag here'}
                  </div>
                  <div className="text-xs text-white/50">
                    {file ? formatBytes(file.size) : 'PDF, JPG, PNG up to 15MB'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Document Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="IDENTITY">IDENTITY (Passport, National ID)</option>
                  <option value="ACADEMIC">ACADEMIC (Degree, Transcripts, APS)</option>
                  <option value="IMMIGRATION">IMMIGRATION (Visa, Permits)</option>
                  <option value="FINANCIAL">FINANCIAL (Blocked Account, Bank Statement)</option>
                  <option value="HEALTH">HEALTH (Insurance, Vaccination)</option>
                  <option value="EMPLOYMENT">EMPLOYMENT (Offer Letter, Contract)</option>
                  <option value="OTHER">OTHER (Custom Documents)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 space-y-1">
                <div className="font-semibold text-white">Automated Processing Pipeline:</div>
                <div>• Instant SHA-256 cryptographic hash computation</div>
                <div>• OCR field extraction & document categorization</div>
                <div>• Separation between AI Analyzed & Officially Verified</div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full py-3 rounded-full btn-primary text-xs font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{uploading ? 'Hashing & Analyzing Document...' : 'Securely Upload & Analyze'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT ANALYSIS INSPECT DRAWER (Part 16) */}
      {selectedDocForAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl glass-strong rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white truncate max-w-[280px]">
                    {selectedDocForAnalysis.original_name}
                  </h3>
                  <p className="text-xs text-white/50">Structured Document Analysis</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForAnalysis(null)}
                className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Crucial Part 16 Distinction Badge */}
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>STATE: AI ANALYZED RECORD</span>
              </div>
              <p className="text-[11px] text-blue-200/80 leading-relaxed">
                AI extraction parsed metadata and cryptographic hash. This record is NOT yet an officially verified government record until certified by an authorized consular verifier.
              </p>
            </div>

            {/* Extracted Metadata Fields */}
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Classification:</span>
                  <span className="font-semibold text-white">
                    {selectedDocForAnalysis.ai_analysis?.classification || selectedDocForAnalysis.category}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Detected Bearer:</span>
                  <span className="text-white">
                    {selectedDocForAnalysis.ai_analysis?.detectedName || 'Bearer Name'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Identifier / Doc Number:</span>
                  <span className="font-mono text-white">
                    {selectedDocForAnalysis.ai_analysis?.documentNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Issuing Authority:</span>
                  <span className="text-white">
                    {selectedDocForAnalysis.issuer || selectedDocForAnalysis.ai_analysis?.issuer || 'Competent Authority'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Expiry / Validity:</span>
                  <span className="font-mono text-white">
                    {selectedDocForAnalysis.expiry_date || 'Standard Validity'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">QR Integrity Code:</span>
                  <span className="text-emerald-400 font-mono">
                    {selectedDocForAnalysis.ai_analysis?.hasQrCode ? 'Present' : 'Not Detected'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Digital Signature:</span>
                  <span className="text-emerald-400 font-mono">
                    {selectedDocForAnalysis.ai_analysis?.hasDigitalSignature ? 'Validated' : 'Not Detected'}
                  </span>
                </div>
              </div>

              {/* Cryptographic SHA-256 Box */}
              <div className="p-3.5 rounded-2xl bg-black border border-white/15 space-y-1">
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                  SHA-256 Cryptographic Hash
                </div>
                <div className="text-[11px] font-mono text-white/80 break-all select-all">
                  {selectedDocForAnalysis.file_hash}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedDocForAnalysis(null)}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
