'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Heart, ClipboardList, ShieldAlert, Award, BarChart3, PieChart } from 'lucide-react';
import { adminService } from '../../lib/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface Metrics {
  totalStudents: number;
  totalSearches: number;
  totalWishlists: number;
  totalCounsellingBoards: number;
}

interface PreferredItem {
  code: string;
  name: string;
  count: number;
}

interface DistributionItem {
  category?: string;
  range?: string;
  count: number;
}

interface DashboardData {
  metrics: Metrics;
  distributions: {
    categoryDistribution: DistributionItem[];
    rankDistribution: DistributionItem[];
    preferredColleges: PreferredItem[];
    preferredBranches: PreferredItem[];
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await adminService.getDashboardStats();
        setData(stats);
      } catch (err: any) {
        setErrorMsg('Access Denied: Administrative credentials are required.');
        setTimeout(() => router.push('/'), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  // Chart Palette matching the updated orange/deep-black theme
  const COLORS = ['#FF6B35', '#E04F16', '#C03E0B', '#F2EFE9', '#2E2E33', '#4B4B52'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-4">
        <div className="premium-card p-8 rounded-3xl space-y-4">
          <ShieldAlert size={48} className="text-[#FF6B35] mx-auto" />
          <h2 className="text-xl font-bold text-white">Unauthorized Access</h2>
          <p className="text-zinc-500 text-xs leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const dists = data?.distributions;

  // Pie chart data formatter
  const categoryChartData = dists?.categoryDistribution.map((item) => ({
    name: item.category,
    value: item.count
  })) || [];

  const rankChartData = dists?.rankDistribution.map((item) => ({
    name: item.range,
    value: item.count
  })) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center space-x-2">
          <BarChart3 size={28} className="text-[#FF6B35]" />
          <span>Admin Dashboard</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          System analytics, student demographics, and seat selection metrics.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="premium-card p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center text-[#FF6B35]">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Students</span>
              <span className="text-2xl font-extrabold text-white">{metrics.totalStudents}</span>
            </div>
          </div>

          <div className="premium-card p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center text-[#FF6B35]">
              <Search size={20} />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Searches</span>
              <span className="text-2xl font-extrabold text-white">{metrics.totalSearches}</span>
            </div>
          </div>

          <div className="premium-card p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center text-[#FF6B35]">
              <Heart size={20} />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Wishlists</span>
              <span className="text-2xl font-extrabold text-white">{metrics.totalWishlists}</span>
            </div>
          </div>

          <div className="premium-card p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center text-[#FF6B35]">
              <ClipboardList size={20} />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Boards</span>
              <span className="text-2xl font-extrabold text-white">{metrics.totalCounsellingBoards}</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {dists && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Preferred College Branch Rankings */}
          <div className="premium-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-zinc-800 pb-3">
              <Award size={14} className="text-[#FF6B35]" />
              <span>Most Preferred Branches (Wishlist counts)</span>
            </h3>
            {dists.preferredBranches.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-500 text-xs">No data available</div>
            ) : (
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dists.preferredBranches}>
                    <XAxis dataKey="code" stroke="#52525b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0a0a0c', border: '1px solid rgba(255, 107, 53, 0.1)', color: '#F2EFE9' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {dists.preferredBranches.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Category distribution */}
          <div className="premium-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-zinc-800 pb-3">
              <PieChart size={14} className="text-[#FF6B35]" />
              <span>Category Distribution</span>
            </h3>
            {categoryChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-500 text-xs">No data available</div>
            ) : (
              <div className="h-64 grid grid-cols-1 sm:grid-cols-2 items-center">
                <div className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0a0a0c', border: '1px solid rgba(255, 107, 53, 0.1)', color: '#F2EFE9' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                {/* Labels legend */}
                <div className="space-y-2 max-h-56 overflow-y-auto px-4 text-xs">
                  {categoryChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-zinc-405 font-medium">{item.name}:</span>
                      <span className="text-white font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chart 3: Most Preferred Colleges */}
          <div className="premium-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-zinc-800 pb-3">
              <Award size={14} className="text-[#FF6B35]" />
              <span>Top 5 Preferred Colleges (Wishlist counts)</span>
            </h3>
            {dists.preferredColleges.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-500 text-xs">No data available</div>
            ) : (
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dists.preferredColleges}>
                    <XAxis dataKey="code" stroke="#52525b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0a0a0c', border: '1px solid rgba(255, 107, 53, 0.1)', color: '#F2EFE9' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {dists.preferredColleges.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 4: Rank Distribution */}
          <div className="premium-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-zinc-800 pb-3">
              <PieChart size={14} className="text-[#FF6B35]" />
              <span>Rank Distribution (brackets)</span>
            </h3>
            {rankChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-500 text-xs">No data available</div>
            ) : (
              <div className="h-64 grid grid-cols-1 sm:grid-cols-2 items-center">
                <div className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={rankChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {rankChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0a0a0c', border: '1px solid rgba(255, 107, 53, 0.1)', color: '#F2EFE9' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                {/* Labels legend */}
                <div className="space-y-2 max-h-56 overflow-y-auto px-4 text-xs">
                  {rankChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-zinc-405 font-medium">{item.name}:</span>
                      <span className="text-white font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
