import { useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import {
  Currency,
  formatCurrencyAmount,
  formatPlanPrice,
  MembershipPlan,
} from '../data/fitnessData';

export interface BagItem {
  plan: MembershipPlan;
  quantity: number;
}

interface PlanBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: BagItem[];
  currency: Currency;
  onUpdateQty: (planId: string, delta: number) => void;
  onRemoveItem: (planId: string) => void;
  onClearBag: () => void;
}

export function PlanBagDrawer({
  isOpen,
  onClose,
  items,
  currency,
  onUpdateQty,
  onRemoveItem,
  onClearBag,
}: PlanBagDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const totalAmount = items.reduce((sum, item) => {
    const unit = currency === 'GBP' ? item.plan.priceGBP : item.plan.pricePKR;
    return sum + unit * item.quantity;
  }, 0);

  const whatsappUrl = (() => {
    const lines = items.map(
      (item) =>
        `• ${item.plan.title} x${item.quantity} (${formatPlanPrice(item.plan, currency)} ${item.plan.billingLabel})`
    );
    const body = [
      'Hi IronPulse Fitness Studio! I would like to confirm my selected Membership Plan Bag:',
      ...lines,
      `• Total (${currency}): ${formatCurrencyAmount(totalAmount, currency)}`,
      `• Name: ${customerName.trim() || 'Guest'}`,
      `• Phone: ${customerPhone.trim() || 'Not provided'}`,
    ].join('\n');
    return `https://wa.me/?text=${encodeURIComponent(body)}`;
  })();

  const handleCheckoutClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    if (customerName.trim().length > 0 && customerName.trim().length < 2) {
      e.preventDefault();
      setErrorMsg('Please enter at least 2 characters for your name.');
      return;
    }
    setErrorMsg('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Slide-Over Panel */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your IronPulse Plan Bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-[#0F1523] border-l border-white/15 h-full flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#C8F135]" aria-hidden="true" />
                <h2 className="font-display text-2xl font-bold text-white">
                  Your Plan Bag
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Plan Bag"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <ShoppingBag className="w-10 h-10 text-slate-600 mb-3" aria-hidden="true" />
                  <p className="text-base font-semibold text-white">Your Plan Bag is empty</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-xs">
                    Select any membership, personal training, or recovery pass to build your
                    custom IronPulse plan.
                  </p>
                </div>
              ) : (
                items.map(({ plan, quantity }) => (
                  <div
                    key={plan.id}
                    className="p-4 rounded-xl bg-[#090D16] border border-white/10 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white text-sm">{plan.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{plan.billingLabel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(plan.id)}
                        aria-label={`Remove ${plan.title}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-[#131B2E] border border-white/10 p-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(plan.id, -1)}
                          aria-label={`Decrease quantity for ${plan.title}`}
                          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono-num text-xs font-semibold text-white w-5 text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(plan.id, 1)}
                          aria-label={`Increase quantity for ${plan.title}`}
                          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-mono-num text-base font-semibold text-[#C8F135]">
                        {formatCurrencyAmount(
                          (currency === 'GBP' ? plan.priceGBP : plan.pricePKR) * quantity,
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-white/10 bg-[#0B101B] space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-[#090D16] border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C8F135]"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-[#090D16] border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C8F135]"
                  />
                </div>

                {errorMsg && <p className="text-xs text-amber-300">{errorMsg}</p>}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Estimated Total ({currency})</span>
                  <span className="font-mono-num text-2xl font-bold text-white">
                    {formatCurrencyAmount(totalAmount, currency)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClearBag}
                    className="px-4 py-3 text-xs font-semibold rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCheckoutClick}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl bg-[#C8F135] text-[#090D16] hover:bg-[#d8fb54] transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Confirm Plan on WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
