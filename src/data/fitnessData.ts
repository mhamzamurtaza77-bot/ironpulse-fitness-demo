export type Currency = 'GBP' | 'PKR';

export interface MembershipPlan {
  id: string;
  title: string;
  subtitle: string;
  priceGBP: number;
  pricePKR: number;
  billingLabel: string;
  category: string;
  featured?: boolean;
  features: string[];
}

export interface StudioZone {
  id: string;
  index: string;
  title: string;
  locationLabel: string;
  description: string;
  image: string;
  alt: string;
  metric: string;
}

export interface MemberResult {
  id: string;
  name: string;
  studio: string;
  program: string;
  outcome: string;
  quote: string;
}

export interface TrialDateOption {
  id: string;
  dayShort: string;
  dateShort: string;
  fullLabel: string;
}

export const HERO_IMAGE = '/src/assets/images/hero_ironpulse_gym_1795356283607.jpg';

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'basic-access',
    title: 'Basic Gym Access',
    subtitle: 'Full floor access · Mon–Sat',
    priceGBP: 35,
    pricePKR: 5000,
    billingLabel: 'per month',
    category: 'Foundation',
    features: [
      'Unlimited strength & cardio floor access',
      'Calibrated Eleiko barbells & squat racks',
      'Locker rooms & rain shower suites',
      '24/7 IronPulse Voice AI Coach access',
    ],
  },
  {
    id: 'pro-strength',
    title: 'Pro Strength & Group Classes',
    subtitle: 'Most popular · Unlimited classes',
    priceGBP: 55,
    pricePKR: 8500,
    billingLabel: 'per month',
    category: 'Performance',
    featured: true,
    features: [
      'All Basic Gym Access benefits included',
      'Unlimited HIIT, Mobility & Strength classes',
      'Monthly body composition & strength check-in',
      'Priority class booking in London & Lahore',
    ],
  },
  {
    id: 'vip-pt',
    title: 'VIP 1-on-1 Personal Training',
    subtitle: 'Dedicated coach · Custom programming',
    priceGBP: 110,
    pricePKR: 18000,
    billingLabel: 'per month',
    category: 'Bespoke Coaching',
    features: [
      '4 private 1-on-1 coaching sessions monthly',
      'Tailored hypertrophy or fat-loss programming',
      'Sauna & contrast recovery suite access',
      'Direct coach WhatsApp form reviews',
    ],
  },
  {
    id: 'nutrition-transformation',
    title: 'Custom Nutrition & Transformation Plan',
    subtitle: '12-week structured roadmap',
    priceGBP: 75,
    pricePKR: 12000,
    billingLabel: 'one-time plan',
    category: 'Nutrition',
    features: [
      'Personalized calorie & macro meal blueprint',
      'South Asian & UK grocery-friendly meal options',
      'Bi-weekly progress adjustments',
      'Supplement & hydration protocol',
    ],
  },
  {
    id: 'couple-buddy',
    title: 'Couple / Buddy Pass',
    subtitle: 'Train together · Shared accountability',
    priceGBP: 60,
    pricePKR: 9000,
    billingLabel: 'per month',
    category: 'Dual Access',
    features: [
      'Dual full-floor access for two members',
      'Synchronized workout split & group classes',
      'Complimentary induction coaching session',
      'Flexible London or Lahore home studio choice',
    ],
  },
  {
    id: 'day-pass-sauna',
    title: 'Day Pass & Sauna Recovery',
    subtitle: 'Single visit · Drop-in pass',
    priceGBP: 15,
    pricePKR: 1500,
    billingLabel: 'per visit',
    category: 'Drop-In',
    features: [
      'Full-day access to strength & turf zones',
      'Cedar Finnish sauna & cold rinse suite',
      'Fresh chilled towels & electrolyte bar',
      'Redeemable toward monthly membership',
    ],
  },
];

