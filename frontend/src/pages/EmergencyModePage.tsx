import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  Shield,
  Heart,
  Phone,
  Building,
  CheckCircle2,
  Lock,
  Clock,
  ExternalLink,
  QrCode,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

interface EmergencyProfile {
  token: string;
  full_name: string;
  nationality: string;
  emergency_contact: string;
  blood_group?: string;
  allergies_medical_notes?: string;
  insurance_details?: string;
  embassy_info?: string;
  expires_at: string;
  is_active: boolean;
}

export const EmergencyModePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [nationality, setNationality] = useState('India');
  const [emergencyContact, setEmergencyContact] = useState('+91 98765 43210 (Father / Guardian)');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('Penicillin allergy; No dietary restrictions');
  const [insuranceDetails, setInsuranceDetails] = useState('Techniker Krankenkasse (TK) Policy #89218491');
  const [embassyInfo, setEmbassyInfo] = useState('Embassy of India, Berlin: Tiergartenstraße 17, Tel: +49 30 257950');
  const [durationDays, setDurationDays] = useState(30);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ profile: EmergencyProfile | null }>('/emergency/profile')
      .then(res => {
        if (res.profile) setProfile(res.profile);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await api.post<{ token: string; expiresAt: string; profile: EmergencyProfile }>('/emergency/profile', {
        fullName,
        nationality,
        emergencyContact,
        bloodGroup,
        allergiesMedicalNotes: allergies,
        insuranceDetails,
        embassyInfo,
        durationDays,
      });

      setProfile({
        token: res.token,
        full_name: fullName,
        nationality,
        emergency_contact: emergencyContact,
        blood_group: bloodGroup,
        allergies_medical_notes: allergies,
        insurance_details: insuranceDetails,
        embassy_info: embassyInfo,
        expires_at: res.expiresAt,
        is_active: true,
      });

      setFeedback('MidBridge 2.0 Emergency Profile activated. Emergency QR is ready for offline wallet save.');
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to generate emergency card.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-red-400">
            Rapid Response & Consular Assistance
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">MidBridge 2.0 Emergency Mode</h1>
          <p className="text-xs sm:text-sm text-white/60">
            Generate a temporary emergency profile and offline QR token containing only voluntary medical, contact, and consular reference data.
          </p>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form: Voluntary Data Input */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Configure Emergency Data</span>
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1 font-medium">Nationality</label>
                  <input
                    type="text"
                    required
                    value={nationality}
                    onChange={e => setNationality(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 mb-1 font-medium">Primary Emergency Contact (Phone & Relation)</label>
                <input
                  type="text"
                  required
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 mb-1 font-medium">Blood Group (Voluntary)</label>
                  <input
                    type="text"
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    placeholder="e.g. O+, A-, B+"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1 font-medium">Token Duration</label>
                  <select
                    value={durationDays}
                    onChange={e => setDurationDays(parseInt(e.target.value, 10))}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value={7}>7 Days (Short Trip)</option>
                    <option value={30}>30 Days (Standard Departure)</option>
                    <option value={90}>90 Days (Semester Transition)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/70 mb-1 font-medium">Allergies & Critical Medical Notes (Voluntary)</label>
                <textarea
                  rows={2}
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin allergy, Asthma inhaler required"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1 font-medium">Emergency Health Insurance Policy</label>
                <input
                  type="text"
                  value={insuranceDetails}
                  onChange={e => setInsuranceDetails(e.target.value)}
                  placeholder="Policy number and 24/7 assistance phone"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1 font-medium">Nearest Embassy / Consular Mission Reference</label>
                <input
                  type="text"
                  value={embassyInfo}
                  onChange={e => setEmbassyInfo(e.target.value)}
                  placeholder="Embassy address and hotline"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-full btn-primary text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-xl"
              >
                <span>{saving ? 'Generating QR Token...' : 'Save & Activate Emergency Profile'}</span>
              </button>
            </form>
          </div>

          {/* Right Card: Emergency QR Card Preview */}
          <div className="space-y-4">
            <div className="glass-strong rounded-3xl p-6 border border-white/15 shadow-2xl text-center space-y-4">
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">
                Emergency Medical QR
              </span>

              {profile?.token ? (
                <div className="bg-white p-3.5 rounded-2xl inline-block mx-auto shadow-2xl">
                  <QRCodeSVG
                    value={`${window.location.origin}/api/emergency/card/${profile.token}`}
                    size={170}
                    level="H"
                  />
                </div>
              ) : (
                <div className="h-44 w-44 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-xs text-white/40">
                  QR Generated Upon Save
                </div>
              )}

              <div className="space-y-1 text-left pt-2 text-xs border-t border-white/10">
                <div className="font-bold text-white truncate">{fullName}</div>
                <div className="text-white/60">Emergency Contact: <span className="text-white font-mono">{emergencyContact}</span></div>
                {bloodGroup && <div className="text-white/60">Blood Group: <span className="text-red-400 font-bold">{bloodGroup}</span></div>}
              </div>

              <p className="text-[11px] text-white/40 italic leading-snug">
                First responders or hospital intake staff scanning this QR can immediately access your emergency contact, blood group, and insurance hotline without unlocking your device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
