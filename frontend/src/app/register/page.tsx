'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, KeyRound, User, Award, ArrowRight, AlertCircle } from 'lucide-react';
import { authService } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();

  // Onboarding Step state
  const [step, setStep] = useState(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Profile Fields
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('OC');
  const [gender, setGender] = useState('Male');
  const [district, setDistrict] = useState('HYD');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all basic fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rank) {
      setError('Please enter your EAPCET rank');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const dbGender = gender === 'Female' ? 'GIRLS' : 'BOYS';
      const res = await authService.register({
        name,
        email,
        password,
        role: 'student',
        rank: Number(rank),
        category,
        gender: dbGender,
        district
      });

      // Save token
      localStorage.setItem('token', res.token);

      // Dispatch custom event to notify Navigation header
      window.dispatchEvent(new Event('auth-change'));

      // Redirect to predictor page
      router.push('/predict');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="premium-card p-8 rounded-3xl space-y-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-zinc-400 text-xs">
            {step === 1 ? 'Step 1 of 2: Login Details' : 'Step 2 of 2: Academic Profile'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          /* Step 1: Login Details */
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-550" size={16} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full premium-input pl-11 pr-4 py-2.5 text-sm text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-550" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full premium-input pl-11 pr-4 py-2.5 text-sm text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-555" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full premium-input pl-11 pr-4 py-2.5 text-sm text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full premium-btn-primary py-2.5 flex items-center justify-center space-x-2 text-sm"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* Step 2: Academic Profile */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">TG EAPCET Rank</label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-550" size={16} />
                <input
                  type="number"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full premium-input pl-11 pr-4 py-2.5 text-sm text-white"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full premium-input px-4 py-2.5 text-sm text-white"
                  disabled={isLoading}
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
                  className="w-full premium-input px-4 py-2.5 text-sm text-white"
                  disabled={isLoading}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Home District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full premium-input px-4 py-2.5 text-sm text-white"
                disabled={isLoading}
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

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 text-center py-2.5 premium-btn-secondary text-sm"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 premium-btn-primary py-2.5 flex items-center justify-center space-x-2 text-sm"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Register</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="border-t border-zinc-800 pt-4 text-center">
          <p className="text-zinc-500 text-xs">
            Already have an account?{' '}
            <Link href="/login" className="text-[#FF6B35] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
