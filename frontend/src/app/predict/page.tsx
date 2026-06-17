'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Award, MapPin, Heart, BookOpen, IndianRupee, TrendingUp, AlertCircle } from 'lucide-react';
import { predictorService, wishlistService, profileService } from '../../lib/api';

interface CollegeResult {
  collegeCode: string;
  collegeName: string;
  district: string;
  place: string;
  coed: string;
  type: string;
  tuitionFee: number;
  autonomous: boolean;
  website: string;
  placementPercentage: number;
  averagePackage: number;
  highestPackage: number;
  branchCode: string;
  branchName: string;
  cutoffRank2025: number;
  cutoffRank2024: number;
  cutoffRank2023: number;
  averageCutoffRank: number;
  trend: number;
  probability: number;
  categoryMatched: string;
  genderMatched: string;
}

export default function PredictorPage() {
  // Input parameters
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('OC');
  const [gender, setGender] = useState('Male');
  
  // Results
  const [dreamList, setDreamList] = useState<CollegeResult[]>([]);
  const [targetList, setTargetList] = useState<CollegeResult[]>([]);
  const [safeList, setSafeList] = useState<CollegeResult[]>([]);
  
  // Wishlist set of "collegeCode_branchCode"
  const [wishlistKeys, setWishlistKeys] = useState<Map<string, string>>(new Map()); // Maps key -> wishlist itemId
  
  const [activeTab, setActiveTab] = useState<'dream' | 'target' | 'safe'>('target');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch student profile on mount to pre-populate inputs & fetch wishlist items
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Fetch Profile
        const prof = await profileService.getProfile();
        if (prof.profile) {
          setRank(String(prof.profile.rank));
          setCategory(prof.profile.category);
          setGender(prof.profile.gender);
          setIsProfileLoaded(true);
        }

        // Fetch Wishlist keys
        const wish = await wishlistService.getWishlist();
        const wishMap = new Map<string, string>();
        wish.forEach((item: any) => {
          wishMap.set(`${item.collegeCode}_${item.branchCode}`, item._id);
        });
        setWishlistKeys(wishMap);
      } catch (err) {
        console.error('Failed to load profile details:', err);
      }
    };

    loadData();
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!rank) {
      setErrorMsg('Please enter your TG EAPCET rank');
      return;
    }

    setIsLoading(true);

    try {
      const dbGender = gender === 'Female' ? 'GIRLS' : 'BOYS';
      const data = await predictorService.predict({
        rank: Number(rank),
        category,
        gender: dbGender
      });

      setDreamList(data.dream);
      setTargetList(data.target);
      setSafeList(data.safe);

      // Auto focus tab with contents
      if (data.target.length > 0) {
        setActiveTab('target');
      } else if (data.safe.length > 0) {
        setActiveTab('safe');
      } else {
        setActiveTab('dream');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze ranks. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWishlist = async (collegeCode: string, branchCode: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('Please log in or sign up to add colleges to your wishlist.');
      return;
    }

    const key = `${collegeCode}_${branchCode}`;
    const existingId = wishlistKeys.get(key);

    try {
      if (existingId) {
        // Remove from wishlist
        await wishlistService.deleteFromWishlist(existingId);
        setWishlistKeys((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      } else {
        // Add to wishlist
        const newItem = await wishlistService.addToWishlist({ collegeCode, branchCode });
        setWishlistKeys((prev) => {
          const next = new Map(prev);
          next.set(key, newItem._id);
          return next;
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update wishlist.');
    }
  };

  // Helper to determine probability bar color
  const getProbColor = (prob: number) => {
    if (prob >= 70) return { bar: 'bg-[#FF6B35]', text: 'text-[#FF6B35]' }; // Safe Coral
    if (prob >= 30) return { bar: 'bg-[#E04F16]', text: 'text-[#E04F16]' }; // Target Bronze Orange
    return { bar: 'bg-red-950/80 border border-red-800/30', text: 'text-red-400' }; // Dream Red
  };

  const currentList = activeTab === 'dream' ? dreamList : activeTab === 'target' ? targetList : safeList;

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold text-white">College Predictor</h1>
        <p className="text-zinc-500 text-sm">
          Run our cutoff matching engine to analyze your admission chances instantly.
        </p>
      </div>

      {errorMsg && (
        <div className="max-w-4xl mx-auto bg-red-500/10 border border-red-500/25 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Form */}
      <div className="premium-card p-6 rounded-3xl max-w-4xl mx-auto">
        <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">EAPCET Rank</label>
            <div className="relative">
              <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="number"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                placeholder="Enter Rank"
                className="w-full premium-input pl-9 pr-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full premium-input px-3 py-2 text-sm text-white"
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
              className="w-full premium-input px-3 py-2 text-sm text-white"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full premium-btn-primary py-2 text-sm font-bold flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sliders size={15} />
                <span>Match Ranks</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Tabs Menu */}
      {(dreamList.length > 0 || targetList.length > 0 || safeList.length > 0) && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex border-b border-zinc-800 text-sm">
            <button
              onClick={() => setActiveTab('dream')}
              className={`flex-1 py-3 text-center font-bold transition-all border-b-2 ${
                activeTab === 'dream' ? 'border-[#FF6B35] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Dream ({dreamList.length})
            </button>
            <button
              onClick={() => setActiveTab('target')}
              className={`flex-1 py-3 text-center font-bold transition-all border-b-2 ${
                activeTab === 'target' ? 'border-[#FF6B35] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Target ({targetList.length})
            </button>
            <button
              onClick={() => setActiveTab('safe')}
              className={`flex-1 py-3 text-center font-bold transition-all border-b-2 ${
                activeTab === 'safe' ? 'border-[#FF6B35] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Safe ({safeList.length})
            </button>
          </div>

          {/* Cards Grid */}
          {currentList.length === 0 ? (
            <div className="text-center py-12 premium-card rounded-3xl text-zinc-500 text-sm">
              No matching colleges found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentList.map((col, idx) => {
                const isSaved = wishlistKeys.has(`${col.collegeCode}_${col.branchCode}`);
                const colors = getProbColor(col.probability);
                
                return (
                  <div key={idx} className="premium-card p-6 rounded-2xl flex flex-col justify-between space-y-6 transition-all border-l-4 border-l-[#E04F16]/50 hover:border-l-[#FF6B35] premium-card-hover">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                            {col.type} • {col.autonomous ? 'AUTONOMOUS' : 'AFFILIATED'}
                          </span>
                          <span className="text-[10px] bg-[#FF6B35]/15 border border-[#FF6B35]/35 text-[#FF6B35] px-2 py-0.5 rounded-full uppercase font-bold tracking-widest">
                            {col.collegeCode}
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-md mt-1 leading-tight">{col.collegeName}</h3>
                        <div className="flex items-center space-x-1 text-zinc-500 text-xs mt-1">
                          <MapPin size={12} />
                          <span>{col.place}, {col.district}</span>
                        </div>
                      </div>

                      {/* Heart Wishlist Trigger */}
                      <button
                        onClick={() => toggleWishlist(col.collegeCode, col.branchCode)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                            : 'bg-zinc-950/45 border-zinc-800 text-zinc-500 hover:text-[#FF6B35] hover:border-[#FF6B35]/30'
                        }`}
                      >
                        <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Branch Info */}
                    <div className="flex items-center space-x-2 text-zinc-400 text-sm">
                      <BookOpen size={14} className="text-[#FF6B35]" />
                      <span className="font-semibold">{col.branchCode}</span>
                      <span className="text-zinc-500">-</span>
                      <span className="text-xs truncate">{col.branchName}</span>
                    </div>

                    {/* Placements & Fee */}
                    <div className="border-t border-zinc-850 pt-4 grid grid-cols-3 gap-2 text-center text-xs divide-x divide-zinc-850">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">Highest Package</span>
                        <span className="text-[#FF6B35] font-bold">{col.highestPackage} LPA</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">Average Package</span>
                        <span className="text-zinc-300 font-bold">{col.averagePackage} LPA</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">Tuition Fee</span>
                        <span className="text-zinc-300 font-bold flex items-center justify-center">
                          <IndianRupee size={10} />
                          <span>{col.tuitionFee.toLocaleString()}/Y</span>
                        </span>
                      </div>
                    </div>

                    {/* Cutoffs & Trends */}
                    <div className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-xl flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center space-x-1.5">
                        <TrendingUp size={13} className="text-[#FF6B35]" />
                        <span>2025 Cutoff: <strong>{col.cutoffRank2025 ? col.cutoffRank2025.toLocaleString() : 'N/A'}</strong></span>
                      </div>
                      <div>
                        <span>Trend: </span>
                        <span className={`font-bold ${col.trend < 0 ? 'text-emerald-500' : col.trend > 0 ? 'text-rose-500' : 'text-zinc-500'}`}>
                          {col.trend < 0 ? '↓' : col.trend > 0 ? '↑' : ''} {Math.abs(col.trend).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Probability Progress Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 uppercase font-bold tracking-wider">Admission Probability</span>
                        <span className={`font-extrabold ${colors.text}`}>{col.probability}%</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800/80">
                        <div className={`h-full ${colors.bar} rounded-full`} style={{ width: `${col.probability}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
