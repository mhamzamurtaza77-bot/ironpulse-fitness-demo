import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MembershipsSection } from './components/MembershipsSection';
import { BmiCalculator } from './components/BmiCalculator';
import { TrialBookingSection } from './components/TrialBookingSection';
import { BagItem, PlanBagDrawer } from './components/PlanBagDrawer';
import { AiCoachWidget } from './components/AiCoachWidget';
import { Currency, MembershipPlan } from './data/fitnessData';

export default function App() {
  const [currency, setCurrency] = useState<Currency>('GBP');
  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);

  const handleAddToPlan = (plan: MembershipPlan) => {
    setBagItems((prev) => {
      const existing = prev.find((item) => item.plan.id === plan.id);
      if (existing) {
        return prev.map((item) =>
          item.plan.id === plan.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { plan, quantity: 1 }];
    });
  };

  const handleUpdateQty = (planId: string, delta: number) => {
    setBagItems((prev) =>
      prev
        .map((item) =>
          item.plan.id === planId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (planId: string) => {
    setBagItems((prev) => prev.filter((item) => item.plan.id !== planId));
  };

  const handleClearBag = () => {
    setBagItems([]);
  };

  const bagCount = bagItems.reduce((sum, item) => sum + item.quantity, 0);
  const bagQuantities = bagItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.plan.id] = item.quantity;
    return acc;
  }, {});

  const handleAskCoachWithPrompt = (prompt: string) => {
    setQueuedPrompt(prompt);
    setCoachOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col">
      <Navbar
        currency={currency}
        onCurrencyChange={setCurrency}
        bagCount={bagCount}
        onOpenBag={() => setBagOpen(true)}
      />

      <main className="flex-1">
        <HeroSection onOpenCoach={() => setCoachOpen(true)} />

        <MembershipsSection
          currency={currency}
          onAddToPlan={handleAddToPlan}
          bagQuantities={bagQuantities}
          onOpenBag={() => setBagOpen(true)}
        />

        <BmiCalculator onAskCoachWithGoal={handleAskCoachWithPrompt} />

        <TrialBookingSection />
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#070A11] border-t border-white/10 py-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-display text-xl font-bold text-white">
              IRONPULSE <span className="text-[#C8F135]">FITNESS STUDIO</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              London Mayfair · Lahore Gulberg III · Mon–Sat 05:30 – 23:00
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <a href="#memberships" className="hover:text-white transition-colors">
              Memberships
            </a>
            <a href="#bmi-calculator" className="hover:text-white transition-colors">
              BMI Calculator
            </a>
            <a href="#trial-booking" className="hover:text-white transition-colors">
              Free Trial
            </a>
            <span>© {new Date().getFullYear()} IronPulse Fitness Studio</span>
          </div>
        </div>
      </footer>

      <PlanBagDrawer
        isOpen={bagOpen}
        onClose={() => setBagOpen(false)}
        items={bagItems}
        currency={currency}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearBag={handleClearBag}
      />

      <AiCoachWidget
        isOpen={coachOpen}
        onToggleOpen={setCoachOpen}
        currency={currency}
        queuedPrompt={queuedPrompt}
        onConsumeQueuedPrompt={() => setQueuedPrompt(null)}
      />
    </div>
  );
}
