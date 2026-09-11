import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Globe,
  Clock,
  ExternalLink,
  Shield,
  GraduationCap,
  Briefcase,
  Plane,
  Heart,
  CreditCard,
  Building2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar.js';
import { Footer } from '../components/layout/Footer.js';
import { Country, CountrySection, Scholarship } from '../types/index.js';
import { api } from '../services/api.js';

export const CountryDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [country, setCountry] = useState<Country | null>(null);
  const [sections, setSections] = useState<CountrySection[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    api.get<{ country: Country; sections: CountrySection[]; scholarships: Scholarship[] }>(`/countries/${code}`)
      .then(res => {
        setCountry(res.country);
        setSections(res.sections || []);
        setScholarships(res.scholarships || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <Globe className="h-8 w-8 text-white/40 animate-spin mx-auto" />
          <p className="text-xs text-white/60">Loading country intelligence dossier...</p>
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-32 space-y-4">
          <h2 className="text-2xl font-bold">Country Not Found</h2>
          <Link to="/countries" className="text-sm text-emerald-400 hover:underline">
            Back to Country Library
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryIcons: Record<string, any> = {
    overview: Globe,
    study: GraduationCap,
    work: Briefcase,
    visa: Shield,
    financial: CreditCard,
    health: Heart,
    arrival: Building2,
    emergency: AlertTriangle,
  };

  const currentSection = sections.find(s => s.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Back Link */}
        <Link
          to="/countries"
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Destination Library</span>
        </Link>

        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden glass-strong border border-white/15 p-8 sm:p-12 mb-8 shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img
              src={country.cover_image}
              alt={country.name}
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl filter drop-shadow">{country.flag_emoji}</span>
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">{country.name}</h1>
                <p className="text-xs font-mono uppercase tracking-widest text-white/60">
                  {country.region} • ISO Code: {country.code}
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-2xl">
              {country.summary}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>Processing Time: ~{country.processing_time_weeks} Weeks</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 font-mono">
                Currency: {country.currency || 'EUR'}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
                Language: {country.language || 'Official Language'}
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link
                to={`/journey/builder?destination=${country.code}`}
                className="px-6 py-2.5 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-2"
              >
                <span>Create Journey to {country.name}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Intelligence Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 border-b border-white/10">
          {sections.map(s => {
            const Icon = categoryIcons[s.category] || Globe;
            const isActive = activeTab === s.category;
            return (
              <button
                key={s.category}
                onClick={() => setActiveTab(s.category)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="capitalize">{s.category}</span>
              </button>
            );
          })}
          {scholarships.length > 0 && (
            <button
              onClick={() => setActiveTab('scholarships')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'scholarships'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Scholarships ({scholarships.length})</span>
            </button>
          )}
        </div>

        {/* Section Content Display */}
        {activeTab === 'scholarships' ? (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Government & Institutional Opportunities for {country.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scholarships.map(sch => (
                <div key={sch.id} className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                        {sch.funding_type}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{sch.name}</h4>
                      <p className="text-xs text-white/60">{sch.provider}</p>
                    </div>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed">{sch.description}</p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-white/50">Deadline: <span className="text-white font-mono">{sch.deadline}</span></span>
                    <a
                      href={sch.official_source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-emerald-400 hover:underline"
                    >
                      <span>Official Source</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : currentSection ? (
          <div className="glass-panel rounded-3xl p-8 border border-white/10 space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                Official Mobility Policy • {country.name}
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">{currentSection.title}</h2>
            </div>

            <div className="prose prose-invert text-sm text-white/80 leading-relaxed space-y-4">
              <p>{currentSection.content}</p>
            </div>

            {/* Source Provenance Card (Part 9) */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/60">
              <div className="space-y-1">
                <div className="text-white font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Authority Source: {currentSection.source_organization}</span>
                </div>
                <div className="text-[11px] text-white/40 font-mono">
                  Verified Data Cycle • Last Checked: {currentSection.last_checked}
                </div>
              </div>

              <a
                href={currentSection.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-white hover:text-emerald-300 transition-colors"
              >
                <span>Open Official Registry</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-8 text-center text-xs text-white/50">
            No specific policy notes documented under this category.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
