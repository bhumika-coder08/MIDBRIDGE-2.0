import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, Filter, ExternalLink, Calendar, Award, Globe, Building } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { Scholarship } from '../types/index.js';
import { api } from '../services/api.js';

export const ScholarshipsPage: React.FC = () => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [search, setSearch] = useState('');
  const [fundingFilter, setFundingFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ scholarships: Scholarship[] }>('/scholarships')
      .then(res => setScholarships(res.scholarships || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const fundingTypes = ['ALL', 'Full Tuition + Stipend', 'Partial Grant', 'Stipend + Travel'];

  const filtered = scholarships.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.field.toLowerCase().includes(search.toLowerCase()) ||
                          s.provider.toLowerCase().includes(search.toLowerCase()) ||
                          (s.country_name && s.country_name.toLowerCase().includes(search.toLowerCase()));
    const matchesFunding = fundingFilter === 'ALL' || s.funding_type.toLowerCase() === fundingFilter.toLowerCase();
    return matchesSearch && matchesFunding;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            MidBridge 2.0 Opportunities Engine
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Scholarships & Fellowships</h1>
          <p className="text-xs sm:text-sm text-white/60">
            Representative government and institutional funding programs with direct official application sources.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by program, field, or provider..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
            <span className="text-xs text-white/40 mr-1 font-mono uppercase">Funding:</span>
            {fundingTypes.map(ft => (
              <button
                key={ft}
                onClick={() => setFundingFilter(ft)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  fundingFilter === ft
                    ? 'bg-white text-black font-semibold'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {ft}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-60 rounded-3xl glass-panel animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-xs text-white/50">
            No matching scholarship opportunities found. Try adjusting your search keywords.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(s => (
              <div
                key={s.id}
                className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{s.flag_emoji || '🌐'}</span>
                        <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                          {s.country_name || s.country_code}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{s.name}</h3>
                      <p className="text-xs text-white/60 flex items-center gap-1.5 mt-0.5">
                        <Building className="h-3 w-3 text-white/40" />
                        <span>{s.provider}</span>
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono whitespace-nowrap">
                      {s.funding_type}
                    </span>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed">{s.description}</p>

                  <div className="space-y-1 text-[11px] text-white/60 pt-2 border-t border-white/5">
                    <div>Degree Level: <span className="text-white">{s.level}</span></div>
                    <div>Eligible Fields: <span className="text-white">{s.field}</span></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-white/50">
                    <Calendar className="h-3.5 w-3.5 text-white/40" />
                    <span>Cycle Deadline: <strong className="text-white font-mono">{s.deadline}</strong></span>
                  </div>

                  <a
                    href={s.official_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center gap-1 transition-colors"
                  >
                    <span>Check Official Source</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
