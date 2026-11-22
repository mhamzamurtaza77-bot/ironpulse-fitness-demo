import { Currency, getUpcomingMonSatDates, MEMBERSHIP_PLANS } from '../data/fitnessData';

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

function hasUrduScript(input: string): boolean {
  return /[\u0600-\u06FF]/.test(input);
}

function detectRomanUrdu(input: string): boolean {
  const lower = input.toLowerCase();
  const romanUrduTokens = [
    'aoa',
    'assalam',
    'salam',
    'waalaikum',
    'walaikum',
    'kya',
    'kia',
    'hai',
    'hain',
    'ho',
    'kab',
    'kaise',
    'kese',
    'mera',
    'meri',
    'mujhe',
    'mujh',
    'wazan',
    'charbi',
    'kam',
    'barhana',
    'kitni',
    'kitna',
    'batao',
    'btaye',
    'batain',
    'bata',
    'chahiye',
    'karna',
    'karni',
    'shuru',
    'shukriya',
    'khulta',
    'band',
    'bhai',
    'yaar',
    'ji',
    'aur',
    'mein',
    'se',
    'ko',
    'ka',
    'ki',
    'khao',
    'khana',
    'peena',
    'haftay',
    'rozana',
  ];
  const matches = romanUrduTokens.filter((token) =>
    new RegExp(`\\b${token}\\b`, 'i').test(lower)
  );
  return (
    matches.length >= 2 ||
    /\b(aoa|assalam|salam|wazan|charbi|batao|batain|kitni|kitna|mujhe|chahiye|shukriya|khulta|kya hal|kaise ho)\b/i.test(
      lower
    )
  );
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

  const inputIsUrduScript = hasUrduScript(input);
  const inputIsRomanUrdu = !inputIsUrduScript && detectRomanUrdu(input);
  const useUrduScript = inputIsUrduScript || (language === 'UR' && !inputIsRomanUrdu);
  const useRomanUrdu = !useUrduScript && inputIsRomanUrdu;

  // Cancel booking flow if user explicitly asks another topic via chip
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
            ? 'براہ کرم اپنا **پورا نام** لکھیں تاکہ میں آپ کا 3 دن کا فری ٹرائل پاس تیار کر سکوں۔'
            : useRomanUrdu
            ? 'Meherbani farma kar apna **poora naam** likhain taake main aapka 3-day free trial pass tayyar kar sakoon.'
            : 'Please share your **full name** so I can prepare your Free 3-Day Trial Pass!',
          spokenText:
            'Please share your full name so I can prepare your Free 3-Day Trial Pass!',
          nextBookingState: bookingState,
        };
      }
      return {
        text: useUrduScript
          ? `بہت خوشی ہوئی **${cleanName}**! اب بتائیں آپ کا بنیادی فٹنس ہدف کیا ہے؟\n\n• **وزن کم کرنا (Fat Loss)**\n• **مسلز بنانا (Muscle Gain)**\n• **فٹ اور فعال رہنا (Stay Fit)**`
          : useRomanUrdu
          ? `Bohat khushi hui **${cleanName}**! Ab batayein aapka main fitness goal kya hai?\n\n• **Fat Loss** (wazan aur charbi kam karna)\n• **Muscle Gain** (strength aur size barhana)\n• **Stay Fit** (energy aur daily fitness)`
          : `Great to meet you, **${cleanName}**! What is your primary fitness goal right now? Pick one below or type your own:`,
        spokenText: `Great to meet you, ${cleanName}! What is your primary fitness goal right now? Pick one below or type your own.`,
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
          ? `بہترین انتخاب (**${input}**)! آپ کس دن اور وقت پر اپنا پہلا ٹرائل سیشن لینا چاہیں گے؟ (پیر تا ہفتہ، صبح 6 بجے سے رات 11 بجے تک):`
          : useRomanUrdu
          ? `Zabardast choice (**${input}**)! Aap kis din aur time par apna pehla trial session lena chahenge? (Mon–Sat 6 AM – 11 PM):`
          : `Awesome focus — **${input}**! Which upcoming Mon–Sat day and time works best for your first coaching session?`,
        spokenText: `Awesome focus, ${input}! Which upcoming Monday to Saturday day and time works best for your first coaching session?`,
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
          ? `مبارک ہو **${memberName}**! آپ کا 3 دن کا فری ٹرائل پاس تیار ہے۔\n\n• **پاس کوڈ:** ${passCode}\n• **ہدف:** ${memberGoal}\n• **سیشن:** ${chosenSlot}\n\nنیچے **Confirm on WhatsApp** بٹن دبا کر اپنا پاس محفوظ کریں!`
          : useRomanUrdu
          ? `Mubarak ho **${memberName}**! Aapka Free 3-Day Trial Pass ready hai.\n\n• **Pass Code:** ${passCode}\n• **Goal:** ${memberGoal}\n• **Session:** ${chosenSlot}\n\nNeeche **Confirm on WhatsApp** par click kar ke apni slot lock kar lein!`
          : `You're all set, **${memberName}**! Your Free 3-Day Trial Pass is ready below. Tap **Confirm on WhatsApp** to lock in your arrival — any questions before your first session?`,
        spokenText: `You're all set, ${memberName}! Your Free 3-Day Trial Pass for ${memberGoal} on ${chosenSlot} is ready below. Tap Confirm on WhatsApp to lock in your arrival.`,
        nextBookingState: {
          active: false,
          step: 'done',
          name: memberName,
          goal: memberGoal,
          slot: chosenSlot,
        },
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

  // 1. Free Trial Booking Intent
  if (
    input === '🎟️ Book Free Trial' ||
    /\b(free trial|book trial|trial pass|3-day|3 day|demo pass|ٹرائل|فری ٹرائل)\b/i.test(lower)
  ) {
    return {
      text: useUrduScript
        ? `خوش آمدید! میں **${coachName}** ہوں اور ابھی آپ کا **3 دن کا فری ٹرائل پاس** بُک کر دیتی ہوں۔\n\n• مکمل جم فلور، گروپ کلاس اور سونا تک رسائی شامل ہے\n\nشروع کرنے کے لیے، براہ کرم **اپنا پورا نام** بتائیں؟`
        : useRomanUrdu
        ? `Bilkul! Main **${coachName}** hoon aur abhi aapka **Free 3-Day Trial Pass** book kar deta hoon.\n\n• Is pass mein gym floor, group class aur sauna recovery shamil hai\n\nShuru karne ke liye, apna **poora naam** kya likhoon?`
        : `I'd love to set up your **Free 3-Day Trial Pass**! I'm **${coachName}**, and your pass includes full strength floor access, a group class, and our cedar sauna.\n\nFirst, what is your **full name**?`,
      spokenText: `I'd love to set up your Free 3-Day Trial Pass! I'm ${coachName}, and your pass includes full strength floor access, a group class, and our cedar sauna. First, what is your full name?`,
      nextBookingState: { active: true, step: 'name' },
    };
  }

  // 2. Membership Fees & Pricing
  if (
    input === '💪 Membership Fees' ||
    /\b(fee|fees|price|pricing|cost|membership|plan|plans|package|gbp|pkr|rupees|pounds|charges|فیس|ممبرشپ|پیکج)\b/i.test(
      lower
    )
  ) {
    const lines = MEMBERSHIP_PLANS.map((p) => {
      const price =
        currency === 'GBP'
          ? `**£${p.priceGBP}**`
          : `**Rs ${p.pricePKR.toLocaleString('en-PK')}**`;
      return `• **${p.title}:** ${price} (${p.billingLabel})`;
    }).join('\n');

    const spokenLines = MEMBERSHIP_PLANS.map((p) => {
      const price =
        currency === 'GBP'
          ? `${p.priceGBP} pounds`
          : `${p.pricePKR.toLocaleString('en-US')} rupees`;
      return `${p.title} is ${price} ${p.billingLabel}.`;
    }).join(' ');

    if (useUrduScript) {
      return {
        text: `بالکل! **آئرن پلس (London & Lahore)** کے شفاف ممبرشپ پلانز (${currency}) یہ ہیں:\n\n${lines}\n\nآپ ان میں سے کون سا پلان یا **3 دن کا فری ٹرائل** آزمانا چاہیں گے؟`,
        spokenText: `Here are our transparent IronPulse membership plans for London and Lahore. ${spokenLines} Which plan or free 3-day trial would you like to explore?`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial'],
      };
    }

    if (useRomanUrdu) {
      return {
        text: `Zaroor! **IronPulse Fitness (London & Lahore)** ke transparent plans (${currency}) yeh hain:\n\n${lines}\n\nAap pehle **Free 3-Day Trial** lena chahenge ya kisi specific plan ki detail chahiye?`,
        spokenText: `Here are our transparent IronPulse membership plans. ${spokenLines} Would you like to start with a free 3-day trial first?`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial'],
      };
    }

    return {
      text: `Happy to share our **IronPulse Fitness** pricing in **${currency}** (no hidden joining fees!):\n\n${lines}\n\nWould you like me to recommend the best plan for your goals, or book a **Free 3-Day Trial** first?`,
      spokenText: `Happy to share our IronPulse Fitness pricing with no hidden joining fees. ${spokenLines} Would you like me to recommend the best plan for your goals, or book a Free 3-Day Trial first?`,
      nextBookingState: { active: false, step: 'done' },
      quickOptions: ['🎟️ Book Free Trial'],
    };
  }

  // 3. Weight Loss / Fat Burn / Muscle Gain / Diet
  if (
    input === '🔥 Fat Loss / Muscle Plan' ||
    /\b(fat loss|fat burn|weight loss|lose weight|belly|slim|lean|muscle|hypertrophy|bulk|gain|cut|calorie|calories|protein|diet|meal|nutrition|workout|split|wazan|charbi|چربی|وزن|مسلز|ڈائٹ)\b/i.test(
      lower
    )
  ) {
    const isWeightLossFocus = /\b(fat|weight|lose|slim|belly|cut|charbi|wazan kam|چربی)\b/i.test(
      lower
    );
    const isMuscleFocus = /\b(muscle|bulk|hypertrophy|gain|strength|size|مسلز)\b/i.test(lower);

    if (useUrduScript) {
      return {
        text: `بہترین سوال ہے! **${coachName}** کی طرف سے آپ کے ہدف کے لیے سادہ اور مؤثر روڈمیپ:\n\n• **طاقت کی ورزش (Strength):** ہفتے میں 4 دن کمپاونڈ ورزشیں (Squats, Press, Rows) کریں تاکہ میٹابولزم تیز رہے۔\n• **پروٹین اور کیلوریز:** چربی کم کرنے کے لیے 350–450 kcal کا خسارہ رکھیں اور روزانہ **1.8g–2.0g فی کلو** پروٹین لیں۔\n• **روزانہ حرکت:** کھانے کے بعد چہل قدمی سمیت **8,000–10,000 قدم** مکمل کریں۔\n\nکیا آپ چاہیں گے کہ میں آپ کے وزن کے مطابق درست کیلوریز بتاؤں یا ٹرائل بُک کروں؟`,
        spokenText: `Great question! Here is a simple, effective roadmap from ${coachName}. Do 4 days of compound strength training per week. For fat loss keep a 350 to 450 calorie deficit with 1.8 to 2.0 grams of protein per kilogram. Hit 8,000 to 10,000 daily steps. Would you like help calculating your exact calories or booking a trial?`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial', '🧑‍🏫 Personal Trainers'],
      };
    }

    if (useRomanUrdu) {
      return {
        text: `Bohat acha sawaal hai! **${coachName}** ki taraf se aapke liye practical fitness plan:\n\n• **Strength Training:** Haftay mein **4 din** compound exercises (squats, push-ups/bench, rows) karein — yeh fat burn aur muscle dono ke liye best hai.\n• **Diet & Protein:** Rozana **350–450 kcal** deficit (fat loss ke liye) ya **+250 kcal** surplus (muscle gain ke liye), aur har kg weight par **1.8g–2.0g protein** (ande, chicken, daal, Greek yogurt) lein.\n• **Daily Steps:** Rozana **8,000–10,000 steps** aur 7+ ghantay ki neend zaroori hai.\n\nAapka current weight aur goal kya hai, taake main exact calories suggest kar sakoon?`,
        spokenText: `Great question! Here is a practical plan from ${coachName}. Train 4 days a week with compound movements. Keep a 350 to 450 calorie deficit for fat loss or a 250 calorie surplus for muscle gain, with 1.8 to 2.0 grams of protein per kilogram. Aim for 8,000 to 10,000 daily steps and 7 hours of sleep. What is your current weight and goal?`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial', '🧑‍🏫 Personal Trainers'],
      };
    }

    if (isWeightLossFocus && !isMuscleFocus) {
      return {
        text: `Great goal — sustainable fat loss comes down to keeping muscle while steadily burning fat. Here is how we coach it at **IronPulse**:\n\n• **Training Split:** Lift **4 days/week** (full-body or upper/lower) so your metabolism stays high.\n• **Smart Deficit:** Aim for **350–450 kcal below maintenance** with **2.0g protein per kg** of body weight to stay full.\n• **Daily Movement:** Hit **8,500–10,000 steps** daily — far gentler on joints than endless treadmill running.\n\nHave you tried our **BMI & Calorie Calculator** on the page yet, or would you like to book a **Free 3-Day Trial**?`,
        spokenText: `Great goal! Sustainable fat loss comes down to keeping muscle while steadily burning fat. Lift 4 days a week so your metabolism stays high. Aim for 350 to 450 calories below maintenance with 2.0 grams of protein per kilogram of body weight to stay full. Hit 8,500 to 10,000 daily steps. Have you tried our BMI and Calorie Calculator on the page yet, or would you like to book a Free 3-Day Trial?`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial', '💪 Membership Fees'],
      };
    }

    if (isMuscleFocus && !isWeightLossFocus) {
      return {
        text: `Let's build clean, dense strength! At **IronPulse**, our **Coach Adam** hypertrophy framework focuses on three pillars:\n\n• **Progressive Overload:** Train **4 days/week (Upper/Lower)** and add 1–2 reps or 2.5 kg weekly on key lifts.\n• **Lean Surplus & Protein:** Eat **+250 to +300 kcal above maintenance** with **1.8–2.2g protein/kg** daily.\n• **Recovery Matters:** Sleep 7–8 hours and use our **85°C Finnish Sauna** post-session to reduce soreness.\n\nWhat equipment or lifts do you enjoy most right now — barbells, dumbbells, or guided coaching?`,
        spokenText: `Let's build clean, dense strength! Our hypertrophy framework focuses on three pillars. Train 4 days a week using an Upper and Lower split with progressive overload. Eat 250 to 300 calories above maintenance with 1.8 to 2.2 grams of protein per kilogram daily. Sleep 7 to 8 hours and use our 85 degree Finnish sauna for recovery. What lifts do you enjoy most right now?`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial', '🧑‍🏫 Personal Trainers'],
      };
    }

    return {
      text: `Here is our proven **IronPulse 4-Day Blueprint** whether you're cutting fat or adding lean muscle:\n\n• **Fat Loss:** 4 strength sessions/week + **8,500–10,000 daily steps** + **400 kcal deficit** with **2.0g protein/kg**.\n• **Muscle Gain:** Upper/Lower 4-day split + **+250 kcal lean surplus** + weekly progressive overload.\n• **Recovery:** Hydrate with electrolytes and use our **sauna recovery suite** 2–3x weekly.\n\nWhich goal fits you best right now — **Fat Loss**, **Muscle Gain**, or **General Fitness**?`,
      spokenText: `Here is our proven IronPulse 4-Day Blueprint. For Fat Loss, combine 4 strength sessions a week with 8,500 to 10,000 daily steps and a 400 calorie deficit with 2.0 grams of protein per kilogram. For Muscle Gain, follow an Upper and Lower split with a 250 calorie lean surplus and progressive overload. Which goal fits you best right now?`,
      nextBookingState: { active: false, step: 'done' },
      quickOptions: ['🎟️ Book Free Trial', '🧑‍🏫 Personal Trainers'],
    };
  }

  // 4. Gym Timings & Locations
  if (
    input === '🕒 Gym Timings' ||
    /\b(time|timing|timings|hours|open|close|sunday|schedule|london|lahore|mayfair|gulberg|location|address|اوقات|ٹائمنگ|کھلتا|بند|لندن|لاہور)\b/i.test(
      lower
    )
  ) {
    if (useUrduScript) {
      return {
        text: `ہمارے **لندن (Mayfair)** اور **لاہور (Gulberg III)** اسٹوڈیوز کے اوقات یہ ہیں:\n\n• **پیر تا ہفتہ (Mon–Sat):** صبح **6:00 AM** سے رات **11:00 PM** تک\n• **اتوار (Sunday):** آلات کی مرمت اور صفائی کے لیے بند\n• **فری ٹرائل سیشنز:** 7:00 AM · 10:30 AM · 5:00 PM · 8:00 PM\n\nآپ کس اسٹوڈیو (لندن یا لاہور) میں وزٹ کرنا پسند کریں گے؟`,
        spokenText: `Our London Mayfair and Lahore Gulberg 3 studios are open Monday to Saturday from 6:00 AM to 11:00 PM, and closed on Sunday. Free trial slots are available at 7:00 AM, 10:30 AM, 5:00 PM, and 8:00 PM. Which studio would you like to visit?`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial'],
      };
    }

    if (useRomanUrdu) {
      return {
        text: `Hamare **London (Mayfair)** aur **Lahore (Gulberg III)** studios ke timings yeh hain:\n\n• **Mon – Sat:** Subah **6:00 AM** se raat **11:00 PM** tak open\n• **Sunday:** Deep cleaning aur equipment calibration ke liye off\n• **Trial Slots:** 7:00 AM, 10:30 AM, 5:00 PM, aur 8:00 PM\n\nAap **London** ya **Lahore** mein se kis studio par visit karna chahenge?`,
        spokenText: `Our London Mayfair and Lahore Gulberg 3 studios are open Monday to Saturday from 6:00 AM to 11:00 PM, and closed on Sundays. Trial slots are 7:00 AM, 10:30 AM, 5:00 PM, and 8:00 PM. Which studio would you like to visit?`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial'],
      };
    }

    return {
      text: `Both of our flagship studios (**London Mayfair** & **Lahore Gulberg III**) run on the same consistent schedule:\n\n• **Monday – Saturday:** **6:00 AM – 11:00 PM**\n• **Sunday:** Closed for deep equipment calibration & sauna maintenance\n• **Trial Coaching Slots:** 7:00 AM · 10:30 AM · 5:00 PM · 8:00 PM\n\nWhich city and time slot suits your routine best?`,
      spokenText: `Both our London Mayfair and Lahore Gulberg 3 studios are open Monday through Saturday from 6:00 AM to 11:00 PM, and closed on Sundays for deep maintenance. Free trial coaching slots are available at 7:00 AM, 10:30 AM, 5:00 PM, and 8:00 PM. Which city and time slot suits your routine best?`,
      nextBookingState: { active: false, step: 'done' },
      quickOptions: ['🎟️ Book Free Trial'],
    };
  }

  // 5. Personal Trainers & Sauna
  if (
    input === '🧑‍🏫 Personal Trainers' ||
    /\b(trainer|trainers|coach|coaches|sara|adam|hamza|pt|sauna|steam|recovery|کوچ|ٹرینر|سونا)\b/i.test(
      lower
    )
  ) {
    const dayPassPrice = currency === 'GBP' ? '£15' : 'Rs 1,500';
    if (useUrduScript) {
      return {
        text: `ہمارے سرٹیفائیڈ کوچز آپ کے ہر قدم پر رہنمائی کے لیے موجود ہیں:\n\n• **Coach Sara:** Fat Loss، خواتین و مردوں کی اسٹرینتھ اور موبیلٹی اسپیشلسٹ\n• **Coach Adam:** پاور لفٹنگ، ہائپرٹرافی اور باربیل ٹیکنیک\n• **Coach Hamza:** ایتھلیٹک کنڈیشننگ اور کسٹم ڈائٹ پلان\n• **سونا ریکوری:** 85°C سیڈر فِنش سونا (ڈے پاس ${dayPassPrice})\n\nکیا آپ کسی کوچ کے ساتھ تعارفی سیشن بُک کرنا چاہیں گے؟`,
        spokenText: `Our certified coaches are here to guide every step. Coach Sara specializes in fat loss and mobility. Coach Adam leads powerlifting and hypertrophy. Coach Hamza covers athletic conditioning and custom nutrition. Would you like to book an intro session?`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial', '💪 Membership Fees'],
      };
    }

    if (useRomanUrdu) {
      return {
        text: `Hamari **IronPulse Coaching Team** aapki har goal mein madad karti hai:\n\n• **Coach Sara:** Fat loss, core strength aur posture mobility specialist\n• **Coach Adam:** Powerlifting, muscle hypertrophy aur heavy lifting form\n• **Coach Hamza:** Athletic conditioning aur South Asian/UK meal plans\n• **Recovery Suite:** 85°C Cedar Sauna bhi available hai (Day Pass ${dayPassPrice})\n\nKya aap **VIP 1-on-1** coaching try karna chahenge ya pehle Free Trial?`,
        spokenText: `Our IronPulse Coaching Team is ready to help. Coach Sara leads fat loss and mobility. Coach Adam handles powerlifting and muscle hypertrophy. Coach Hamza builds athletic conditioning and custom meal plans. Would you like to try VIP 1-on-1 coaching or start with a Free Trial?`,
        nextBookingState: { active: false, step: 'done' },
        quickOptions: ['🎟️ Book Free Trial', '💪 Membership Fees'],
      };
    }

    return {
      text: `You'll be in great hands with our certified **IronPulse Coaching Team**:\n\n• **Coach Sara:** Fat Loss, Postural Mobility & Women's Strength\n• **Coach Adam:** Powerlifting, Hypertrophy & Barbell Mechanics\n• **Coach Hamza:** Athletic Conditioning & Custom Macro Nutrition\n• **Bonus Recovery:** VIP PT & Day Passes (${dayPassPrice}) include our **85°C Cedar Finnish Sauna**\n\nWould you like to book a **Free 3-Day Trial** to meet the team in person?`,
      spokenText: `You'll be in great hands with our certified IronPulse Coaching Team. Coach Sara specializes in Fat Loss, Postural Mobility, and Women's Strength. Coach Adam leads Powerlifting, Hypertrophy, and Barbell Mechanics. Coach Hamza covers Athletic Conditioning and Custom Macro Nutrition. Would you like to book a Free 3-Day Trial to meet the team in person?`,
      nextBookingState: { active: false, step: 'done' },
      quickOptions: ['🎟️ Book Free Trial', '💪 Membership Fees'],
    };
  }

  // 6. Greetings ("aoa", "assalam o alaikum", "hi", "hello", "hey")
  if (
    /^(aoa|assalam|salam|hi|hello|hey|good morning|good afternoon|good evening|yo|hola|سلام)/i.test(
      lower
    )
  ) {
    if (useUrduScript) {
      return {
        text: `وعلیکم السلام! میں **${coachName}** ہوں، **IronPulse Fitness Studio** سے۔ آج آپ کی کیسے مدد کر سکتا ہوں؟\n\n• **ممبرشپ فیس** اور پلانز دیکھیں\n• **وزن کم کرنے یا مسلز بنانے** کا پلان پوچھیں\n• **3 دن کا فری ٹرائل** فوراً بُک کریں\n\nبتائیں آج آپ کا فٹنس ہدف کیا ہے؟`,
        spokenText: `Walaikum Assalam! I'm ${coachName} from IronPulse Fitness Studio. I can help you explore membership fees, fat loss or muscle building plans, or book your Free 3-Day Trial. What is your main fitness goal today?`,
        nextBookingState: { active: false, step: 'done' },
      };
    }

    if (useRomanUrdu) {
      return {
        text: `Walaikum Assalam! Main **${coachName}** hoon **IronPulse Fitness (London & Lahore)** se. Umeed hai aap bilkul fit aur khairiyat se honge!\n\n• **Membership Fees** (${currency}) check karein\n• **Weight Loss / Muscle Gain** ka diet & workout plan lein\n• **Free 3-Day Trial Pass** abhi book karein\n\nBatayein main aapki kya madad kar sakta hoon?`,
        spokenText: `Walaikum Assalam! I'm ${coachName} from IronPulse Fitness Studio. I can share our membership fees, build a weight loss or muscle gain plan, or book your Free 3-Day Trial Pass. How can I help you today?`,
        nextBookingState: { active: false, step: 'done' },
      };
    }

    return {
      text: `Hey there! I'm **${coachName}** at **IronPulse Fitness Studio** (London & Lahore). Welcome in!\n\n• Ask for **fat loss, muscle gain, or nutrition** tips\n• Check our **${currency} membership plans** & studio timings (Mon–Sat 6 AM – 11 PM)\n• Claim a **Free 3-Day Trial Pass** in 30 seconds\n\nWhat fitness goal are you working toward right now?`,
      spokenText: `Hey there! I'm ${coachName} at IronPulse Fitness Studio. You can ask me for fat loss, muscle gain, or nutrition tips, check our membership plans and studio timings, or claim a Free 3-Day Trial Pass in 30 seconds. What fitness goal are you working toward right now?`,
      nextBookingState: { active: false, step: 'done' },
    };
  }

  // 7. Beginner / General Fitness / Conversational Catch-All
  if (useUrduScript) {
    return {
      text: `میں **${coachName}** ہوں، اور آپ کی مدد کے لیے حاضر ہوں!\n\n• **ورزش و ڈائٹ:** وزن کم کرنے، مسلز بنانے یا پروٹین ٹارگٹ کے لیے رہنمائی\n• **اسٹوڈیو تفصیلات:** لندن اور لاہور کے اوقات (پیر تا ہفتہ، 6 AM – 11 PM) اور فیس (${currency})\n• **فری ٹرائل:** 3 دن کا مفت پاس فوراً بُک کریں\n\nآپ کس موضوع پر تفصیل چاہیں گے؟`,
      spokenText: `I'm ${coachName}, here to help you! I can guide you on workouts and diet, studio timings and fees, or book your Free 3-Day Trial. What would you like to explore first?`,
      nextBookingState: { active: false, step: 'done' },
    };
  }

  if (useRomanUrdu) {
    return {
      text: `Zaroor! Main **${coachName}** hoon aur aapki poori help karne ke liye ready hoon:\n\n• **Workout & Diet:** Chahe aap beginner hon ya experienced, main fat loss ya muscle gain split bata sakta hoon\n• **Gym Timings & Fees:** Mon–Sat **6:00 AM – 11:00 PM** (London & Lahore), plans start from **${currency === 'GBP' ? '£35' : 'Rs 5,000'}/month**\n• **Free Trial:** Aap bina kisi commitment ke **3-Day Free Trial** le sakte hain\n\nKya aap apna goal share karna chahenge ya trial book karein?`,
      spokenText: `Sure! I'm ${coachName} and ready to help. Whether you're a beginner or experienced, I can guide your workout and diet, share our Mon to Sat 6 AM to 11 PM timings and fees, or book a Free 3-Day Trial. Would you like to share your goal or book a trial?`,
      nextBookingState: { active: false, step: 'done' },
    };
  }

  return {
    text: `Great question — I'm **${coachName}**, your 24/7 IronPulse Fitness coach, and I'd love to help with that!\n\n• **Tailored Guidance:** Tell me your current goal (e.g., *lose 5 kg*, *build strength*, or *beginner routine*) for an instant plan\n• **Studio Access:** Open **Mon–Sat 6:00 AM – 11:00 PM** in London & Lahore, starting at **${currency === 'GBP' ? '£35' : 'Rs 5,000'}/month**\n• **Try It Free:** Book a **Free 3-Day Trial** right here in chat\n\nWhat's your biggest fitness priority over the next 8 weeks?`,
    spokenText: `Great question! I'm ${coachName}, your 24/7 IronPulse Fitness coach, and I'd love to help. Tell me your current fitness goal for an instant plan, ask about our London and Lahore studios open Monday to Saturday 6 AM to 11 PM, or book a Free 3-Day Trial right here in chat. What's your biggest fitness priority over the next 8 weeks?`,
    nextBookingState: { active: false, step: 'done' },
  };
}
