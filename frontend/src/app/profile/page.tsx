'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Award, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { profileService } from '../../lib/api';

export default function ProfilePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('OC');
  const [gender, setGender] = useState('Male');
  const [district, setDistrict] = useState('HYD');
  const [mobile, setMobile] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch student profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileService.getProfile();
        setName(res.name);
        setEmail(res.email);
        if (res.profile) {
          setRank(String(res.profile.rank));
          setCategory(res.profile.category);
          setGender(res.profile.gender);
          setDistrict(res.profile.district);
          setMobile(res.profile.mobile || '');
        }
      } catch (err: any) {
        setErrorMsg('Please log in to view your profile settings');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !rank) {
      setErrorMsg('Name and TG EAPCET Rank are required');
      return;
    }

    setIsSaving(true);

    try {
      const dbGender = gender === 'Female' ? 'GIRLS' : 'BOYS';
      await profileService.updateProfile({
        name,
        rank: Number(rank),
        category,
        gender: dbGender,
        district,
        mobile
      });

      setSuccessMsg('Profile updated successfully!');
      
      // Dispatch custom event to notify Navigation header of name change
      window.dispatchEvent(new Event('auth-change'));
      
      // Clear message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-6">
      <div className="premium-card p-8 rounded-3xl space-y-8 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6B35]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-3 border-b border-zinc-800 pb-4">
          <div className="w-12 h-12 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/25 flex items-center justify-center text-[#FF6B35]">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Student Profile</h2>
            <p className="text-zinc-500 text-xs">Complete your personal details for optimized counseling algorithms</p>
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">1. Account Credentials</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full premium-input pl-10 pr-4 py-2 text-sm text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Email Address (Read-Only)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-zinc-900 border border-zinc-850 text-zinc-550 rounded-xl px-4 py-2 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Academic Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">2. TG EAPCET Parameters</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">TG EAPCET Rank</label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                  <input
                    type="number"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full premium-input pl-10 pr-4 py-2 text-sm text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full premium-input px-4 py-2 text-sm text-white"
                >
                  <option value="OC">OC</option>
                  <option value="EWS">EWS</option>
                  <option value="BC_A">BC-A</option>
                  <option value="BC_B">BC-B</option>
                  <option value="BC_C">BC-C</option>
                  <option value="BC_D">BC-D</option>
                  <option value="BC_E">BC-E</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full premium-input px-4 py-2 text-sm text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Home District</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full premium-input pl-10 pr-4 py-2 text-sm text-white"
                  >
                    <option value="HYD">Hyderabad (HYD)</option>
                    <option value="MDL">Medchal (MDL)</option>
                    <option value="RR">Rangareddy (RR)</option>
                    <option value="WGL">Warangal (WGL)</option>
                    <option value="KHM">Khammam (KHM)</option>
                    <option value="NZB">Nizamabad (NZB)</option>
                    <option value="KRM">Karimnagar (KRM)</option>
                    <option value="SRD">Sangareddy (SRD)</option>
                    <option value="NLG">Nalgonda (NLG)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Mobile (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550" size={15} />
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full premium-input pl-10 pr-4 py-2 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 premium-btn-primary flex items-center justify-center space-x-2 text-sm"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
