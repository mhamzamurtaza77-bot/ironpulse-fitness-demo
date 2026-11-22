import { useMemo, useState, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Clock, MapPin, MessageCircle } from 'lucide-react';
import {
  getUpcomingMonSatDates,
  STUDIO_LOCATIONS,
  TRIAL_TIME_SLOTS,
} from '../data/fitnessData';

export function TrialBookingSection() {
  const upcomingDates = useMemo(() => getUpcomingMonSatDates(5), []);

  const [selectedDateId, setSelectedDateId] = useState<string>(
    upcomingDates[0]?.id ?? ''
  );
  const [selectedTime, setSelectedTime] = useState<string>(TRIAL_TIME_SLOTS[0]);
  const [selectedStudio, setSelectedStudio] = useState<string>(STUDIO_LOCATIONS[0]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedSummary, setConfirmedSummary] = useState<string | null>(null);

  const selectedDateObj =
    upcomingDates.find((d) => d.id === selectedDateId) ?? upcomingDates[0];

  const whatsappUrl = useMemo(() => {
    const cleanName = name.trim() || 'Guest Athlete';
    const cleanPhone = phone.trim() || 'Not provided';
    const message = [
      'Hi IronPulse Fitness Studio! I would like to book my Free 3-Day Trial Pass:',
      `• Studio: ${selectedStudio}`,
      `• Date: ${selectedDateObj?.fullLabel ?? ''}`,
      `• Time Slot: ${selectedTime}`,
      `• Name: ${cleanName}`,
      `• Phone: ${cleanPhone}`,
    ].join('\n');
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }, [name, phone, selectedStudio, selectedDateObj, selectedTime]);

  const handleConfirmClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const trimmedName = name.trim();
    const digitsOnly = phone.replace(/\D/g, '');

    if (trimmedName.length < 2) {
      e.preventDefault();
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }

    if (digitsOnly.length < 7) {
      e.preventDefault();
      setErrorMsg('Please enter a valid phone or WhatsApp number.');
      return;
    }

    setErrorMsg('');
    setConfirmedSummary(
      `${trimmedName} · ${selectedDateObj?.fullLabel} at ${selectedTime} (${selectedStudio})`
    );
  };

  return (
    <section id="trial-booking" className="py-16 sm:py-24 border-b border-white/10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-[#0F1523] border border-white/15 p-6 sm:p-10 lg:p-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Info & Studio Details */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#C8F135] mb-2">
                  Complimentary 3-Day Trial Pass
                </p>
                <h2
                  className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4"
                  style={{ textWrap: 'balance' }}
                >
                  Experience the floor before you commit.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
                  Pick any upcoming Monday–Saturday date and coaching arrival slot. Your
                  3-day pass includes full gym access, one group strength class, and sauna
                  recovery.
                </p>

                <div className="space-y-4 text-sm text-slate-300 border-t border-white/10 pt-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#D4AF37] mt-1 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-white">London &amp; Lahore Flagships</p>
                      <p className="text-xs text-slate-400">
                        Mayfair (London W1K) · Gulberg III (Lahore)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#C8F135] mt-1 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-white">Monday – Saturday · 05:30 – 23:00</p>
                      <p className="text-xs text-slate-400">
                        Closed Sundays for equipment calibration &amp; maintenance
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {confirmedSummary && (
                <div className="mt-8 p-4 rounded-xl bg-[#C8F135]/10 border border-[#C8F135]/40 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-[#C8F135] mb-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Trial Pass Ready on WhatsApp</span>
                  </div>
                  <p className="text-xs text-slate-200">{confirmedSummary}</p>
                </div>
              )}
            </div>

            {/* Right Interactive Date/Slot/Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Studio Selector */}
              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-2.5">
                  1. Choose Studio Location
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STUDIO_LOCATIONS.map((loc) => {
                    const active = selectedStudio === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setSelectedStudio(loc)}
                        className={`px-4 py-3 text-left text-xs sm:text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#151D2F] text-[#C8F135] border-[#C8F135]'
                            : 'bg-[#090D16] text-slate-300 border-white/15 hover:border-white/30'
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5 Auto-Generated Mon–Sat Date Selector Buttons */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                    <span>2. Select Upcoming Date (Mon–Sat)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Sundays excluded</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {upcomingDates.map((dateObj) => {
                    const active = selectedDateObj?.id === dateObj.id;
                    return (
                      <button
                        key={dateObj.id}
                        type="button"
                        onClick={() => setSelectedDateId(dateObj.id)}
                        className={`px-3 py-3 rounded-xl border text-center transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#C8F135] text-[#090D16] border-[#C8F135]'
                            : 'bg-[#090D16] text-slate-200 border-white/15 hover:border-white/35'
                        }`}
                      >
                        <span className="block text-[11px] font-semibold uppercase tracking-wider opacity-80">
                          {dateObj.dayShort}
                        </span>
                        <span className="block font-mono-num text-sm font-bold mt-0.5">
                          {dateObj.dateShort}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Time Slots */}
              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-2.5">
                  3. Select Preferred Time Slot
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {TRIAL_TIME_SLOTS.map((slot) => {
                    const active = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`px-3 py-2.5 rounded-xl border font-mono-num text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-[#D4AF37] text-[#090D16] border-[#D4AF37]'
                            : 'bg-[#090D16] text-slate-200 border-white/15 hover:border-white/35'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="trial-name"
                    className="block text-xs font-semibold text-slate-300 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    id="trial-name"
                    type="text"
                    placeholder="e.g., Zainab Ahmed"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#090D16] border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#C8F135] focus:ring-1 focus:ring-[#C8F135]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="trial-phone"
                    className="block text-xs font-semibold text-slate-300 mb-2"
                  >
                    Phone / WhatsApp Number
                  </label>
                  <input
                    id="trial-phone"
                    type="tel"
                    placeholder="e.g., +44 7700 900123"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#090D16] border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#C8F135] focus:ring-1 focus:ring-[#C8F135]"
                  />
                </div>
              </div>

              {errorMsg && (
                <p role="alert" className="text-xs font-medium text-amber-300">
                  {errorMsg}
                </p>
              )}

              {/* WhatsApp Confirmation Action */}
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-400">
                  Pass preview:{' '}
                  <span className="text-white font-medium">
                    {selectedDateObj?.fullLabel} · {selectedTime}
                  </span>
                </p>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleConfirmClick}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold rounded-xl bg-[#C8F135] text-[#090D16] hover:bg-[#d8fb54] transition-transform duration-150 active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F135]"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Confirm Booking on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
