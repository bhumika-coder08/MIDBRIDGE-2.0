import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Globe, ArrowRight, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { useJourney } from '../context/JourneyContext.js';

export const JourneyBuilderPage: React.FC = () => {
  const { createJourney } = useJourney();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialDest = searchParams.get('destination') || 'Germany';

  const [fromCountry, setFromCountry] = useState('India');
  const [toCountry, setToCountry] = useState(initialDest);
  const [purpose, setPurpose] = useState('Study');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countries = [
    'United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia',
    'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Netherlands', 'Switzerland',
    'Ireland', 'Italy', 'Spain', 'Sweden', 'Finland', 'China', 'UAE', 'India'
  ];

  const purposes = [
    { value: 'Study', desc: 'Higher education, university admission, blocked accounts, student visa' },
    { value: 'Work', desc: 'Employment contracts, credential recognition (Anabin/ZAB), work permits' },
    { value: 'Immigration', desc: 'Permanent residence, express entry, family reunification' },
    { value: 'Research', desc: 'Postdoctoral fellowships, scientific research permits, bilateral grants' },
    { value: 'Exchange', desc: 'Semester abroad, Erasmus+, mutual university partnerships' },
    { value: 'Travel', desc: 'Schengen / tourist visas, travel insurance, border declarations' },
    { value: 'Family relocation', desc: 'Spouse visas, dependent registration, international schooling' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromCountry === toCountry) {
      setError('Origin and destination countries must be different for a cross-border journey.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createJourney(fromCountry, toCountry, purpose, notes);
      navigate('/journey/stages');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize journey.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-emerald-400 border border-white/15 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>MidBridge 2.0 Journey Engine</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Initialize New Cross-Border Journey
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Specify your origin, destination, and purpose. The requirement engine will formulate your custom 12-stage preparation checklist.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-8">
          {/* Origin & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 font-mono">
                Origin / Nationality Country
              </label>
              <select
                value={fromCountry}
                onChange={e => setFromCountry(e.target.value)}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
              >
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-[11px] text-white/40 mt-1">
                Dictates country-specific credential evaluation rules (e.g. APS certificate).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 font-mono">
                Target Destination Country
              </label>
              <select
                value={toCountry}
                onChange={e => setToCountry(e.target.value)}
                className="w-full bg-[#121216] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
              >
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-[11px] text-white/40 mt-1">
                Generates national visa forms, solvency requirements, and arrival protocols.
              </p>
            </div>
          </div>

          {/* Purpose of Mobility */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider font-mono">
              Primary Purpose of Relocation
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {purposes.map(p => (
                <div
                  key={p.value}
                  onClick={() => setPurpose(p.value)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    purpose === p.value
                      ? 'bg-white/15 border-white/40 shadow-lg'
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{p.value}</span>
                    {purpose === p.value && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 font-mono">
              Journey Notes & Target Timelines (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Admitted to Winter Semester 2026. Target flight date: September 20."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full btn-primary text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-2xl disabled:opacity-50"
          >
            <span>{loading ? 'Assembling Journey Requirements...' : `Generate ${fromCountry} → ${toCountry} Roadmap`}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};
