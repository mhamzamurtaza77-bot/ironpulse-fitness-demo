import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Dumbbell, Mic, ShieldCheck } from 'lucide-react';
import { HERO_IMAGE } from '../data/fitnessData';

interface HeroSectionProps {
  onOpenCoach: () => void;
}

export function HeroSection({ onOpenCoach }: HeroSectionProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-20 border-b border-white/10"
    >
      {/* Subtle architectural obsidian & lime/gold ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 w-[520px] h-[520px] rounded-full bg-[#C8F135]/6 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-20 right-0 w-[440px] h-[440px] rounded-full bg-[#D4AF37]/8 blur-[140px]"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* 2-Column Hero Split with Balanced Alignment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Copy Column */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-center"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-[#D4AF37] mb-5">
              <span>London Mayfair</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span>Lahore Gulberg III</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-300">Strength &amp; Recovery Studio</span>
            </div>

            <h1
              className="font-display font-extrabold tracking-tight text-white leading-[1.02] mb-6"
              style={{
                fontSize: 'clamp(2.65rem, 4.8vw, 4.35rem)',
                textWrap: 'balance',
              }}
            >
              Stronger body. Sharper mind.{' '}
              <span className="text-[#C8F135]">Built around you.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-8">
              Modern strength training, personal coaching, and group classes with 24/7 AI
              fitness support. Claim your free trial pass in seconds.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#trial-booking"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-bold rounded-xl bg-[#C8F135] text-[#090D16] hover:bg-[#d8fb54] transition-transform duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135]"
              >
                <span>Claim Free 3-Day Trial</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={onOpenCoach}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-semibold rounded-xl bg-[#121929] text-white border border-white/15 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              >
                <Mic className="w-4 h-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                <span>Ask 24/7 AI Fitness Coach</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-400">
              <span>No joining fees</span>
              <span aria-hidden="true">·</span>
              <span>Mon–Sat 05:30 – 23:00</span>
              <span aria-hidden="true">·</span>
              <span>Cedar Finnish Sauna Included</span>
            </div>
          </motion.div>

          {/* Right Architectural Visual + Floating Studio Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative flex flex-col"
          >
            <div className="relative flex-1 min-h-[340px] sm:min-h-[420px] rounded-2xl overflow-hidden border border-white/15 bg-[#0F1523]">
              {!heroImgFailed ? (
                <img
                  src={HERO_IMAGE}
                  alt="IronPulse Fitness Studio luxury obsidian strength floor with Olympic racks and warm gold lighting"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0F1624] via-[#151D2F] to-[#090D16] text-center">
                  <Dumbbell className="w-12 h-12 text-[#D4AF37] mb-3" />
                  <p className="font-display text-2xl font-bold text-white">
                    IronPulse Performance Floor
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    London Mayfair &amp; Lahore Gulberg III
                  </p>
                </div>
              )}

              {/* Contrast Scrim */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#090D16]/90 via-[#090D16]/25 to-transparent"
              />

              {/* Floating Card 1: Top-Right Architectural Metric */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden sm:flex absolute top-5 right-5 items-center gap-3 px-4 py-3 rounded-xl bg-[#090D16]/85 backdrop-blur-md border border-white/15"
              >
                <ShieldCheck className="w-5 h-5 text-[#C8F135] shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-white">3-Day Free Guest Pass</p>
                  <p className="text-[11px] text-slate-400">Strength Floor · Classes · Sauna</p>
                </div>
              </motion.div>

              {/* Bottom Overlay Caption */}
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-[#D4AF37] font-medium mb-1">
                    Flagship Training Environments
                  </p>
                  <p className="font-display text-xl sm:text-2xl font-bold text-white">
                    18 Calibrated Lifting Bays &amp; 85°C Sauna Suite
                  </p>
                </div>
                <div className="px-3.5 py-2 rounded-lg bg-[#090D16]/85 backdrop-blur-md border border-white/15">
                  <span className="font-mono-num text-sm font-semibold text-[#C8F135]">
                    05:30 – 23:00
                  </span>
                  <span className="text-xs text-slate-300 ml-2">Mon–Sat</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-Width 4-Column Studio Highlights Strip Below Split */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <div className="p-5 rounded-xl bg-[#0F1523] border border-white/10">
            <p className="font-mono-num text-2xl sm:text-3xl font-semibold text-[#C8F135]">
              18+
            </p>
            <p className="text-sm font-medium text-white mt-1">Olympic Squat Racks</p>
            <p className="text-xs text-slate-400 mt-0.5">Calibrated plates &amp; turf</p>
          </div>
          <div className="p-5 rounded-xl bg-[#0F1523] border border-white/10">
            <p className="font-mono-num text-2xl sm:text-3xl font-semibold text-[#D4AF37]">
              2 Cities
            </p>
            <p className="text-sm font-medium text-white mt-1">London &amp; Lahore</p>
            <p className="text-xs text-slate-400 mt-0.5">Mayfair &amp; Gulberg III</p>
          </div>
          <div className="p-5 rounded-xl bg-[#0F1523] border border-white/10">
            <p className="font-mono-num text-2xl sm:text-3xl font-semibold text-white">
              85°C
            </p>
            <p className="text-sm font-medium text-white mt-1">Cedar Finnish Sauna</p>
            <p className="text-xs text-slate-400 mt-0.5">Contrast rain showers</p>
          </div>
          <div className="p-5 rounded-xl bg-[#0F1523] border border-white/10">
            <p className="font-mono-num text-2xl sm:text-3xl font-semibold text-[#C8F135]">
              24/7
            </p>
            <p className="text-sm font-medium text-white mt-1">Voice AI Coach</p>
            <p className="text-xs text-slate-400 mt-0.5">English &amp; Urdu guidance</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
