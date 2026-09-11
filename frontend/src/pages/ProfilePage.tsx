import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Globe, Compass, GraduationCap, Building, Calendar, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { useAuth } from '../context/AuthContext.js';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const profile = user?.profile;

  const [fullName, setFullName] = useState(profile?.full_name || user?.fullName || '');
  const [nationality, setNationality] = useState(profile?.nationality || 'India');
  const [currentCountry, setCurrentCountry] = useState(profile?.current_country || 'India');
  const [destinationCountry, setDestinationCountry] = useState(profile?.destination_country || 'Germany');
  const [purpose, setPurpose] = useState(profile?.purpose || 'Study');
  const [educationLevel, setEducationLevel] = useState(profile?.education_level || 'Master of Science');
  const [intendedCourse, setIntendedCourse] = useState(profile?.intended_course || 'Informatics & Data Science');
  const [institution, setInstitution] = useState(profile?.institution || 'Technical University of Munich');
  const [travelDate, setTravelDate] = useState(profile?.travel_date || '2026-10-01');
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || 'en');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setNationality(profile.nationality || 'India');
      setCurrentCountry(profile.current_country || 'India');
      setDestinationCountry(profile.destination_country || 'Germany');
      setPurpose(profile.purpose || 'Study');
      setEducationLevel(profile.education_level || '');
      setIntendedCourse(profile.intended_course || '');
      setInstitution(profile.institution || '');
      setTravelDate(profile.travel_date || '');
      setPreferredLanguage(profile.preferred_language || 'en');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        full_name: fullName,
        nationality,
        current_country: currentCountry,
        destination_country: destinationCountry,
        purpose,
        education_level: educationLevel,
        intended_course: intendedCourse,
        institution,
        travel_date: travelDate,
        preferred_language: preferredLanguage,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">MidBridge 2.0 Mobility Profile</h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Personal identity, academic credentials, and destination preferences for automated requirement generation.
          </p>
        </div>

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Profile successfully updated. Journey requirements will reflect any destination changes.</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          {/* Identity Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 font-mono flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-emerald-400" />
              <span>Identity & Account</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/70 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white/50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Relocation Direction */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 font-mono flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" />
              <span>Cross-Border Direction</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-white/70 mb-1">Passport Nationality</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Current Residence</label>
                <input
                  type="text"
                  value={currentCountry}
                  onChange={e => setCurrentCountry(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Target Destination</label>
                <input
                  type="text"
                  value={destinationCountry}
                  onChange={e => setDestinationCountry(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Purpose & Academics */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 font-mono flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-400" />
              <span>Purpose & Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/70 mb-1">Primary Purpose</label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                >
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="Immigration">Immigration</option>
                  <option value="Research">Research</option>
                  <option value="Exchange">Exchange</option>
                  <option value="Travel">Travel</option>
                  <option value="Family relocation">Family relocation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Target Institution or Employer</label>
                <input
                  type="text"
                  value={institution}
                  onChange={e => setInstitution(e.target.value)}
                  placeholder="e.g. Technical University of Munich"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Education Level / Degree Target</label>
                <input
                  type="text"
                  value={educationLevel}
                  onChange={e => setEducationLevel(e.target.value)}
                  placeholder="e.g. Master of Science"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Intended Travel Date</label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={e => setTravelDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full btn-primary text-xs font-semibold text-white flex items-center gap-2"
            >
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
