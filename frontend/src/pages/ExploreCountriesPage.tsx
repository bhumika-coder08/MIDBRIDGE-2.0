import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Globe, Clock, ArrowRight, Filter, Sparkles } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar.js';
import { Footer } from '../components/layout/Footer.js';
import { Country } from '../types/index.js';
import { api } from '../services/api.js';

export const ExploreCountriesPage: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ countries: Country[] }>('/countries')
      .then(res => setCountries(res.countries || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const regions = ['ALL', 'Europe', 'North America', 'Asia', 'Oceania', 'Middle East'];
  const purposes = ['ALL', 'Study', 'Work', 'Research', 'Immigration', 'Travel'];

  const filtered = countries.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = selectedRegion === 'ALL' || c.region.toLowerCase() === selectedRegion.toLowerCase();
    const matchesPurpose = selectedPurpose === 'ALL' || c.popular_purposes.some(p => p.toLowerCase() === selectedPurpose.toLowerCase());
    return matchesSearch && matchesRegion && matchesPurpose;
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header */}
        <div className="max-w-3xl space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-white/80 border border-white/15">
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span>Official Country Library & Policy Database</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Explore Destination Countries
          </h1>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Standardized visa intelligence, credential recognition requirements, financial solvency minimums, and arrival procedures for {countries.length} destination countries.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10 mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by country name (e.g. Germany, Japan, United Kingdom)..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5 text-xs">
            {/* Region Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-white/40 mr-1 font-mono uppercase">Region:</span>
              {regions.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedRegion === r
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Purpose Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-white/40 mr-1 font-mono uppercase">Purpose:</span>
              {purposes.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPurpose(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedPurpose === p
                      ? 'bg-emerald-400 text-black font-semibold'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 rounded-2xl glass-panel animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
            <Globe className="h-8 w-8 text-white/40 mx-auto" />
            <h3 className="text-base font-semibold text-white">No matching destinations found</h3>
            <p className="text-xs text-white/50">Try broadening your search criteria or resetting the region filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(c => (
              <div
                key={c.code}
                className="glass-panel rounded-3xl overflow-hidden border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div>
                  {/* Photo Header */}
                  <div className="h-44 relative overflow-hidden">
                    <img
                      src={c.cover_image}
                      alt={c.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono text-white/90">
                      {c.code}
                    </div>
                    <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
                      <span className="text-3xl filter drop-shadow">{c.flag_emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{c.name}</h3>
                        <p className="text-[11px] text-white/70 font-mono uppercase">{c.region}</p>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-white/70 leading-relaxed line-clamp-3">
                      {c.summary}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {c.popular_purposes.map(p => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/70 font-medium"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>~{c.processing_time_weeks}w review</span>
                  </div>

                  <Link
                    to={`/countries/${c.code}`}
                    className="flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
