import { Currency, getUpcomingMonSatDates, MEMBERSHIP_PLANS, TRIAL_TIME_SLOTS } from '../data/fitnessData';

export type CoachLanguage = 'EN' | 'UR';
export type CoachGender = 'female' | 'male';

export interface BookingFlowState {
  active: boolean;
  step: 'name' | 'goal' | 'slot' | 'done';
  name?: string;
  goal?: string;
  slot?: string;
}

export interface ConfirmedTrialPass {
  passCode: string;
  name: string;
  goal: string;
  slot: string;
  whatsappUrl: string;
}

export interface CoachReply {
  text: string;
  spokenText: string;
  nextBookingState: BookingFlowState;
  quickOptions?: string[];
  confirmedPass?: ConfirmedTrialPass;
}

export const QUICK_ACTION_CHIPS = [
  '🎟️ Book Free Trial',
  '💪 Membership Fees',
  '🔥 Fat Loss / Muscle Plan',
  '🕒 Gym Timings',
  '🧑‍🏫 Personal Trainers',
] as const;

function buildPassCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `IP-3DAY-${num}`;
}

function detectRomanUrdu(input: string): boolean {
  const lower = input.toLowerCase();
  const romanUrduTokens = [
    'kya',
    'hai',
    'hain',
    'kab',
    'kaise',
    'mera',
    'meri',
    'mujhe',
    'wazan',
    'fees',
    'kitni',
    'kitna',
    'batao',
    'bata',
    'chahiye',
    'karna',
    'shuru',
    'assalam',
    'salam',
    'shukriya',
    'timings',
    'khulta',
    'band',
    'trainer',
    'bhai',
    'jaan',
    'sauna',
  ];
  // Check for whole-word or obvious Urdu conversational phrasing
  const matches = romanUrduTokens.filter((token) =>
    new RegExp(`\\b${token}\\b`, 'i').test(lower)
  );
  return matches.length >= 2 || /\b(assalam|salam|wazan|batao|kitni|kitna|mujhe|chahiye|shukriya|khulta)\b/i.test(lower);
}

function buildSlotSuggestions(): string[] {
  const dates = getUpcomingMonSatDates(3);
  return [
    `${dates[0]?.dayShort} ${dates[0]?.dateShort} · 7:00 AM`,
    `${dates[1]?.dayShort} ${dates[1]?.dateShort} · 5:00 PM`,
    `${dates[2]?.dayShort} ${dates[2]?.dateShort} · 8:00 PM`,
  ];
}

