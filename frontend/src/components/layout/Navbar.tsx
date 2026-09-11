import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Globe, Shield, ArrowRight, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Lock body scroll when mobile menu is open (Part 7)
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Explore', path: '/countries' },
    { label: 'Countries', path: '/countries' },
    { label: 'Scholarships', path: '/scholarships' },
    { label: 'Translator', path: '/translator' },
    { label: 'Verify', path: '/verify' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          {/* Brand Logo Wordmark (Part 4) */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-105">
              <Globe className="h-4 w-4 text-white/90" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white lowercase">
              midbridge <span className="text-emerald-400 font-mono text-sm">2.0</span>
            </span>
          </Link>

          {/* Desktop Glass Navigation Cluster (Part 6) */}
          <nav className="hidden md:flex items-center rounded-full bg-white/10 px-1.5 py-1.5 backdrop-blur-lg border border-white/10 shadow-2xl">
            {navLinks.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/15 text-white shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="rounded-full px-4 py-2 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-colors flex items-center gap-2"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                    {user.role}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full px-5 py-2 text-sm font-medium text-white btn-primary flex items-center gap-1.5 group"
                >
                  <span>Start Journey</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button (Part 7) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-10 w-10 rounded-full bg-white/10 backdrop-blur-lg border border-white/10 flex items-center justify-center text-white focus:outline-none transition-all duration-300"
            aria-label="Toggle navigation menu"
          >
            <div className={`transition-all duration-300 transform ${mobileMenuOpen ? 'rotate-90 scale-110' : 'rotate-0 scale-100'}`}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Drawer & Backdrop (Part 7) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-72 bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 p-6 flex flex-col justify-between transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-white/90" />
              <span className="text-lg font-bold tracking-tight text-white lowercase">midbridge 2.0</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-6 flex flex-col space-y-2">
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.path}
                className="px-4 py-3 rounded-lg text-base font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/dashboard"
                className="px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <UserIcon className="h-4 w-4" />
                <span>Personal Dashboard</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
          {user ? (
            <div className="space-y-3">
              <div className="text-xs text-white/50 px-2">
                Signed in as <span className="text-white font-medium">{user.email}</span> ({user.role})
              </div>
              <button
                onClick={logout}
                className="w-full rounded-full py-2.5 px-4 text-sm font-medium text-red-300 bg-red-950/30 border border-red-800/30 hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-full text-sm font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="w-full text-center py-2.5 rounded-full text-sm font-medium text-white btn-primary flex items-center justify-center gap-2"
              >
                <span>Start your journey</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};
