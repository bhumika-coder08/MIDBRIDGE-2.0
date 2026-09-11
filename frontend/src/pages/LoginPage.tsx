import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isExpired = searchParams.get('expired') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email address or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center space-y-2 mb-8 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white lowercase">
            midbridge <span className="text-emerald-400 font-mono text-sm">2.0</span>
          </span>
        </Link>
        <p className="text-xs text-white/50">Cross-Border Digital Mobility Platform</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md glass-strong rounded-3xl p-8 border border-white/15 shadow-2xl relative z-10 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
          <p className="text-xs text-white/60 mt-1">
            Sign in to access your cross-border journey and document vault.
          </p>
        </div>

        {isExpired && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Your previous session has expired. Please sign in again.</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-white/70">Password</label>
            </div>
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
            <div className="flex items-center justify-between text-xs text-white/50 pt-1">
              <span className="cursor-pointer hover:text-white transition-colors" onClick={() => alert('Password reset link has been dispatched to registered email if the account exists.')}>
                Forgot password?
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full btn-primary text-sm font-semibold text-white shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-white/60 pt-2 border-t border-white/10">
          Don&apos;t have an account yet?{' '}
          <Link to="/signup" className="text-white font-medium underline hover:text-white/80">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