export function generateCoachReply(
  rawInput: string,
  language: CoachLanguage,
  coachGender: CoachGender,
  currency: Currency,
  bookingState: BookingFlowState
): CoachReply {
  const input = rawInput.trim();
  const lower = input.toLowerCase();
  const coachName = coachGender === 'female' ? 'Coach Sara' : 'Coach Adam';
  const useUrduScript = language === 'UR';
  const useRomanUrdu = !useUrduScript && detectRomanUrdu(input);

  // Cancel booking flow if user explicitly resets or asks another topic via chip
  const isChipTrigger =
    input === '💪 Membership Fees' ||
    input === '🔥 Fat Loss / Muscle Plan' ||
    input === '🕒 Gym Timings' ||
    input === '🧑‍🏫 Personal Trainers';

  if (bookingState.active && !isChipTrigger && input !== '🎟️ Book Free Trial') {
    if (bookingState.step === 'name') {
      const cleanName = input.replace(/^(my name is|i am|i'm|mera naam)\s+/i, '').trim();
      if (cleanName.length < 2) {
        return {
          text: useUrduScript
            ? 'براہ کرم اپنا پورا نام لکھیں تاکہ میں آپ کا 3 دن کا فری ٹرائل پاس تیار کر سکوں۔'
            : 'Please share your full name so I can prepare your 3-day free trial pass.',
          spokenText: useUrduScript
            ? 'Please share your full name for your free trial pass.'
            : 'Please share your full name so I can prepare your 3-day free trial pass.',
          nextBookingState: bookingState,
        };
      }
      return {
        text: useUrduScript
          ? `شکریہ ${cleanName}! آپ کا بنیادی فٹنس ہدف کیا ہے؟ نیچے سے منتخب کریں یا خود لکھیں:`
          : `Great to meet you, ${cleanName}! What is your primary fitness goal? Pick one below or type your own:`,
        spokenText: `Great to meet you, ${cleanName}. What is your primary fitness goal?`,
        nextBookingState: { active: true, step: 'goal', name: cleanName },
        quickOptions: useUrduScript
          ? ['وزن کم کرنا (Fat Loss)', 'مسلز بنانا (Muscle Gain)', 'فٹ اور فعال رہنا (Stay Fit)']
          : ['Fat Loss', 'Muscle Gain', 'Strength & Mobility'],
      };
    }

    if (bookingState.step === 'goal') {
      const slotChoices = buildSlotSuggestions();
      return {
        text: useUrduScript
          ? `بہترین انتخاب (${input})! آپ کس دن اور وقت پر اپنا پہلا ٹرائل سیشن لینا چاہیں گے؟ (پیر تا ہفتہ، اتوار بند):`
          : `Awesome focus — ${input}. Which upcoming Mon–Sat day and time works best for your first session?`,
        spokenText: `Awesome focus. Which upcoming day and time works best for your first session?`,
        nextBookingState: {
          active: true,
          step: 'slot',
          name: bookingState.name,
          goal: input,
        },
        quickOptions: slotChoices,
      };
    }

    if (bookingState.step === 'slot') {
      const passCode = buildPassCode();
      const memberName = bookingState.name || 'Guest Athlete';
      const memberGoal = bookingState.goal || 'General Fitness';
      const chosenSlot = input;
      const waText = encodeURIComponent(
        `Hi IronPulse Fitness Studio! I'd like to confirm my Free 3-Day Trial Pass:\n• Pass Code: ${passCode}\n• Name: ${memberName}\n• Fitness Goal: ${memberGoal}\n• Preferred Day & Time: ${chosenSlot}\nBooked with ${coachName}.`
      );
      const whatsappUrl = `https://wa.me/?text=${waText}`;

      return {
        text: useUrduScript
          ? `مبارک ہو ${memberName}! آپ کا 3 دن کا فری ٹرائل پاس کنفرم ہو گیا ہے۔ نیچے WhatsApp بٹن دبا کر اپنا پاس محفوظ کریں:`
          : `You're all set, ${memberName}! Your Free 3-Day Trial Pass is ready below. Tap "Confirm on WhatsApp" to lock in your arrival:`,
        spokenText: `You are all set, ${memberName}! Your free 3-day trial pass is ready.`,
        nextBookingState: { active: false, step: 'done', name: memberName, goal: memberGoal, slot: chosenSlot },
        confirmedPass: {
          passCode,
          name: memberName,
          goal: memberGoal,
          slot: chosenSlot,
          whatsappUrl,
        },
      };
    }
  }

  // Trigger 1: Start Free Trial Flow
  if (
    input === '🎟️ Book Free Trial' ||
    /\b(free trial|book trial|trial pass|3-day|3 day|demo pass|ٹرائل|فری ٹرائل)\b/i.test(lower)
  ) {
    return {
      text: useUrduScript
        ? `خوش آمدید! میں ${coachName} ہوں اور ابھی آپ کا 3 دن کا فری ٹرائل پاس بُک کر دیتی ہوں۔ شروع کرنے کے لیے، براہ کرم اپنا نام بتائیں؟`
        : `Let's get your Free 3-Day Trial Pass set up! I'm ${coachName}. First, what is your full name?`,
      spokenText: `Let's get your free 3-day trial pass set up! What is your full name?`,
      nextBookingState: { active: true, step: 'name' },
    };
  }

  // Trigger 2: Membership Fees
  if (
    input === '💪 Membership Fees' ||
    /\b(fee|fees|price|pricing|cost|membership|plan|gbp|pkr|rupees|pounds|فیس|ممبرشپ|پیکج)\b/i.test(lower)
  ) {
    const lines = MEMBERSHIP_PLANS.map((p) => {
      const price = currency === 'GBP' ? `£${p.priceGBP}` : `Rs ${p.pricePKR.toLocaleString('en-PK')}`;
      return `• ${p.title}: ${price} (${p.billingLabel})`;
    }).join('\n');

    if (useUrduScript) {
      return {
        text: `آئرن پلس (London & Lahore) کے ممبرشپ پلانز یہ ہیں:\n${lines}\n\nاگر آپ چاہیں تو میں آپ کا 3 دن کا فری ٹرائل ابھی بُک کر سکتا ہوں!`,
        spokenText: `Here are our IronPulse membership plans in ${currency === 'GBP' ? 'British Pounds' : 'Pakistani Rupees'}.`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial'],
      };
    }

    if (useRomanUrdu) {
      return {
        text: `Hamare IronPulse plans (${currency}) yeh hain:\n${lines}\n\nAap 3-day free trial bhi book kar sakte hain check karne ke liye!`,
        spokenText: `Here are our IronPulse membership fees. You can also book a free 3-day trial anytime.`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial'],
      };
    }

    return {
      text: `Here are our transparent IronPulse plans (${currency}):\n${lines}\n\nSwitch the top currency toggle anytime between £ GBP & Rs PKR, or book a Free 3-Day Trial first.`,
      spokenText: `Here are our transparent membership plans, starting at ${currency === 'GBP' ? '35 pounds' : '5,000 rupees'} per month.`,
      nextBookingState: { active: false, step: 'done' },
      quickOptions: ['🎟️ Book Free Trial'],
    };
  }

  // Trigger 3: Fat Loss / Muscle Plan
  if (
    input === '🔥 Fat Loss / Muscle Plan' ||
    /\b(fat loss|weight loss|lose weight|muscle|hypertrophy|bulk|cut|lean|calorie|protein|diet|wazan|چربی|وزن|مسلز)\b/i.test(
      lower
    )
  ) {
    if (useUrduScript) {
      return {
        text: `فٹنس ہدف کے مطابق بہترین فارمولا:\n• چربی کم کرنے (Fat Loss): ہفتے میں 4 دن طاقت کی ورزش (Strength) + روزانہ 8,000–10,000 قدم، اور 300–450 kcal کم کھائیں۔\n• مسلز بنانے (Muscle Gain): ہر کلو وزن کے لیے 1.8g–2.0g پروٹین، اور پروگریسو اوورلوڈ (وزن آہستہ آہستہ بڑھائیں)۔\n\nاپنا درست ہدف جاننے کے لیے ہمارا BMI کیلکولیٹر بھی استعمال کریں!`,
        spokenText: `For fat loss, pair 4 days of strength training with a 400 calorie deficit and high daily protein.`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial', '🧑‍🏫 Personal Trainers'],
      };
    }

    if (useRomanUrdu) {
      return {
        text: `Aapke goal ke liye best blueprint:\n• Fat Loss: Haftay mein 4 din heavy strength training + rozana 9,000 steps aur 350 kcal deficit.\n• Muscle Gain: Har kg body weight par 1.8g–2.0g protein aur progressive overload.\n\nExact calories aur protein ke liye upar BMI Calculator check karein!`,
        spokenText: `For fat loss or muscle gain, combine 4 strength sessions weekly with 1.8 to 2 grams of protein per kilogram.`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial', '🧑‍🏫 Personal Trainers'],
      };
    }

    return {
      text: `Smart 4-Day IronPulse Blueprint:\n• Fat Loss: 4 strength sessions/week + 9,000 daily steps + 400 kcal deficit with 2.0g protein/kg.\n• Muscle Gain: Upper/Lower 4-day split + 250 kcal surplus + progressive overload.\n\nScroll to our BMI & Calorie Calculator on the page for your exact daily kcal and protein target!`,
      spokenText: `For fat loss or muscle gain, follow our 4-day strength split with 1.8 to 2 grams of protein per kilogram of body weight.`,
      nextBookingState: { active: false, step: 'done' },
      quickOptions: ['🎟️ Book Free Trial', '🧑‍🏫 Personal Trainers'],
    };
  }

  // Trigger 4: Gym Timings
  if (
    input === '🕒 Gym Timings' ||
    /\b(time|timing|timings|hours|open|close|sunday|schedule|اوقات|ٹائمنگ|کھلتا|بند)\b/i.test(lower)
  ) {
    if (useUrduScript) {
      return {
        text: `ہمارے لندن (Mayfair) اور لاہور (Gulberg III) اسٹوڈیوز کے اوقات:\n• پیر تا ہفتہ (Mon–Sat): صبح 5:30 بجے سے رات 11:00 بجے تک\n• اتوار (Sunday): مکمل صفائی اور مرمت کے لیے بند\n• ٹرائل سیشن سلاٹس: 7:00 AM · 10:30 AM · 5:00 PM · 8:00 PM`,
        spokenText: `Both London and Lahore studios are open Monday to Saturday from 5:30 AM to 11:00 PM, and closed on Sundays.`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial'],
      };
    }

    return {
      text: `Studio Hours (London Mayfair & Lahore Gulberg III):\n• Monday – Saturday: 5:30 AM – 11:00 PM\n• Sunday: Closed for deep equipment calibration & recovery reset\n• Free Trial Coaching Slots: ${TRIAL_TIME_SLOTS.join(' · ')}`,
      spokenText: `Both London and Lahore studios are open Monday through Saturday from 5:30 AM until 11:00 PM, and closed on Sundays.`,
      nextBookingState: { active: false, step: 'done' },
      quickOptions: ['🎟️ Book Free Trial'],
    };
  }

  // Trigger 5: Personal Trainers
  if (
    input === '🧑‍🏫 Personal Trainers' ||
    /\b(trainer|trainers|coach|coaches|sara|adam|hamza|pt|کوچ|ٹرینر)\b/i.test(lower)
  ) {
    if (useUrduScript) {
      return {
        text: `ہمارے سرٹیفائیڈ کوچز:\n• Coach Sara: خواتین اور مردوں کے لیے Fat Loss، کور اسٹرینتھ اور موبیلٹی اسپیشلسٹ\n• Coach Adam: ہائپرٹرافی، پاور لفٹنگ اور اسٹرینتھ کوچنگ\n• Coach Hamza: ایتھلیٹک کنڈیشننگ اور ساؤتھ ایشین/یو کے نیوٹریشن\n\nVIP 1-on-1 پلان میں ہر ماہ 4 پرائیویٹ سیشنز شامل ہیں۔`,
        spokenText: `Our coaching team includes Coach Sara for fat loss and mobility, Coach Adam for strength and hypertrophy, and Coach Hamza for conditioning.`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial', '💪 Membership Fees'],
      };
    }

    return {
      text: `Meet our Lead Coaching Team:\n• Coach Sara — Fat Loss, Postural Mobility & Women's Strength\n• Coach Adam — Powerlifting, Hypertrophy & Barbell Mechanics\n• Coach Hamza — Athletic Conditioning & Custom Macro Nutrition\n\nEvery VIP 1-on-1 PT plan includes 4 private sessions monthly + WhatsApp form checks.`,
      spokenText: `Our lead team includes Coach Sara for fat loss and mobility, Coach Adam for strength, and Coach Hamza for conditioning and nutrition.`,
      nextBookingState: { active: false, step: 'done' },
      quickOptions: ['🎟️ Book Free Trial', '💪 Membership Fees'],
    };
  }

  // Sauna / Recovery / Locations
  if (/\b(sauna|steam|recovery|london|lahore|mayfair|gulberg|address|location|سونا|لاہور|لندن)\b/i.test(lower)) {
    return {
      text: useUrduScript
        ? `ہمارے دونوں اسٹوڈیوز (London Mayfair اور Lahore Gulberg III) میں جدید اولمپک باربیل فلور اور 85°C سیڈر فِنش سونا و ریکوری سویٹ موجود ہے۔ ڈے پاس صرف ${currency === 'GBP' ? '£15' : 'Rs 1,500'} میں دستیاب ہے۔`
        : `Both London (Mayfair) and Lahore (Gulberg III) flagships feature calibrated Olympic platforms plus an 85°C cedar Finnish sauna & cold rain recovery suite. Day Pass + Sauna is just ${currency === 'GBP' ? '£15' : 'Rs 1,500'}.`,
      spokenText: `Both London and Lahore flagships feature Olympic lifting bays and our cedar Finnish sauna recovery suite.`,
      nextBookingState: { active: false, step: 'done' },
      quickOptions: ['🎟️ Book Free Trial', '💪 Membership Fees'],
    };
  }

  // Greetings
  if (/^(hi|hello|hey|salam|assalam|aoa|good morning|good evening|سلام)/i.test(lower)) {
    return {
      text: useUrduScript
        ? `وعلیکم السلام! میں ${coachName} ہوں، IronPulse کی 24/7 فٹنس کوچ۔ آپ مجھ سے فیس، اوقات، ڈائٹ پلان پوچھ سکتے ہیں یا نیچے کلک کر کے 3 دن کا فری ٹرائل بُک کر سکتے ہیں۔`
        : `Welcome to IronPulse Fitness! I'm ${coachName}. Ask me about memberships, fat loss/muscle splits, London & Lahore studio hours, or tap a chip below to claim your Free 3-Day Trial.`,
      spokenText: `Welcome to IronPulse Fitness! I am ${coachName}. How can I help with your training today?`,
      nextBookingState: { active: false, step: 'done' },
    };
  }

  // Default helpful fallback
  return {
    text: useUrduScript
      ? `میں ${coachName} ہوں! میں آپ کی ممبرشپ فیس، وزن کم کرنے یا مسلز بنانے کے پلان، جم اوقات (Mon–Sat)، اور 3 دن کے فری ٹرائل بُک کرنے میں مدد کر سکتا ہوں۔ نیچے دیے گئے بٹن میں سے کوئی ایک منتخب کریں:`
      : `I'm ${coachName} — here 24/7 for IronPulse London & Lahore. I can walk you through membership pricing, fat loss or muscle gain splits, studio timings, or book your Free 3-Day Trial Pass in 30 seconds!`,
    spokenText: `I am ${coachName}. I can help with memberships, training plans, timings, or booking your free 3-day trial.`,
    nextBookingState: { active: false, step: 'done' },
  };
}
