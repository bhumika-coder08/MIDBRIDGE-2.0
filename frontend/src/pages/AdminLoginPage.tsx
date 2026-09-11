import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { api, setAuthToken } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{ token: string; user: any }>('/auth/admin-login', { email, password });
      setAuthToken(res.token);
      // Hard refresh to reload full user context with ADMIN role
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message || 'Administrative authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Red/amber security ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center space-y-2 mb-8 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-red-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white lowercase">
            midbridge <span className="text-red-400 font-mono text-sm">2.0</span>
          </span>
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[11px] font-mono text-red-300 uppercase tracking-wider">
          <KeyRound className="h-3 w-3" />
          <span>Restricted Administrative Control Gateway</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md glass-strong rounded-3xl p-8 border border-red-500/20 shadow-2xl relative z-10 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Sign-in</h2>
          <p className="text-xs text-white/60 mt-1">
            Authorized personnel only. All access attempts are recorded in immutable audit logs.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Administrative Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@midbridge.io"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-sm font-semibold text-white shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            <span>{loading ? 'Verifying RBAC Authorization...' : 'Authenticate as Admin'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-white/40 pt-2 border-t border-white/10">
          Standard user portal?{' '}
          <Link to="/login" className="text-white/70 underline hover:text-white">
            User Login
          </Link>
        </div>
      </div>
    </div>
  );
};
