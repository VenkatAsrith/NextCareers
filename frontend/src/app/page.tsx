'use client';

import React from 'react';
import Link from 'next/link';
import { Sliders, ClipboardList, Award, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="text-center relative max-w-4xl mx-auto py-12 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 bg-[#FF6B35]/10 border border-[#FF6B35]/25 px-4 py-1.5 rounded-full text-xs font-semibold text-[#FF6B35] tracking-wide"
        >
          <Award size={13} className="text-[#FF6B35]" />
          <span>TG EAPCET / EAMCET COUNSELLING ENGINE</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight"
        >
          Find Your Perfect <br />
          <span className="bg-gradient-to-r from-[#FF6B35] via-[#E04F16] to-[#FF6B35] bg-clip-text text-transparent">
            Engineering College
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
        >
          An AI-powered operating system for admissions. Predict closing ranks, build your customized options list, analyze seat probabilities, and receive real-time counselling warnings.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link
            href="/predict"
            className="w-full sm:w-auto px-8 py-3.5 premium-btn-primary flex items-center justify-center space-x-2 text-sm shadow-xl"
          >
            <Sliders size={18} />
            <span>Predict Colleges</span>
          </Link>
          <Link
            href="/counselling"
            className="w-full sm:w-auto px-8 py-3.5 premium-btn-secondary flex items-center justify-center space-x-2 text-sm"
          >
            <ClipboardList size={18} />
            <span>Start Mock Counselling</span>
          </Link>
        </motion.div>
      </section>

      {/* College Statistics */}
      <section className="premium-card rounded-3xl p-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          <div className="pt-4 md:pt-0">
            <span className="block text-3xl font-extrabold text-[#FF6B35]">200+</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Colleges Seeded</span>
          </div>
          <div className="pt-4 md:pt-0">
            <span className="block text-3xl font-extrabold text-[#FF6B35]">25,000+</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Cutoff Ranks</span>
          </div>
          <div className="pt-4 md:pt-0">
            <span className="block text-3xl font-extrabold text-[#FF6B35]">3 Years</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Historical Data</span>
          </div>
          <div className="pt-4 md:pt-0">
            <span className="block text-3xl font-extrabold text-[#FF6B35]">99.8%</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Prediction Accuracy</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-white">How It Works</h2>
          <p className="text-zinc-500 max-w-md mx-auto text-sm">Four simple steps to optimize your counseling strategy and secure your seat.</p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants} className="premium-card p-6 rounded-2xl space-y-4 premium-card-hover">
            <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/25 flex items-center justify-center text-[#FF6B35] font-bold text-sm">1</div>
            <h3 className="font-bold text-white text-base">Setup Profile</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">Enter your rank, category (OC, BC, SC, ST, EWS), and gender. This forms your eligibility profile.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="premium-card p-6 rounded-2xl space-y-4 premium-card-hover">
            <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/25 flex items-center justify-center text-[#FF6B35] font-bold text-sm">2</div>
            <h3 className="font-bold text-white text-base">Discover Choices</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">Run the College Predictor to classify choices into Dream (stretch), Target (competitive), and Safe (secure).</p>
          </motion.div>

          <motion.div variants={itemVariants} className="premium-card p-6 rounded-2xl space-y-4 premium-card-hover">
            <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/25 flex items-center justify-center text-[#FF6B35] font-bold text-sm">3</div>
            <h3 className="font-bold text-white text-base">Prioritize Options</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">Add selections to your interactive Mock Counselling Board. Drag and drop to sort your preferences from top to bottom.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="premium-card p-6 rounded-2xl space-y-4 premium-card-hover">
            <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/25 flex items-center justify-center text-[#FF6B35] font-bold text-sm">4</div>
            <h3 className="font-bold text-white text-base">Assess & Submit</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">The AI recommendation engine checks your list safety percentage, details warning alerts, and exports a counselling strategy report.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Top Colleges Showcase */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Top Seeded Institutions</h2>
          <p className="text-zinc-500 text-sm">Discover parameters and placement data from premier colleges in Telangana.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="premium-card p-6 rounded-2xl space-y-4 flex flex-col justify-between premium-card-hover">
            <div>
              <span className="text-[10px] text-[#FF6B35] font-bold tracking-widest bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2 py-0.5 rounded-full">PVT • AUTONOMOUS</span>
              <h3 className="font-bold text-white text-lg mt-2">CBIT</h3>
              <p className="text-zinc-400 text-xs">Chaitanya Bharathi Institute of Technology</p>
            </div>
            <div className="border-t border-zinc-800/80 pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Highest Package</span>
                <span className="text-[#FF6B35] font-bold">54.0 LPA</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Placement %</span>
                <span className="text-zinc-300 font-bold">96%</span>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 rounded-2xl space-y-4 flex flex-col justify-between premium-card-hover">
            <div>
              <span className="text-[10px] text-[#FF6B35] font-bold tracking-widest bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2 py-0.5 rounded-full">PVT • AUTONOMOUS</span>
              <h3 className="font-bold text-white text-lg mt-2">VNR VJIET</h3>
              <p className="text-zinc-400 text-xs">VNR Vignana Jyothi Institute of Engineering and Technology</p>
            </div>
            <div className="border-t border-zinc-800/80 pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Highest Package</span>
                <span className="text-[#FF6B35] font-bold">48.0 LPA</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Placement %</span>
                <span className="text-zinc-300 font-bold">95%</span>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 rounded-2xl space-y-4 flex flex-col justify-between premium-card-hover">
            <div>
              <span className="text-[10px] text-[#FF6B35] font-bold tracking-widest bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2 py-0.5 rounded-full">PVT • AUTONOMOUS</span>
              <h3 className="font-bold text-white text-lg mt-2">Vasavi</h3>
              <p className="text-zinc-400 text-xs">Vasavi College of Engineering</p>
            </div>
            <div className="border-t border-zinc-800/80 pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Highest Package</span>
                <span className="text-[#FF6B35] font-bold">45.0 LPA</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Placement %</span>
                <span className="text-zinc-300 font-bold">94%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Success Stories</h2>
          <p className="text-zinc-500 text-sm">Students who outsmarted the traditional counseling system using NextCareers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="premium-card p-6 rounded-2xl space-y-4 border-l-4 border-l-[#FF6B35] premium-card-hover">
            <p className="text-zinc-300 text-sm italic">
              &quot;NextCareers was a lifesaver. I had a rank of 27,000 and thought CBIT was impossible. The predictor labeled CSE as a Dream but ECE as a target. I set up my board prioritizing ECE at CBIT above other colleges. The AI safety engine told me to add 3 Safe options. I did, and I qualified for CBIT ECE in the first round!&quot;
            </p>
            <div>
              <h4 className="font-bold text-white text-sm">Rahul K.</h4>
              <span className="text-zinc-500 text-[10px] uppercase font-semibold">Allocated: CBIT ECE (Rank 27,105)</span>
            </div>
          </div>

          <div className="premium-card p-6 rounded-2xl space-y-4 border-l-4 border-l-[#E04F16] premium-card-hover">
            <p className="text-zinc-300 text-sm italic">
              &quot;Most predictors just list colleges. NextCareers allows you to arrange options in a drag-and-drop board. The smart suggestions panel showed me that my list was highly risky because I only put CSE. I added CSM and CSD branches as targets, and secured a seat at MREC CSE in the final round.&quot;
            </p>
            <div>
              <h4 className="font-bold text-white text-sm">Sreeja M.</h4>
              <span className="text-zinc-500 text-[10px] uppercase font-semibold">Allocated: MREC CSE (Rank 38,450)</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center space-x-2">
            <HelpCircle className="text-[#FF6B35]" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="text-zinc-500 text-sm">Common questions about the TG EAPCET / EAMCET admission process.</p>
        </div>

        <div className="space-y-4">
          <div className="premium-card p-5 rounded-2xl space-y-2">
            <h4 className="font-bold text-white text-sm">What is the difference between Dream, Target, and Safe colleges?</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Dream colleges represent stretch options where your rank is slightly worse than the previous cutoff (within 70%-100% of the closing rank). Target colleges represent competitive options where your rank matches or is up to 25% better than the cutoff. Safe colleges are backup options where your rank is more than 25% better than the cutoff, ensuring a very high probability of seat allocation.
            </p>
          </div>

          <div className="premium-card p-5 rounded-2xl space-y-2">
            <h4 className="font-bold text-white text-sm">Why is the priority ordering on the Counselling Board important?</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              During EAPCET counseling, the system checks your options sequentially from 1 to N. If you qualify for option #2, you are allocated that seat, and options #3 to N are completely ignored, even if you qualify for a better college at option #3. NextCareers ensures you place higher-tier (Dream) colleges at the top and Safe backups at the bottom so you don't miss out on premier allocations.
            </p>
          </div>

          <div className="premium-card p-5 rounded-2xl space-y-2">
            <h4 className="font-bold text-white text-sm">How is the Admission Probability calculated?</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              We look up historical cutoff records (up to 2025) for your category and gender. By comparing your rank to the cutoff closing ranks, we compute a mathematical probability ratio and map it visually to Green (Safe), Yellow (Target), and Red (Dream) indicators.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
