import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Shield, Lock, FileCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-black/60 backdrop-blur-md text-white/70 py-12 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-white" />
            <span className="text-xl font-bold tracking-tight text-white lowercase">
              midbridge <span className="text-emerald-400 font-mono text-sm">2.0</span>
            </span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            Unified cross-border mobility infrastructure organizing international journeys from discovery and requirements to document readiness, verification, and arrival.
          </p>
          <div className="flex items-center gap-3 pt-2 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              SHA-256 Hashing
            </span>
            <span className="flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-blue-400" />
              Selective Disclosure
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/countries" className="hover:text-white transition-colors">Country Library</Link></li>
            <li><Link to="/scholarships" className="hover:text-white transition-colors">Opportunities & Grants</Link></li>
            <li><Link to="/translator" className="hover:text-white transition-colors">AI Multi-mode Translator</Link></li>
            <li><Link to="/verify" className="hover:text-white transition-colors">Verifier Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Mobility Workflows</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/journey/builder" className="hover:text-white transition-colors">Journey Builder</Link></li>
            <li><Link to="/vault" className="hover:text-white transition-colors">Cryptographic Vault</Link></li>
            <li><Link to="/verification" className="hover:text-white transition-colors">Verification System</Link></li>
            <li><Link to="/travel-prep" className="hover:text-white transition-colors">Travel & Departure</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Institutional Portals</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/authority" className="hover:text-white transition-colors">Authority Console</Link></li>
            <li><Link to="/institution" className="hover:text-white transition-colors">University Admissions</Link></li>
            <li><Link to="/admin" className="hover:text-white transition-colors">MidBridge Control (Admin)</Link></li>
            <li><Link to="/emergency" className="hover:text-white transition-colors">Emergency Profile System</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50">
        <p>© 2026 MidBridge 2.0 Mobility Systems Inc. All rights reserved.</p>
        <p className="mt-2 sm:mt-0">
          Built for international students, skilled workers, researchers, and global citizens.
        </p>
      </div>
    </footer>
  );
};
