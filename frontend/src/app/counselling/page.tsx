'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, ArrowUp, ArrowDown, Trash2, ShieldAlert, Sparkles, Download, CheckCircle2, AlertTriangle, Plus, Heart } from 'lucide-react';
import { counsellingService, wishlistService, profileService } from '../../lib/api';
import { jsPDF } from 'jspdf';

interface CounsellingOption {
  collegeCode: string;
  branchCode: string;
  priority: number;
  collegeName: string;
  branchName: string;
  tuitionFee: number;
  averagePackage: number;
  placementPercentage: number;
  cutoffRank: number;
  probability: number;
  status: 'Dream' | 'Target' | 'Safe';
}

interface AnalyticsData {
  totalOptions: number;
  dreamCount: number;
  targetCount: number;
  safeCount: number;
  seatChance: number;
  studentRank: number;
  studentCategory: string;
}

export default function CounsellingBoardPage() {
  const router = useRouter();

  const [options, setOptions] = useState<CounsellingOption[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load Counselling board, profile details, and wishlist on mount
  const loadCounsellingBoard = async () => {
    try {
      const data = await counsellingService.getBoard();
      setOptions(data.options || []);
      setAnalytics(data.analytics);
      setAiSuggestions(data.aiSuggestions || []);
      
      const wish = await wishlistService.getWishlist();
      setWishlistItems(wish || []);
    } catch (err: any) {
      setErrorMsg('Please log in and complete your academic profile to access your counselling board.');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCounsellingBoard();
  }, [router]);

  // Recalculate seat safety percentages locally when reordering or editing
  const runLocalCalculations = (currentOptions: CounsellingOption[]) => {
    let dreamCount = 0;
    let targetCount = 0;
    let safeCount = 0;
    let overallRiskMultiplier = 1.0;

    currentOptions.forEach((opt) => {
      if (opt.status === 'Safe') safeCount++;
      else if (opt.status === 'Target') targetCount++;
      else dreamCount++;

      overallRiskMultiplier *= (1.0 - (opt.probability / 100));
    });

    const seatChance = currentOptions.length > 0 ? Math.round((1.0 - overallRiskMultiplier) * 100) : 0;

    setAnalytics((prev) => prev ? {
      ...prev,
      totalOptions: currentOptions.length,
      dreamCount,
      targetCount,
      safeCount,
      seatChance
    } : null);

    // Dynamic AI Suggestions
    const suggestions: string[] = [];
    if (currentOptions.length === 0) {
      suggestions.push('Your counselling board is empty. Add colleges from the Predictor or Explorer to get started.');
    } else {
      if (safeCount === 0) {
        suggestions.push('Your options list is highly risky because it contains only Dream/Target colleges. Please add at least 3 Safe colleges to prevent blank allocation.');
      } else if (safeCount < 3) {
        suggestions.push(`You have only ${safeCount} Safe college(s). We recommend adding at least ${3 - safeCount} more Safe college(s) to guarantee a secure admission.`);
      }

      if (dreamCount > 0 && currentOptions[0].status !== 'Dream') {
        suggestions.push('Counselling Tip: Place your Dream colleges (like CBIT, Vasavi, VNR) at the top of your priority list. Since EAPCET matches from top to bottom, putting a Safe college first prevents you from even being considered for higher-tier Dream colleges.');
      }

      if (seatChance < 40) {
        suggestions.push('Warning: Your overall seat probability is very low. Please add colleges with cutoffs well above your rank.');
      } else if (seatChance >= 85) {
        suggestions.push('Excellent! Your counselling board is highly optimized and offers a secure pathway to admission. You have a well-balanced mix of Dream, Target, and Safe colleges.');
      }
    }
    setAiSuggestions(suggestions);
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= options.length) return;

    const newOptions = [...options];
    const temp = newOptions[index];
    newOptions[index] = newOptions[nextIndex];
    newOptions[nextIndex] = temp;

    // Rescale priorities
    newOptions.forEach((opt, idx) => {
      opt.priority = idx + 1;
    });

    setOptions(newOptions);
    runLocalCalculations(newOptions);
  };

  const deleteOption = (index: number) => {
    const newOptions = options.filter((_, idx) => idx !== index);
    
    // Rescale priorities
    newOptions.forEach((opt, idx) => {
      opt.priority = idx + 1;
    });

    setOptions(newOptions);
    runLocalCalculations(newOptions);
  };

  const handleSaveBoard = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = options.map((opt, idx) => ({
        collegeCode: opt.collegeCode,
        branchCode: opt.branchCode,
        priority: idx + 1
      }));
      await counsellingService.saveBoard(payload);
      setSuccessMsg('Counselling options saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save options list.');
    } finally {
      setIsSaving(false);
    }
  };

  const addFromWishlist = (wish: any) => {
    const exists = options.some(opt => opt.collegeCode === wish.collegeCode && opt.branchCode === wish.branchCode);
    if (exists) {
      setErrorMsg(`${wish.collegeCode} - ${wish.branchCode} is already on your counselling board.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const mockOption: CounsellingOption = {
      collegeCode: wish.collegeCode,
      branchCode: wish.branchCode,
      priority: options.length + 1,
      collegeName: wish.collegeName,
      branchName: wish.branchName,
      tuitionFee: wish.tuitionFee,
      averagePackage: wish.averagePackage,
      placementPercentage: wish.placementPercentage,
      cutoffRank: 0,
      probability: wish.placementPercentage > 90 ? 85 : 60,
      status: wish.placementPercentage > 90 ? 'Safe' : 'Target'
    };

    const nextOptions = [...options, mockOption];
    setOptions(nextOptions);
    runLocalCalculations(nextOptions);
  };

  const getProbColor = (prob: number) => {
    if (prob >= 70) return { bg: 'bg-[#FF6B35]', text: 'text-[#FF6B35]' };
    if (prob >= 30) return { bg: 'bg-[#E04F16]', text: 'text-[#E04F16]' };
    return { bg: 'bg-red-950/80 border border-red-800/30', text: 'text-red-400' };
  };

  const generatePDFReport = () => {
    if (options.length === 0) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(8, 8, 9); // dark charcoal
    doc.text('NextCareers Counselling Strategy Report', 14, 20);
    
    // Sub-header
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(120, 120, 125);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Candidate Rank: ${analytics?.studentRank.toLocaleString()} (Category: ${analytics?.studentCategory})`, 14, 28);
    
    // Overall Stats Box
    doc.setFillColor(248, 248, 250);
    doc.rect(14, 34, 182, 22, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(224, 79, 22); // Orange Accent
    doc.text('COUNSELLING STRATEGY SUMMARY', 18, 40);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 65);
    doc.text(`Total Options Filed: ${analytics?.totalOptions}`, 18, 47);
    doc.text(`Dream Options: ${analytics?.dreamCount}  |  Target Options: ${analytics?.targetCount}  |  Safe Options: ${analytics?.safeCount}`, 18, 52);
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(8, 8, 9);
    doc.text(`Overall Seat Probability: ${analytics?.seatChance}%`, 110, 48);

    // Options Table Header
    let currentY = 66;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(224, 79, 22); // Orange header
    doc.rect(14, currentY, 182, 7, 'F');
    doc.text('Priority', 16, currentY + 5);
    doc.text('College Code & Branch', 32, currentY + 5);
    doc.text('Est. Fee', 125, currentY + 5);
    doc.text('Avg Package', 150, currentY + 5);
    doc.text('Probability', 172, currentY + 5);

    // Options Table Content
    doc.setTextColor(60, 60, 65);
    doc.setFont('Helvetica', 'normal');
    
    options.forEach((opt, idx) => {
      currentY += 8;
      
      if (idx % 2 === 0) {
        doc.setFillColor(252, 251, 248);
        doc.rect(14, currentY, 182, 8, 'F');
      }
      
      doc.text(String(opt.priority), 18, currentY + 5);
      doc.text(`${opt.collegeCode} - ${opt.branchCode}`, 32, currentY + 5);
      doc.text(`Rs. ${opt.tuitionFee.toLocaleString()}`, 125, currentY + 5);
      doc.text(`${opt.averagePackage} LPA`, 150, currentY + 5);
      doc.text(`${opt.probability}% (${opt.status})`, 172, currentY + 5);
    });

    // AI Suggestions Section
    currentY += 16;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(8, 8, 9);
    doc.text('AI Recommendation Advice:', 14, currentY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 85);
    
    aiSuggestions.forEach((sug) => {
      currentY += 8;
      const splitText = doc.splitTextToSize(`• ${sug}`, 178);
      doc.text(splitText, 14, currentY);
      currentY += (splitText.length - 1) * 4;
    });

    // Disclaimer
    currentY += 16;
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 165);
    doc.text('Disclaimer: Seat predictions are calculated based on historical cutoffs. Admission results depend on final counseling rounds.', 14, currentY);

    // Save report file
    doc.save('nextcareers_counselling_board_report.pdf');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-2">
            <ClipboardList size={28} className="text-[#FF6B35]" />
            <span>Mock Counselling Board</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Build, prioritize, and analyze your official web options list.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={generatePDFReport}
            disabled={options.length === 0}
            className="px-4 py-2 premium-btn-secondary text-sm font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            <Download size={15} />
            <span>PDF Report</span>
          </button>

          <button
            onClick={handleSaveBoard}
            disabled={isSaving}
            className="px-6 py-2 premium-btn-primary flex items-center space-x-2 text-sm"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Save Web Options</span>
            )}
          </button>
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
          <ShieldAlert size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Options priority (Left) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6 rounded-3xl space-y-4">
            <h2 className="text-md font-bold text-white uppercase tracking-wider">Counselling Options Priority List</h2>
            
            {options.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-sm">
                No options added yet. Select colleges using the Predictor or add items from your Wishlist panel on the right.
              </div>
            ) : (
              <div className="space-y-3">
                {options.map((opt, idx) => {
                  const colors = getProbColor(opt.probability);
                  return (
                    <div
                      key={`${opt.collegeCode}_${opt.branchCode}`}
                      className="premium-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-2 border-l-[#E04F16]"
                    >
                      {/* Priority rank, title */}
                      <div className="flex items-center space-x-4">
                        <span className="w-8 h-8 rounded-full bg-zinc-950/60 border border-zinc-850 flex items-center justify-center font-extrabold text-[#FF6B35] text-sm shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-extrabold text-white">{opt.collegeCode}</span>
                            <span className="text-zinc-650">•</span>
                            <span className="text-xs font-semibold text-zinc-300">{opt.branchCode}</span>
                            <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                              opt.status === 'Safe' ? 'premium-badge' : opt.status === 'Target' ? 'bg-[#E04F16]/10 border border-[#E04F16]/30 text-[#E04F16]' : 'premium-badge-muted'
                            }`}>
                              {opt.status}
                            </span>
                          </div>
                          <h4 className="text-xs text-zinc-400 leading-tight mt-0.5 truncate max-w-sm sm:max-w-md">
                            {opt.collegeName}
                          </h4>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Tuition: ₹{opt.tuitionFee.toLocaleString()}/Y | Placements: {opt.placementPercentage}% (Avg: {opt.averagePackage} LPA)
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0 shrink-0">
                        {/* Probability */}
                        <div className="text-right space-y-1">
                          <span className={`text-xs font-extrabold block ${colors.text}`}>{opt.probability}% Chance</span>
                          <div className="w-20 bg-zinc-950 rounded-full h-1 overflow-hidden border border-zinc-900">
                            <div className={`h-full ${colors.bg} rounded-full`} style={{ width: `${opt.probability}%` }} />
                          </div>
                        </div>

                        {/* Reordering */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => moveOption(idx, 'up')}
                            disabled={idx === 0}
                            className="w-7 h-7 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:hover:bg-zinc-950 text-zinc-400 hover:text-white"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveOption(idx, 'down')}
                            disabled={idx === options.length - 1}
                            className="w-7 h-7 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:hover:bg-zinc-950 text-zinc-400 hover:text-white"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => deleteOption(idx)}
                            className="w-7 h-7 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 hover:text-red-200 rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* AI Suggestions & Wishlist shortcut (Right) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* AI recommendations */}
          <div className="premium-card p-6 rounded-3xl space-y-6">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center space-x-1.5">
              <Sparkles size={14} className="text-[#FF6B35]" />
              <span>Smart AI Counselling</span>
            </h3>

            {/* Safety Dial */}
            <div className="text-center py-4 space-y-2">
              <div className="inline-flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 border-[#E04F16]/20 relative">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full border-4 border-[#FF6B35]/80 shadow-[0_0_15px_rgba(255,107,53,0.25)]" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${analytics?.seatChance || 0}%, 0 ${analytics?.seatChance || 0}%)` }} />
                <span className="text-3xl font-extrabold text-white">{analytics?.seatChance || 0}%</span>
                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Seat Chance</span>
              </div>
            </div>

            {/* Suggestions Alerts */}
            <div className="space-y-4">
              {aiSuggestions.map((sug, idx) => {
                const isWarning = sug.includes('highly risky') || sug.includes('overall seat probability') || sug.includes('Warning');
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs flex items-start space-x-2 border ${
                      isWarning
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                        : 'bg-zinc-950/60 border-zinc-850 text-zinc-300'
                    }`}
                  >
                    {isWarning ? (
                      <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 size={15} className="text-[#FF6B35] shrink-0 mt-0.5" />
                    )}
                    <p className="leading-relaxed">{sug}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Wishlist additions */}
          <div className="premium-card p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center space-x-1.5 border-b border-zinc-800 pb-3">
              <Heart size={14} className="text-[#FF6B35] fill-current" />
              <span>Wishlist Selections</span>
            </h3>

            {wishlistItems.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs leading-relaxed">
                Your wishlist is empty. Save colleges in the explorer to add them to this quick menu.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {wishlistItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-zinc-950/60 border border-zinc-850 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5 font-bold text-white">
                        <span>{item.collegeCode}</span>
                        <span className="text-zinc-650">-</span>
                        <span>{item.branchCode}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{item.collegeName}</p>
                    </div>
                    
                    <button
                      onClick={() => addFromWishlist(item)}
                      className="w-7 h-7 bg-[#FF6B35]/15 border border-[#FF6B35]/35 text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white rounded-lg flex items-center justify-center transition-all cursor-pointer"
                      title="Add to Counselling Board"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
