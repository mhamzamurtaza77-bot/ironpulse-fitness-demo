import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Dumbbell, Plus, ShoppingBag } from 'lucide-react';
import {
  Currency,
  formatPlanPrice,
  MEMBER_RESULTS,
  MEMBERSHIP_PLANS,
  MembershipPlan,
  STUDIO_ZONES,
} from '../data/fitnessData';

interface MembershipsSectionProps {
  currency: Currency;
  onAddToPlan: (plan: MembershipPlan) => void;
  bagQuantities: Record<string, number>;
  onOpenBag: () => void;
}

export function MembershipsSection({
  currency,
  onAddToPlan,
  bagQuantities,
  onOpenBag,
}: MembershipsSectionProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section id="memberships" className="py-16 sm:py-24 border-b border-white/10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#D4AF37] mb-2">
              Memberships &amp; Personal Training
            </p>
            <h2
              className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              Transparent plans for every training stage.
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-300 max-w-md">
            All pricing updates automatically between{' '}
            <span className="text-white font-semibold">£ GBP (London)</span> and{' '}
            <span className="text-[#D4AF37] font-semibold">Rs PKR (Lahore)</span>. Add plans to
            your bag to enquire or reserve directly.
          </p>
        </div>

        {/* 6 Membership & PT Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MEMBERSHIP_PLANS.map((plan, idx) => {
            const countInBag = bagQuantities[plan.id] || 0;
            const isFeatured = Boolean(plan.featured);

            return (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col justify-between p-6 sm:p-7 rounded-2xl border transition-colors ${
                  isFeatured
                    ? 'bg-[#131B2E] border-[#C8F135]/60'
                    : 'bg-[#0F1523] border-white/10 hover:border-white/25'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-400 mb-3">
                    <span>{plan.category}</span>
                    {isFeatured && (
                      <span className="font-semibold text-[#C8F135]">Most Popular</span>
                    )}
                  </div>

                  <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                    {plan.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">{plan.subtitle}</p>

                  <div className="mt-6 pb-6 border-b border-white/10 flex items-baseline gap-2">
                    <span className="font-mono-num text-3xl sm:text-4xl font-semibold text-white">
                      {formatPlanPrice(plan, currency)}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-400">
                      {plan.billingLabel}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-slate-300">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isFeatured ? 'text-[#C8F135]' : 'text-[#D4AF37]'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onAddToPlan(plan)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-150 active:scale-[0.98] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135] ${
                      isFeatured
                        ? 'bg-[#C8F135] text-[#090D16] hover:bg-[#d8fb54]'
                        : 'bg-white/10 text-white hover:bg-[#C8F135] hover:text-[#090D16]'
                    }`}
                  >
                    <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {countInBag > 0 ? `+ Add Again (${countInBag})` : '+ Add to Plan'}
                    </span>
                  </button>

                  {countInBag > 0 && (
                    <button
                      type="button"
                      onClick={onOpenBag}
                      aria-label={`View ${plan.title} in Plan Bag`}
                      className="p-3 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-[#090D16] transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Studio Architecture & Coaching Environments */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#D4AF37] mb-2">
                Inside IronPulse Studios
              </p>
              <h3 className="font-display text-3xl sm:text-4xl font-bold text-white">
                Engineered for serious training and complete recovery.
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              London Mayfair · Lahore Gulberg III
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STUDIO_ZONES.map((zone, idx) => (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-2xl overflow-hidden bg-[#0F1523] border border-white/10 flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#151D2F]">
                  {!failedImages[zone.id] ? (
                    <img
                      src={zone.image}
                      alt={zone.alt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [zone.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#121929] to-[#090D16] text-center">
                      <Dumbbell className="w-9 h-9 text-[#D4AF37] mb-2" />
                      <p className="text-sm font-semibold text-white">{zone.title}</p>
                    </div>
                  )}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#090D16]/75 via-transparent to-transparent"
                  />
                  <p className="absolute bottom-3 left-4 font-mono-num text-xs font-semibold text-[#C8F135]">
                    {zone.metric}
                  </p>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-xs text-slate-400 mb-1.5">
                    {zone.index}. {zone.locationLabel}
                  </p>
                  <h4 className="font-display text-2xl font-bold text-white mb-2">
                    {zone.title}
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {zone.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Attributable Member Proof Outcomes (Claim-to-Proof Adjacency) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {MEMBER_RESULTS.map((item) => (
            <div
              key={item.id}
              className="p-6 sm:p-7 rounded-2xl bg-[#0F1523] border border-white/10 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="font-mono-num text-sm font-semibold text-[#C8F135]">
                    {item.outcome}
                  </span>
                  <span className="text-xs text-slate-400">{item.program}</span>
                </div>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs text-slate-400">
                <span className="font-semibold text-white">{item.name}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>{item.studio}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
