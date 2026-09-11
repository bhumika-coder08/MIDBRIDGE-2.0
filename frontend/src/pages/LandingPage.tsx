import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Shield, Sparkles, CheckCircle2, ChevronDown, Lock, Cpu, Compass } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar.js';
import { Footer } from '../components/layout/Footer.js';
import { CountryCarousel3D } from '../components/3d/CountryCarousel3D.js';
import { Country } from '../types/index.js';
import { api } from '../services/api.js';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    api.get<{ countries: Country[] }>('/countries').then((res) => {
      setCountries(res.countries || []);
    }).catch(err => {
      console.warn('Could not load countries:', err);
    });
  }, []);

  const scrollToContent = () => {
    const el = document.getElementById('explore-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-black text-white selection:bg-white/20">
      <Navbar />

      {/* PART 3: CINEMATIC FULL-SCREEN VIDEO HERO (No scrolling inside initial hero) */}
      <section className="h-screen w-full overflow-hidden relative flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        {/* Background Video */}
        <video
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          autoPlay
          loop
          muted
          playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260803_192301_9231ed6b-c55c-4a48-909c-4ebe11cf2e11.mp4"
        />

        {/* Subtle glass vignette to keep video clearly visible without heavy gradient */}
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />

        {/* Top spacer for navbar */}
        <div className="h-16" />

        {/* Center Hero Content Over Video */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 shadow-xl animate-fadeIn">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono uppercase tracking-widest text-[11px]">Unified Cross-Border Mobility Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] drop-shadow-2xl">
            One journey. Every border. <span className="text-white/80">Connected.</span>
          </h1>

          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-md">
            Your intelligent cross-border companion for documents, requirements, scholarships, verification, translation and international mobility.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full btn-primary text-sm font-semibold text-white shadow-2xl flex items-center justify-center gap-2 group"
            >
              <span>Start your journey</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              onClick={scrollToContent}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-sm font-medium text-white transition-colors"
            >
              Explore countries
            </button>
          </div>
        </div>

        {/* Glass Intelligence Cards (No fake stats!) */}
        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
          {/* Glass Card 1 */}
          <div className="glass-panel rounded-2xl p-5 border border-white/15 shadow-2xl backdrop-blur-lg">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-emerald-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                Journey Intelligence
              </span>
              <span className="text-white/40">Country → Purpose → Requirements</span>
            </div>
            <p className="text-sm text-white/90 leading-snug">
              MidBridge 2.0 builds your preparation roadmap around where you&apos;re coming from, where you&apos;re going and why.
            </p>
          </div>

          {/* Glass Card 2 */}
          <div className="glass-panel rounded-2xl p-5 border border-white/15 shadow-2xl backdrop-blur-lg">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-blue-400 mb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Readiness Engine
              </span>
              <span className="text-white/40">Documents. Verification. Mobility.</span>
            </div>
            <p className="text-sm text-white/90 leading-snug">
              Track what is ready, what is missing and what needs attention before you move.
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="relative z-10 flex justify-center">
          <button
            onClick={scrollToContent}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors pb-1"
          >
            <span>Explore Spatial Country Explorer</span>
            <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* PART 10 & 39: 3D CYLINDRICAL COUNTRY CAROUSEL SECTION */}
      <section id="explore-section" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/70">
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span>Interactive 3D Destination Explorer</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Choose Your Destination
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            Spatial 3D carousel powered by continuous circular inertia. Flip any card to examine consular processing windows, visa pathways, and requirement protocols.
          </p>
        </div>

        {/* 3D Carousel Component */}
        <CountryCarousel3D countries={countries} />

        <div className="text-center mt-12">
          <Link
            to="/countries"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-sm font-medium text-white transition-colors"
          >
            <span>View All 20+ Supported Countries in Full Library</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* PART 64: CORE DIFFERENTIATOR SECTION */}
      <section className="py-24 border-y border-white/10 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              The Connected Cross-Border Workflow
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Most platforms solve only one fragmented slice—either visa info, scholarship lists, or document storage. MidBridge 2.0 connects the entire international relocation lifecycle.
            </p>
          </div>

          {/* Connected Flow Diagram */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {[
              { step: '01', title: 'Destination', desc: 'Select target nation & legal purpose' },
              { step: '02', title: 'Requirements', desc: 'Dynamic rule matrix generates checklist' },
              { step: '03', title: 'Document Vault', desc: 'SHA-256 cryptographic file hashing' },
              { step: '04', title: 'Verification', desc: 'Distinction between AI and Official stamps' },
              { step: '05', title: 'Readiness Score', desc: 'Deterministic score with zero guesswork' },
              { step: '06', title: 'Travel & Arrival', desc: 'Consular prep, Anmeldung & settlement' },
            ].map((node) => (
              <div
                key={node.step}
                className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col justify-between hover:border-white/25 transition-colors"
              >
                <div>
                  <div className="text-xs font-mono text-emerald-400 font-bold mb-2">
                    {node.step}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{node.title}</h3>
                </div>
                <p className="text-xs text-white/50 leading-relaxed mt-2">{node.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEY CAPABILITIES GRID */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-3xl p-8 border border-white/10 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Cryptographic Vault & Audit</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Every document computes a client-verified SHA-256 cryptographic hash. Changes alter the fingerprint immediately, preserving audit history and ensuring zero document spoofing.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-8 border border-white/10 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
              <Lock className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Selective Disclosure Packages</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Universities need degrees and passports, not medical or financial histories. Generate time-limited QR codes and links that expose only authorized records with single-click revocation.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-8 border border-white/10 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
              <Cpu className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Contextual Mobility Intelligence</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              The MidBridge 2.0 Assistant knows your active route, missing mandatory papers, and approaching deadlines. It provides actionable preparation advice without generic filler.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="glass-strong rounded-3xl p-10 sm:p-16 border border-white/15 shadow-2xl space-y-6">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Begin Your Cross-Border Journey
          </h2>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
            Eliminate chaotic spreadsheets and fragmented consular checklists. Secure your documents and track readiness with MidBridge 2.0.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-full btn-primary text-sm font-semibold text-white flex items-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Sign In to Existing Journey
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