export const STUDIO_ZONES: StudioZone[] = [
  {
    id: 'strength-bay',
    index: '01',
    title: 'Calibrated Olympic Strength Floor',
    locationLabel: 'London Mayfair · Lahore Gulberg',
    description:
      'Custom matte-black power racks, calibrated steel plates, and dedicated lifting platforms engineered for focused progression without waiting.',
    image: '/src/assets/images/training_strength_zone_1795356285207.jpg',
    alt: 'Athlete loading an Olympic barbell in a dark luxury gym studio with warm gold window lighting',
    metric: '18 Lifting Platforms',
  },
  {
    id: 'coaching-bay',
    index: '02',
    title: 'Private 1-on-1 Performance Coaching',
    locationLabel: 'Strength · Fat Loss · Mobility',
    description:
      'Every rep is coached for joint alignment, tempo control, and progressive overload—supported between visits by your 24/7 AI coach.',
    image: '/src/assets/images/coaching_personal_session_1795356284631.jpg',
    alt: 'Personal trainer guiding a client during a kettlebell workout in a sleek dark studio',
    metric: '12 Certified Coaches',
  },
  {
    id: 'recovery-suite',
    index: '03',
    title: 'Cedar Finnish Sauna & Recovery Suite',
    locationLabel: 'Contrast Therapy · Post-Session Reset',
    description:
      'Transition straight from heavy lifting into 85°C cedar sauna heat and dark-slate cold rain showers to accelerate neuromuscular recovery.',
    image: '/src/assets/images/studio_recovery_sauna_1795356284719.jpg',
    alt: 'Luxury dark slate and warm cedar Finnish sauna and shower recovery suite',
    metric: '85°C Thermal Recovery',
  },
];

export const MEMBER_RESULTS: MemberResult[] = [
  {
    id: 'result-1',
    name: 'Tariq Mahmood',
    studio: 'Lahore Gulberg Studio · Finance Director',
    program: 'VIP 1-on-1 Personal Training',
    outcome: '-11.4 kg fat loss in 14 weeks',
    quote:
      'The structured barbell split plus simple high-protein Pakistani home meals made staying consistent effortless even with late office hours.',
  },
  {
    id: 'result-2',
    name: 'Hannah Al-Mansoor',
    studio: 'London Mayfair Studio · Architect',
    program: 'Pro Strength & Group Classes',
    outcome: '+35 kg deadlift PR in 10 weeks',
    quote:
      'No crowded mirrors or chaotic music—just serious coaching, warm lighting, and a sauna suite that makes 6:30 AM sessions something I look forward to.',
  },
];

export const TRIAL_TIME_SLOTS = ['7:00 AM', '10:30 AM', '5:00 PM', '8:00 PM'] as const;

export const STUDIO_LOCATIONS = [
  'London — Mayfair Flagship',
  'Lahore — Gulberg III Flagship',
] as const;

export function formatPlanPrice(plan: MembershipPlan, currency: Currency): string {
  if (currency === 'GBP') {
    return `£${plan.priceGBP.toLocaleString('en-GB')}`;
  }
  return `Rs ${plan.pricePKR.toLocaleString('en-PK')}`;
}

export function formatCurrencyAmount(amount: number, currency: Currency): string {
  if (currency === 'GBP') {
    return `£${amount.toLocaleString('en-GB')}`;
  }
  return `Rs ${amount.toLocaleString('en-PK')}`;
}

/**
 * Generates the next `count` upcoming Monday–Saturday dates using local calendar math,
 * strictly skipping Sundays (`day === 0`) so there are zero UTC timezone/date bugs.
 */
export function getUpcomingMonSatDates(count = 5): TrialDateOption[] {
  const results: TrialDateOption[] = [];
  const now = new Date();
  let offset = 0;

  while (results.length < count && offset < 21) {
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dayOfWeek = candidate.getDay(); // 0 = Sunday, 1 = Mon ... 6 = Sat
    if (dayOfWeek !== 0) {
      const dayShort = candidate.toLocaleDateString('en-US', { weekday: 'short' });
      const dateShort = candidate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullLabel = candidate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      const yyyy = candidate.getFullYear();
      const mm = String(candidate.getMonth() + 1).padStart(2, '0');
      const dd = String(candidate.getDate()).padStart(2, '0');
      results.push({
        id: `${yyyy}-${mm}-${dd}`,
        dayShort,
        dateShort,
        fullLabel,
      });
    }
    offset += 1;
  }

  return results;
}
