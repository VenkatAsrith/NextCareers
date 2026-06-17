'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Search, Filter, MapPin, IndianRupee, Heart, ExternalLink, AlertCircle } from 'lucide-react';
import { collegeService, wishlistService } from '../../lib/api';

interface College {
  _id: string;
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
  branches: string[];
}

export default function ExplorerPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  
  // Available filters from API
  const [districts, setDistricts] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [availableBranches, setAvailableBranches] = useState<{ branchCode: string; branchName: string }[]>([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [autonomous, setAutonomous] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [minPlacement, setMinPlacement] = useState('');
  const [sort, setSort] = useState('bestMatch');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [wishlistKeys, setWishlistKeys] = useState<Map<string, string>>(new Map()); // Maps "collegeCode_branchCode" -> wishlist id

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch filter dropdown options and wishlist keys on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const filters = await collegeService.getFilters();
        setDistricts(filters.districts);
        setTypes(filters.types);
        setAvailableBranches(filters.branches);

        const token = localStorage.getItem('token');
        if (token) {
          const wish = await wishlistService.getWishlist();
          const wishMap = new Map<string, string>();
          wish.forEach((item: any) => {
            wishMap.set(`${item.collegeCode}_${item.branchCode}`, item._id);
          });
          setWishlistKeys(wishMap);
        }
      } catch (err) {
        console.error('Failed to load filter parameters:', err);
      }
    };

    initData();
  }, []);

  // Fetch colleges when page or filters change
  const fetchColleges = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await collegeService.getColleges({
        page,
        limit: 20,
        search,
        district: selectedDistrict,
        branch: selectedBranch,
        type: selectedType,
        autonomous: autonomous !== '' ? autonomous : undefined,
        maxFee: maxFee !== '' ? Number(maxFee) : undefined,
        minPlacement: minPlacement !== '' ? Number(minPlacement) : undefined,
        sort
      });

      setColleges(data.colleges);
      setTotalPages(data.pagination.pages);
      setTotalRecords(data.pagination.total);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch colleges. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [page, selectedDistrict, selectedBranch, selectedType, autonomous, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchColleges();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedDistrict('');
    setSelectedBranch('');
    setSelectedType('');
    setAutonomous('');
    setMaxFee('');
    setMinPlacement('');
    setSort('bestMatch');
    setPage(1);
  };

  const toggleWishlist = async (collegeCode: string, branchesList: string[]) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('Please log in or sign up to add items to your wishlist.');
      return;
    }

    let targetBranch = selectedBranch;
    if (!targetBranch) {
      if (branchesList.includes('CSE')) {
        targetBranch = 'CSE';
      } else if (branchesList.length > 0) {
        targetBranch = branchesList[0];
      } else {
        targetBranch = 'BRANCH';
      }
    }

    const key = `${collegeCode}_${targetBranch}`;
    const existingId = wishlistKeys.get(key);

    try {
      if (existingId) {
        await wishlistService.deleteFromWishlist(existingId);
        setWishlistKeys((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      } else {
        const newItem = await wishlistService.addToWishlist({ collegeCode, branchCode: targetBranch });
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

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-2">
            <Compass size={28} className="text-[#FF6B35]" />
            <span>College Explorer</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Search, filter, and compare all EAPCET colleges in Telangana.
          </p>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search college code or name..."
            className="flex-1 premium-input px-4 py-2 text-sm text-zinc-200"
          />
          <button
            type="submit"
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-sm transition-all hover:bg-zinc-805 font-semibold cursor-pointer"
          >
            <Search size={16} />
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 premium-card p-6 rounded-3xl space-y-6 h-fit">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <span className="font-bold text-white flex items-center space-x-1.5 text-sm">
              <Filter size={15} className="text-[#FF6B35]" />
              <span>Filters</span>
            </span>
            <button
              onClick={handleClearFilters}
              className="text-xs text-zinc-500 hover:text-[#FF6B35] transition-colors font-bold"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Sort Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-500 uppercase tracking-wider block">Sort By</label>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="w-full premium-input px-3 py-2 text-zinc-200"
              >
                <option value="bestMatch">Best Match (LPA)</option>
                <option value="highestPackage">Highest Package (LPA)</option>
                <option value="highestPlacement">Highest Placement (%)</option>
                <option value="lowestFee">Lowest Tuition Fee</option>
              </select>
            </div>

            {/* District Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-500 uppercase tracking-wider block">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => { setSelectedDistrict(e.target.value); setPage(1); }}
                className="w-full premium-input px-3 py-2 text-zinc-200"
              >
                <option value="">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-500 uppercase tracking-wider block">Specialty Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => { setSelectedBranch(e.target.value); setPage(1); }}
                className="w-full premium-input px-3 py-2 text-zinc-200"
              >
                <option value="">All Branches</option>
                {availableBranches.map((b) => (
                  <option key={b.branchCode} value={b.branchCode}>
                    {b.branchCode} - {b.branchName.replace(/\n/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* College Type Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-500 uppercase tracking-wider block">College Type</label>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                className="w-full premium-input px-3 py-2 text-zinc-200"
              >
                <option value="">All Types</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Autonomous Filter */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-500 uppercase tracking-wider block">Autonomous Status</label>
              <select
                value={autonomous}
                onChange={(e) => { setAutonomous(e.target.value); setPage(1); }}
                className="w-full premium-input px-3 py-2 text-zinc-200"
              >
                <option value="">All Statuses</option>
                <option value="true">Autonomous</option>
                <option value="false">Non-Autonomous</option>
              </select>
            </div>

            {/* Fee Filter Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-zinc-500 uppercase tracking-wider block">Max Fee ({maxFee ? `₹${Number(maxFee).toLocaleString()}` : 'Any'})</label>
              </div>
              <input
                type="range"
                min="0"
                max="160000"
                step="5000"
                value={maxFee || '160000'}
                onChange={(e) => { setMaxFee(e.target.value); setPage(1); }}
                className="w-full accent-[#FF6B35] cursor-pointer"
              />
            </div>

            {/* Placement % Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-zinc-500 uppercase tracking-wider block">Min Placement ({minPlacement ? `${minPlacement}%` : 'Any'})</label>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={minPlacement || '40'}
                onChange={(e) => { setMinPlacement(e.target.value); setPage(1); }}
                className="w-full accent-[#FF6B35] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Colleges List Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center text-xs text-zinc-500 px-2">
            <span>Showing {colleges.length} of {totalRecords} Colleges</span>
            <span>Page {page} of {totalPages}</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[40vh] premium-card rounded-3xl">
              <span className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : colleges.length === 0 ? (
            <div className="text-center py-20 premium-card rounded-3xl text-zinc-500 text-sm">
              No colleges match your active search filters. Try clearing filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {colleges.map((col, idx) => {
                let targetBranch = selectedBranch;
                if (!targetBranch) {
                  targetBranch = col.branches.includes('CSE') ? 'CSE' : col.branches[0] || 'BRANCH';
                }
                const isSaved = wishlistKeys.has(`${col.collegeCode}_${targetBranch}`);

                return (
                  <div key={idx} className="premium-card p-6 rounded-2xl flex flex-col justify-between space-y-6 transition-all border-l-4 border-l-[#E04F16]/50 hover:border-l-[#FF6B35] premium-card-hover">
                    {/* Top Row */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
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

                      {/* Wishlist Toggle */}
                      <button
                        onClick={() => toggleWishlist(col.collegeCode, col.branches)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                            : 'bg-zinc-950/45 border-zinc-800 text-zinc-500 hover:text-[#FF6B35] hover:border-[#FF6B35]/30'
                        }`}
                      >
                        <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Placements & Fees */}
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

                    {/* Branches Chips */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Offered Branches</span>
                      <div className="flex flex-wrap gap-1">
                        {col.branches.slice(0, 6).map((b) => (
                          <span
                            key={b}
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                              selectedBranch === b
                                ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                                : 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {b}
                          </span>
                        ))}
                        {col.branches.length > 6 && (
                          <span className="text-[9px] bg-zinc-950/40 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-bold">
                            +{col.branches.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* External Website */}
                    {col.website && (
                      <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-xs text-[#FF6B35] font-bold">
                        <span className="text-zinc-500">Co-Ed: {col.coed}</span>
                        <a
                          href={col.website.startsWith('http') ? col.website : `https://${col.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 hover:underline"
                        >
                          <span>Website</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 pt-6 text-sm">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 premium-btn-secondary text-sm font-semibold disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Previous
              </button>
              <span className="text-zinc-500 font-bold">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 premium-btn-secondary text-sm font-semibold disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
