import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Lock, Mail, User, ArrowRight, AlertCircle, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nationality, setNationality] = useState('India');
  const [destinationCountry, setDestinationCountry] = useState('Germany');
  const [purpose, setPurpose] = useState('Study');
  const [role, setRole] = useState<UserRole>('USER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const countries = [
    'United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia',
    'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Netherlands', 'Switzerland',
    'Ireland', 'Italy', 'Spain', 'Sweden', 'Finland', 'China', 'UAE', 'India'
  ];

  const purposes = [
    'Study', 'Work', 'Immigration', 'Research', 'Exchange', 'Travel', 'Family relocation'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup({
        fullName,
        email,
        password,
        role,
        nationality,
        destinationCountry,
        purpose,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create MidBridge 2.0 account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="text-center space-y-2 mb-8 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white lowercase">
            midbridge <span className="text-emerald-400 font-mono text-sm">2.0</span>
          </span>
        </Link>
        <p className="text-xs text-white/50">Personalized Cross-Border Journey Profile</p>
      </div>

      <div className="w-full max-w-lg glass-strong rounded-3xl p-8 border border-white/15 shadow-2xl relative z-10 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create MidBridge 2.0 Account</h2>
          <p className="text-xs text-white/60 mt-1">
            Initialize your cross-border readiness profile and verified document vault.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Full Legal Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Aarav Patel"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Initial Journey Preferences (Part 11) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5" />
              <span>Journey Direction & Purpose</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-white/60 mb-1">Nationality</label>
                <select
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  className="w-full bg-[#121216] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                >
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1">Target Destination</label>
                <select
                  value={destinationCountry}
                  onChange={e => setDestinationCountry(e.target.value)}
                  className="w-full bg-[#121216] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                >
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1">Purpose</label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full bg-[#121216] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                >
                  {purposes.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Account Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full bg-[#121216] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="USER">USER (Student / Worker / Immigrant / Traveler)</option>
              <option value="ADMIN">ADMIN (Platform Infrastructure Control)</option>
              <option value="AUTHORITY">AUTHORITY (Consular / Document Verification)</option>
              <option value="UNIVERSITY">UNIVERSITY (International Admissions Office)</option>
              <option value="VERIFIER">VERIFIER (Identity Verification Desk)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full btn-primary text-sm font-semibold text-white shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Creating account...' : 'Complete Registration & Start Journey'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-white/60">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-medium underline hover:text-white/80">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
