import React, { useState } from 'react';
import { Plane, CheckCircle2, Circle, AlertCircle, Shield, FileCheck, ExternalLink, Calendar, Luggage } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { useJourney } from '../context/JourneyContext.js';

interface TravelCheckItem {
  id: string;
  title: string;
  desc: string;
  category: string;
  checked: boolean;
}

export const TravelPrepPage: React.FC = () => {
  const { activeJourney } = useJourney();

  const [checklist, setChecklist] = useState<TravelCheckItem[]>([
    { id: 't1', title: 'Passport Minimum Validity Check', desc: 'Valid for at least 6 months past intended return or study period with 2 blank pages.', category: 'IDENTITY', checked: true },
    { id: 't2', title: 'Physical Consular Visa Vignette', desc: 'Printed and attached firmly inside passport with biometric barcode clearly readable.', category: 'IMMIGRATION', checked: true },
    { id: 't3', title: 'Printed Admission / Offer Package', desc: 'Physical original copies of Zulassungsbescheid or contract for airport immigration border police.', category: 'ACADEMIC', checked: false },
    { id: 't4', title: 'Statutory Health Insurance Letter', desc: 'Insurance certificate showing active coverage starting from scheduled departure date.', category: 'HEALTH', checked: false },
    { id: 't5', title: 'Sperrkonto / Financial Solvency Receipt', desc: 'Official escrow confirmation or bank liquidity proof to present at passport control.', category: 'FINANCIAL', checked: false },
    { id: 't6', title: 'Currency & Cash Declarations', desc: 'Awareness of cash carrying limit (e.g. max €10,000 without customs declaration in EU).', category: 'CUSTOMS', checked: false },
    { id: 't7', title: 'Emergency Profile QR Card Saved Offline', desc: 'MidBridge 2.0 offline emergency token saved to digital wallet for medical or consular contact.', category: 'EMERGENCY', checked: true },
  ]);

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const completedCount = checklist.filter(i => i.checked).length;
  const percentage = Math.round((completedCount / checklist.length) * 100);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            Pre-Departure Readiness
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Travel Preparation Protocol</h1>
          <p className="text-xs sm:text-sm text-white/60">
            Critical documents to carry in hand luggage, flight border inspection rules, and statutory health mandates.
          </p>
        </div>

        {/* Readiness Meter Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase text-white/50">Travel Boarding Readiness</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2 font-silkscreen">
              <span>{percentage}% COMPLETE</span>
            </div>
            <p className="text-xs text-white/60">{completedCount} of {checklist.length} essential flight criteria checked</p>
          </div>

          <div className="w-full sm:w-64">
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        </div>

        {/* Hand Luggage Carrying Warning */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <Luggage className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300">BORDER CONTROL REQUIREMENT:</span>
            <p className="text-[11px] leading-relaxed">
              NEVER pack your original passport, visa vignette, university admission letters, or blocked account confirmations into checked baggage. Border officers require immediate inspection at airport immigration.
            </p>
          </div>
        </div>

        {/* Interactive Checklist */}
        <div className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Essential Pre-Departure Checklist</span>
          </h3>

          <div className="space-y-3">
            {checklist.map(item => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  item.checked
                    ? 'bg-emerald-950/20 border-emerald-800/30 text-white'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-white/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${item.checked ? 'line-through text-white/60' : 'text-white'}`}>
                      {item.title}
                    </span>
                    <span className="text-[9px] font-mono text-white/50 px-1.5 py-0.5 rounded bg-white/5 uppercase">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
                </div>

                <div className="flex-shrink-0 mt-1">
                  {item.checked ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-white/30" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
