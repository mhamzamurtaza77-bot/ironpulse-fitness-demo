import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { Currency } from '../data/fitnessData';

interface NavbarProps {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  bagCount: number;
  onOpenBag: () => void;
}

export function Navbar({
  currency,
  onCurrencyChange,
  bagCount,
  onOpenBag,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Concept Demo Banner (scrolls naturally so sticky bar remains compact on mobile) */}
      <div className="bg-[#0F1624] border-b border-white/10 px-4 py-2 text-center text-xs sm:text-[13px] text-slate-300">
        <span className="text-[#C8F135] font-medium">
          ✨ PORTFOLIO CONCEPT DEMO
        </span>{' '}
        <span className="text-slate-300">
          — Built to showcase AI-powered fitness &amp; gym websites with 24/7 Voice AI Coach
        </span>
      </div>

      {/* Sticky 3-Zone Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#090D16]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#top"
            className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135] rounded"
          >
            IRONPULSE <span className="text-[#C8F135]">FITNESS</span>
          </a>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300"
          >
            <a
              href="#memberships"
              className="hover:text-white hover:underline underline-offset-8 decoration-[#C8F135] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135] rounded"
            >
              Memberships
            </a>
            <a
              href="#bmi-calculator"
              className="hover:text-white hover:underline underline-offset-8 decoration-[#C8F135] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135] rounded"
            >
              BMI Calculator
            </a>
            <a
              href="#trial-booking"
              className="hover:text-white hover:underline underline-offset-8 decoration-[#C8F135] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135] rounded"
            >
              Free Trial
            </a>
          </nav>

          {/* Zone 3: Currency Switcher + Plan Bag Action */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div
              role="group"
              aria-label="Currency selector"
              className="flex items-center p-1 rounded-lg bg-[#121929] border border-white/10 shrink-0"
            >
              <button
                type="button"
                onClick={() => onCurrencyChange('GBP')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135] ${
                  currency === 'GBP'
                    ? 'bg-[#C8F135] text-[#090D16]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                £ GBP
              </button>
              <button
                type="button"
                onClick={() => onCurrencyChange('PKR')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135] ${
                  currency === 'PKR'
                    ? 'bg-[#D4AF37] text-[#090D16]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Rs PKR
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenBag}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-white text-[#090D16] hover:bg-[#C8F135] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135]"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Plan Bag ({bagCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Links */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-t border-white/10 bg-[#0D1320] px-4 py-3 flex items-center justify-around gap-4 text-sm font-medium text-slate-200"
          >
            <a
              href="#memberships"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#C8F135] transition-colors whitespace-nowrap"
            >
              Memberships
            </a>
            <a
              href="#bmi-calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#C8F135] transition-colors whitespace-nowrap"
            >
              BMI Calculator
            </a>
            <a
              href="#trial-booking"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#C8F135] transition-colors whitespace-nowrap"
            >
              Free Trial
            </a>
          </nav>
        )}
      </header>
    </>
  );
}
