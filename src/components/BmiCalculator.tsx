import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Flame, MessageSquare, Scale } from 'lucide-react';

export type FitnessGoal = 'Fat Loss' | 'Muscle Gain' | 'Stay Fit';

interface BmiCalculatorProps {
  onAskCoachWithGoal: (summaryPrompt: string) => void;
}

export function BmiCalculator({ onAskCoachWithGoal }: BmiCalculatorProps) {
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(74);
  const [goal, setGoal] = useState<FitnessGoal>('Fat Loss');

  const stats = useMemo(() => {
    const safeHeight = Math.max(120, Math.min(230, Number(heightCm) || 175));
    const safeWeight = Math.max(35, Math.min(200, Number(weightKg) || 74));
    const heightM = safeHeight / 100;
    const bmi = safeWeight / (heightM * heightM);

    let category = 'Healthy Weight';
    let categoryTone = 'text-[#C8F135]';

    if (bmi < 18.5) {
      category = 'Underweight';
      categoryTone = 'text-sky-300';
    } else if (bmi < 25) {
      category = 'Healthy Weight';
      categoryTone = 'text-[#C8F135]';
    } else if (bmi < 30) {
      category = 'Overweight';
      categoryTone = 'text-[#D4AF37]';
    } else {
      category = 'High BMI Range';
      categoryTone = 'text-amber-400';
    }

    // Practical maintenance estimate (weight * 31 kcal for moderately active adult)
    const maintenanceCalories = Math.round(safeWeight * 31);

    let dailyCalories = maintenanceCalories;
    let proteinMultiplier = 1.7;
    let planNote = 'Balanced strength & cardiovascular maintenance.';

    if (goal === 'Fat Loss') {
      dailyCalories = Math.max(1350, maintenanceCalories - 420);
      proteinMultiplier = 2.0;
      planNote = '420 kcal daily deficit with high protein to protect lean muscle.';
    } else if (goal === 'Muscle Gain') {
      dailyCalories = maintenanceCalories + 300;
      proteinMultiplier = 2.1;
      planNote = '300 kcal lean surplus paired with 4 weekly hypertrophy sessions.';
    }

    const dailyProteinG = Math.round(safeWeight * proteinMultiplier);
    // Clamped 0–100 scale position for BMI 15–38
    const scalePercent = Math.max(4, Math.min(96, ((bmi - 15) / 23) * 100));

    return {
      bmi: bmi.toFixed(1),
      category,
      categoryTone,
      dailyCalories,
      dailyProteinG,
      planNote,
      scalePercent,
    };
  }, [heightCm, weightKg, goal]);

  return (
    <section
      id="bmi-calculator"
      className="py-16 sm:py-24 border-b border-white/10 bg-[#0B101B]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Explanation & Inputs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-[#0F1523] border border-white/10"
          >
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#D4AF37] mb-2">
                Interactive Body &amp; Nutrition Planner
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
                BMI &amp; Daily Calorie Calculator
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mb-8">
                Enter your height, weight, and primary goal for an instant BMI reading and
                daily calorie &amp; protein target.
              </p>

              {/* Height & Weight Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <label
                    htmlFor="bmi-height"
                    className="block text-xs font-semibold text-slate-300 mb-2"
                  >
                    Height (cm)
                  </label>
                  <input
                    id="bmi-height"
                    type="number"
                    min={120}
                    max={230}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-[#090D16] border border-white/15 text-white font-mono-num text-base focus:outline-none focus:border-[#C8F135] focus:ring-1 focus:ring-[#C8F135]"
                  />
                  <input
                    type="range"
                    min={130}
                    max={215}
                    value={Math.max(130, Math.min(215, heightCm || 175))}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    aria-label="Height slider in centimeters"
                    className="w-full mt-2 accent-[#C8F135] cursor-pointer"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bmi-weight"
                    className="block text-xs font-semibold text-slate-300 mb-2"
                  >
                    Weight (kg)
                  </label>
                  <input
                    id="bmi-weight"
                    type="number"
                    min={35}
                    max={200}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-[#090D16] border border-white/15 text-white font-mono-num text-base focus:outline-none focus:border-[#C8F135] focus:ring-1 focus:ring-[#C8F135]"
                  />
                  <input
                    type="range"
                    min={40}
                    max={150}
                    value={Math.max(40, Math.min(150, weightKg || 74))}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    aria-label="Weight slider in kilograms"
                    className="w-full mt-2 accent-[#C8F135] cursor-pointer"
                  />
                </div>
              </div>

              {/* Fitness Goal Segmented Buttons */}
              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-2">
                  Fitness Goal
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['Fat Loss', 'Muscle Gain', 'Stay Fit'] as FitnessGoal[]).map((item) => {
                    const active = goal === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setGoal(item)}
                        className={`px-3 py-3 text-xs sm:text-sm font-semibold rounded-xl border transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135] ${
                          active
                            ? 'bg-[#C8F135] text-[#090D16] border-[#C8F135]'
                            : 'bg-[#090D16] text-slate-300 border-white/15 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Live Output Panel */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-[#131B2E] border border-white/15 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">Your Live BMI Score</p>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono-num text-5xl sm:text-6xl font-semibold text-white">
                      {stats.bmi}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${stats.categoryTone}`}>
                      <Scale className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{stats.category}</span>
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#090D16] border border-white/10">
                  <Activity className="w-6 h-6 text-[#C8F135]" aria-hidden="true" />
                </div>
              </div>

              {/* BMI Visual Bar */}
              <div className="mt-6 mb-8">
                <div className="relative h-2.5 rounded-full bg-gradient-to-r from-sky-400 via-[#C8F135] via-60% to-amber-400">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#090D16] shadow"
                    style={{ left: `${stats.scalePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono-num">
                  <span>15.0 Under</span>
                  <span>18.5 – 24.9 Healthy</span>
                  <span>25+ Elevated</span>
                </div>
              </div>

              {/* Daily Calorie & Protein Targets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#090D16] border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <Flame className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                    <span>Daily Calorie Target</span>
                  </div>
                  <p className="font-mono-num text-3xl font-semibold text-[#C8F135]">
                    {stats.dailyCalories.toLocaleString('en-US')}{' '}
                    <span className="text-sm font-normal text-slate-300">kcal</span>
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#090D16] border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <Activity className="w-4 h-4 text-[#C8F135]" aria-hidden="true" />
                    <span>Daily Protein Target</span>
                  </div>
                  <p className="font-mono-num text-3xl font-semibold text-[#D4AF37]">
                    {stats.dailyProteinG}{' '}
                    <span className="text-sm font-normal text-slate-300">g / day</span>
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm text-slate-300 leading-relaxed">
                <span className="text-white font-semibold">{goal} Strategy:</span>{' '}
                {stats.planNote}
              </p>
            </div>

            <div className="mt-7 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Want a weekly workout split tailored to {stats.dailyCalories} kcal?
              </span>
              <button
                type="button"
                onClick={() =>
                  onAskCoachWithGoal(
                    `My goal is ${goal}. Can you suggest a training & protein plan?`
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-white/10 text-white hover:bg-[#D4AF37] hover:text-[#090D16] transition-colors whitespace-nowrap cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Ask AI Coach</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
