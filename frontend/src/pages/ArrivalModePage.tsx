import React from 'react';
import { Home, Building2, CreditCard, Smartphone, Bus, ShieldAlert, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { useJourney } from '../context/JourneyContext.js';

export const ArrivalModePage: React.FC = () => {
  const { activeJourney } = useJourney();
  const destination = activeJourney?.to_country || 'Germany';

  const arrivalGuides = [
    {
      title: 'Municipal Address Registration (Anmeldung)',
      category: 'LEGAL MANDATE',
      icon: Building2,
      timeline: 'Within 14 Days of Move-In',
      desc: 'Book an appointment at the local Bürgeramt / City Hall. Bring your passport and the Wohnungsgeberbestätigung (landlord confirmation) to receive your official registration certificate (Meldebescheinigung).',
      url: 'https://service.berlin.de/dienstleistung/120686/'
    },
    {
      title: 'Blocked Account & Local Banking Activation',
      category: 'FINANCIAL SOLVENCY',
      icon: CreditCard,
      timeline: 'Days 1 - 7 Post-Arrival',
      desc: 'Open a local SEPA checking account (Girokonto). Submit your Meldebescheinigung and passport to unfreeze your blocked account monthly living disbursements (€992/month).',
      url: 'https://www.sparkasse.de'
    },
    {
      title: 'Local SIM Card & Telecommunications',
      category: 'CONNECTIVITY',
      icon: Smartphone,
      timeline: 'Day 1 Post-Arrival',
      desc: 'Purchase an eSIM or prepaid local SIM card (Telekom, Vodafone, O2). German telecommunications regulations require video ID verification with your passport.',
      url: 'https://telekom.de'
    },
    {
      title: 'Public Transit Pass (Deutschlandticket)',
      category: 'MOBILITY',
      icon: Bus,
      timeline: 'Prior to University Matriculation',
      desc: 'Most student semester contributions automatically cover regional and national regional trains via the discounted student Deutschlandticket (€29.40/month).',
      url: 'https://deutschlandticket.de'
    },
    {
      title: 'Residence Permit Electronic Card (eAT)',
      category: 'IMMIGRATION',
      icon: Home,
      timeline: '60 Days Prior to Visa Expiry',
      desc: 'Book an appointment with the local Foreigners Registration Office (Ausländerbehörde) to convert your 90-day national entry visa into a multi-year electronic residence permit card.',
      url: 'https://auslaenderbehoerde.de'
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            Post-Landing Operations Protocol
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Arrival Mode: {destination}</h1>
          <p className="text-xs sm:text-sm text-white/60">
            Step-by-step guidance for municipal address registration, blocked account unfreezing, and residence permits.
          </p>
        </div>

        {/* Emergency Contacts Banner */}
        <div className="p-4 rounded-3xl bg-red-950/20 border border-red-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-red-900/30 border border-red-800/50 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h4 className="font-bold text-red-300">Local Emergency Services</h4>
              <p className="text-white/60">Police: 110 • Medical / Fire Rescue: 112 • Non-Emergency Doctor: 116 117</p>
            </div>
          </div>
          <a
            href="/emergency"
            className="px-4 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-semibold self-start sm:self-auto hover:bg-red-500/30 transition-colors"
          >
            Open Emergency Profile
          </a>
        </div>

        {/* Arrival Guide Cards */}
        <div className="space-y-4">
          {arrivalGuides.map((guide, idx) => {
            const Icon = guide.icon;
            return (
              <div
                key={idx}
                className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 flex-shrink-0 mt-1">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">{guide.category}</span>
                      <span className="text-[10px] font-mono text-white/40">• {guide.timeline}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{guide.title}</h3>
                    <p className="text-xs text-white/70 leading-relaxed">{guide.desc}</p>
                  </div>
                </div>

                <a
                  href={guide.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center gap-1.5 whitespace-nowrap self-start md:self-center transition-colors"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};
