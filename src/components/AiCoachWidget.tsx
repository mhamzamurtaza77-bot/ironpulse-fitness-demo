import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Currency } from '../data/fitnessData';
import {
  BookingFlowState,
  CoachGender,
  CoachLanguage,
  ConfirmedTrialPass,
  generateCoachReply,
  QUICK_ACTION_CHIPS,
} from '../utils/aiCoachResponder';

interface ChatMessage {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  quickOptions?: string[];
  confirmedPass?: ConfirmedTrialPass;
}

interface AiCoachWidgetProps {
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  currency: Currency;
  queuedPrompt: string | null;
  onConsumeQueuedPrompt: () => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstanceLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

const FEMALE_VOICE_PRIORITY = [
  'Natural',
  'Online',
  'Jenny',
  'Sonia',
  'Libby',
  'Aria',
  'Samantha',
  'Google UK English Female',
];

const MALE_VOICE_PRIORITY = [
  'Natural',
  'Online',
  'Guy',
  'Ryan',
  'Andrew',
  'Christopher',
  'Daniel',
  'David',
  'Google UK English Male',
  'Alex',
];

const KNOWN_FEMALE_MARKERS = [
  'jenny',
  'sonia',
  'libby',
  'aria',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'fiona',
  'kate',
  'serena',
  'susan',
  'zira',
  'hazel',
  'heera',
  'veena',
  'kalpana',
  'raveena',
  'uzma',
  'female',
  'woman',
  'ava',
  'emma',
  'allison',
  'sara',
];

const KNOWN_MALE_MARKERS = [
  'guy',
  'ryan',
  'andrew',
  'christopher',
  'daniel',
  'david',
  'george',
  'alex',
  'mark',
  'richard',
  'thomas',
  'oliver',
  'arthur',
  'aaron',
  'fred',
  'rishi',
  'prabhat',
  'hemant',
  'asad',
  'male',
  'man',
];

function containsWholeWord(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(lower));
}

function createWelcomeMessage(language: CoachLanguage, gender: CoachGender): ChatMessage {
  const coachName = gender === 'female' ? 'Coach Sara' : 'Coach Adam';
  return {
    id: 'welcome-msg',
    sender: 'coach',
    text:
      language === 'UR'
        ? `خوش آمدید! میں **${coachName}** ہوں، **IronPulse** کی 24/7 AI فٹنس کوچ۔\n\n• ممبرشپ فیس، وزن کم کرنے یا مسلز بنانے کا پلان پوچھیں\n• نیچے کلک کر کے **3 دن کا فری ٹرائل** بُک کریں\n\nبتائیں آج میں آپ کی کیا مدد کر سکتا ہوں؟`
        : `Hi there! I'm **${coachName}**, your 24/7 **IronPulse Fitness** AI coach.\n\n• Ask about fat loss, muscle building, or diet plans\n• Check London & Lahore timings and membership fees\n• Tap **🎟️ Book Free Trial** below to claim your 3-day pass\n\nWhat fitness goal are you working on today?`,
  };
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^\s*[-•*#]+\s*/gm, '')
    .replace(/[#_]/g, '')
    .replace(/·/g, ', ')
    .replace(/\bMon\s*[–-]\s*Sat\b/gi, 'Monday to Saturday')
    .replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2')
    .replace(/\bRs\s+/g, 'Rupees ')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (/[.!?۔:]$/.test(line) ? line : `${line}.`))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoSpeakableChunks(rawText: string): string[] {
  const normalized = cleanTextForSpeech(rawText);
  if (!normalized) return [];

  const rawSentences = normalized.match(/[^.!?۔]+[.!?۔]*/g) ?? [normalized];
  const chunks: string[] = [];
  const MAX_CHUNK_LEN = 165;

  for (const rawSentence of rawSentences) {
    const sentence = rawSentence.trim();
    if (!sentence) continue;

    if (sentence.length <= MAX_CHUNK_LEN) {
      chunks.push(sentence);
      continue;
    }

    const words = sentence.split(/\s+/);
    let current = '';
    for (const word of words) {
      if (current.length + word.length + 1 > MAX_CHUNK_LEN) {
        if (current) chunks.push(current.trim());
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
    }
  }

  return chunks;
}

/**
 * Safely renders **bold** spans and bullet lines without innerHTML injection.
 */
function renderInlineBold(line: string, isUser: boolean): ReactNode[] {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong
          key={idx}
          className={isUser ? 'font-bold text-[#090D16]' : 'font-semibold text-white'}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function FormattedMessageContent({
  text,
  isUser,
}: {
  text: string;
  isUser: boolean;
}) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) {
          return <div key={idx} className="h-1" aria-hidden="true" />;
        }

        const bulletMatch = line.match(/^(?:•|-|\*)\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5">
              <span
                aria-hidden="true"
                className={
                  isUser ? 'text-[#090D16] font-bold' : 'text-[#C8F135] font-bold'
                }
              >
                •
              </span>
              <span className="flex-1">{renderInlineBold(bulletMatch[1], isUser)}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInlineBold(line, isUser)}</p>;
      })}
    </div>
  );
}

interface PendingSpeechRequest {
  id: string;
  text: string;
  lang: CoachLanguage;
  gender: CoachGender;
}

export function AiCoachWidget({
  isOpen,
  onToggleOpen,
  currency,
  queuedPrompt,
  onConsumeQueuedPrompt,
}: AiCoachWidgetProps) {
  const [language, setLanguage] = useState<CoachLanguage>('EN');
  const [coachGender, setCoachGender] = useState<CoachGender>('female');
  const [speakerEnabled, setSpeakerEnabled] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [voiceHint, setVoiceHint] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [bookingState, setBookingState] = useState<BookingFlowState>({
    active: false,
    step: 'done',
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage('EN', 'female'),
  ]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [pendingSpeech, setPendingSpeech] = useState<PendingSpeechRequest | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const speechSessionRef = useRef<number>(0);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const handleSendMessageRef = useRef<(text: string) => void>(() => {});

  // Load browser speech synthesis voices cleanly
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const stopSpeaking = () => {
    speechSessionRef.current += 1;
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
      recognitionRef.current?.stop();
    };
  }, []);

  /**
   * Strict gender-aware voice selector:
   * - Female (Coach Sara): prioritizes Natural/Online + Jenny/Sonia/Libby/Aria/Samantha/Google UK English Female, never picks a known male voice.
   * - Male (Coach Adam): filters out ALL known female voices first, then prioritizes Natural/Online + Guy/Ryan/Andrew/Christopher/Daniel/David/Google UK English Male/Alex.
   */
  const selectPreferredVoice = (
    gender: CoachGender,
    lang: CoachLanguage
  ): { voice: SpeechSynthesisVoice | null; hasUrduVoice: boolean } => {
    if (availableVoices.length === 0) {
      return { voice: null, hasUrduVoice: false };
    }

    const urduVoices = availableVoices.filter((v) =>
      v.lang.toLowerCase().startsWith('ur')
    );

    if (lang === 'UR' && urduVoices.length > 0) {
      const genderSafeUrdu =
        gender === 'male'
          ? urduVoices.find((v) => !containsWholeWord(v.name, KNOWN_FEMALE_MARKERS))
          : urduVoices.find((v) => !containsWholeWord(v.name, KNOWN_MALE_MARKERS));
      if (genderSafeUrdu) {
        return { voice: genderSafeUrdu, hasUrduVoice: true };
      }
      return { voice: urduVoices[0], hasUrduVoice: true };
    }

    const englishVoices = availableVoices.filter((v) =>
      v.lang.toLowerCase().startsWith('en')
    );
    const pool = englishVoices.length > 0 ? englishVoices : availableVoices;

    if (gender === 'male') {
      // Strictly exclude all known female voices when Male is selected
      const nonFemalePool = pool.filter(
        (v) => !containsWholeWord(v.name, KNOWN_FEMALE_MARKERS)
      );

      // 1. Best match: Natural/Online AND explicit male voice name
      const naturalMale = nonFemalePool.find((v) => {
        const lower = v.name.toLowerCase();
        const isNaturalOrOnline =
          lower.includes('natural') || lower.includes('online');
        const isExplicitMale = MALE_VOICE_PRIORITY.slice(2).some((token) =>
          lower.includes(token.toLowerCase())
        );
        return isNaturalOrOnline && isExplicitMale;
      });
      if (naturalMale) {
        return { voice: naturalMale, hasUrduVoice: urduVoices.length > 0 };
      }

      // 2. Priority match across exact male priority list
      for (const token of MALE_VOICE_PRIORITY.slice(2)) {
        const matched = nonFemalePool.find((v) =>
          v.name.toLowerCase().includes(token.toLowerCase())
        );
        if (matched) {
          return { voice: matched, hasUrduVoice: urduVoices.length > 0 };
        }
      }

      // 3. Any remaining non-female Natural/Online voice
      const naturalNonFemale = nonFemalePool.find((v) => {
        const lower = v.name.toLowerCase();
        return lower.includes('natural') || lower.includes('online');
      });
      if (naturalNonFemale) {
        return { voice: naturalNonFemale, hasUrduVoice: urduVoices.length > 0 };
      }

      // 4. Any non-female voice (prefer en-GB / en-US)
      const fallbackMale =
        nonFemalePool.find((v) => v.lang.toLowerCase().startsWith('en-gb')) ||
        nonFemalePool[0] ||
        null;
      return { voice: fallbackMale, hasUrduVoice: urduVoices.length > 0 };
    }

    // Female (Coach Sara): strictly exclude known male voices
    const nonMalePool = pool.filter(
      (v) => !containsWholeWord(v.name, KNOWN_MALE_MARKERS)
    );

    const naturalFemale = nonMalePool.find((v) => {
      const lower = v.name.toLowerCase();
      const isNaturalOrOnline =
        lower.includes('natural') || lower.includes('online');
      const isExplicitFemale = FEMALE_VOICE_PRIORITY.slice(2).some((token) =>
        lower.includes(token.toLowerCase())
      );
      return isNaturalOrOnline && isExplicitFemale;
    });
    if (naturalFemale) {
      return { voice: naturalFemale, hasUrduVoice: urduVoices.length > 0 };
    }

    for (const token of FEMALE_VOICE_PRIORITY.slice(2)) {
      const matched = nonMalePool.find((v) =>
        v.name.toLowerCase().includes(token.toLowerCase())
      );
      if (matched) {
        return { voice: matched, hasUrduVoice: urduVoices.length > 0 };
      }
    }

    const naturalNonMale = nonMalePool.find((v) => {
      const lower = v.name.toLowerCase();
      return lower.includes('natural') || lower.includes('online');
    });
    if (naturalNonMale) {
      return { voice: naturalNonMale, hasUrduVoice: urduVoices.length > 0 };
    }

    const fallbackFemale =
      nonMalePool.find((v) => v.lang.toLowerCase().startsWith('en-gb')) ||
      nonMalePool[0] ||
      null;
    return { voice: fallbackFemale, hasUrduVoice: urduVoices.length > 0 };
  };

  const speakFullMessageSequentially = (
    rawText: string,
    genderOverride?: CoachGender,
    langOverride?: CoachLanguage
  ) => {
    if (
      !speakerEnabled ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    const chunks = splitIntoSpeakableChunks(rawText);
    if (chunks.length === 0) return;

    stopSpeaking();
    const sessionId = speechSessionRef.current;
    const activeGender = genderOverride ?? coachGender;
    const activeLang = langOverride ?? language;
    const { voice } = selectPreferredVoice(activeGender, activeLang);

    setIsSpeaking(true);

    const speakChunkAt = (index: number) => {
      if (speechSessionRef.current !== sessionId) {
        return;
      }
      if (index >= chunks.length) {
        activeUtteranceRef.current = null;
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      activeUtteranceRef.current = utterance;

      if (voice) {
        utterance.voice = voice;
      }

      if (activeGender === 'female') {
        utterance.pitch = 1.04;
        utterance.rate = 0.94;
      } else {
        utterance.pitch = 0.92;
        utterance.rate = 0.95;
      }

      utterance.onend = () => {
        if (speechSessionRef.current === sessionId) {
          speakChunkAt(index + 1);
        }
      };

      utterance.onerror = (event) => {
        if (speechSessionRef.current !== sessionId) return;
        if (event.error === 'canceled' || event.error === 'interrupted') {
          activeUtteranceRef.current = null;
          setIsSpeaking(false);
          return;
        }
        speakChunkAt(index + 1);
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    };

    speakChunkAt(0);
  };

  // Auto-scroll to newest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  // Trigger speech AFTER the full message bubble is rendered in the DOM
  useEffect(() => {
    if (!pendingSpeech) return;
    const request = pendingSpeech;
    setPendingSpeech(null);

    const frameId = window.requestAnimationFrame(() => {
      speakFullMessageSequentially(request.text, request.gender, request.lang);
    });

    return () => window.cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSpeech]);

  // Handle queued prompt sent from BMI Calculator or Hero CTA
  useEffect(() => {
    if (isOpen && queuedPrompt) {
      void handleSendMessage(queuedPrompt);
      onConsumeQueuedPrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, queuedPrompt]);

  const appendCoachMessageAndSpeak = (
    coachMsg: ChatMessage,
    spokenFallbackText: string,
    activeGender: CoachGender,
    activeLang: CoachLanguage
  ) => {
    setMessages((prev) => [...prev, coachMsg]);

    const { hasUrduVoice } = selectPreferredVoice(activeGender, activeLang);
    const containsUrduChars = /[\u0600-\u06FF]/.test(coachMsg.text);
    const fullSpeechText =
      containsUrduChars && !hasUrduVoice ? spokenFallbackText : coachMsg.text;

    setPendingSpeech({
      id: coachMsg.id,
      text: fullSpeechText,
      lang: activeLang,
      gender: activeGender,
    });
  };

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text: trimmed,
    };

    // Always append user message immediately
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    const isChipInterruption =
      trimmed === '💪 Membership Fees' ||
      trimmed === '🔥 Fat Loss / Muscle Plan' ||
      trimmed === '🕒 Gym Timings' ||
      trimmed === '🧑‍🏫 Personal Trainers';

    const isBookingFlowTurn =
      trimmed === '🎟️ Book Free Trial' ||
      (bookingState.active && !isChipInterruption) ||
      /\b(free trial|book trial|trial pass|3-day|3 day|demo pass|ٹرائل|فری ٹرائل)\b/i.test(
        trimmed.toLowerCase()
      );

    // Deterministic 3-step Free Trial Pass flow (guaranteed WhatsApp pass card)
    if (isBookingFlowTurn) {
      const reply = generateCoachReply(
        trimmed,
        language,
        coachGender,
        currency,
        bookingState
      );
      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'coach',
        text: reply.text,
        quickOptions: reply.quickOptions,
        confirmedPass: reply.confirmedPass,
      };
      setBookingState(reply.nextBookingState);
      appendCoachMessageAndSpeak(coachMsg, reply.spokenText, coachGender, language);
      return;
    }

    // Dual-Mode Intelligent Brain: Try live Gemini via /api/coach first, seamlessly fall back to local conversational responder
    setBookingState({ active: false, step: 'done' });
    setIsThinking(true);

    let liveGeminiText: string | null = null;
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
          coachGender,
          language,
          currency,
        }),
      });
      window.clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as { fallback?: boolean; text?: string };
        if (!data.fallback && typeof data.text === 'string' && data.text.trim()) {
          liveGeminiText = data.text.trim();
        }
      }
    } catch {
      // Seamless silent fallback on network/Vercel/missing-API environments
    } finally {
      setIsThinking(false);
    }

    if (liveGeminiText) {
      const fallbackReference = generateCoachReply(
        trimmed,
        language,
        coachGender,
        currency,
        { active: false, step: 'done' }
      );
      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'coach',
        text: liveGeminiText,
      };
      appendCoachMessageAndSpeak(
        coachMsg,
        fallbackReference.spokenText,
        coachGender,
        language
      );
      return;
    }

    const fallbackReply = generateCoachReply(
      trimmed,
      language,
      coachGender,
      currency,
      { active: false, step: 'done' }
    );
    const coachMsg: ChatMessage = {
      id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'coach',
      text: fallbackReply.text,
      quickOptions: fallbackReply.quickOptions,
      confirmedPass: fallbackReply.confirmedPass,
    };
    appendCoachMessageAndSpeak(
      coachMsg,
      fallbackReply.spokenText,
      coachGender,
      language
    );
  };

  handleSendMessageRef.current = (msgText: string) => {
    void handleSendMessage(msgText);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSendMessage(inputValue);
  };

  const handleClearChat = () => {
    stopSpeaking();
    setPendingSpeech(null);
    setIsThinking(false);
    setBookingState({ active: false, step: 'done' });
    setMessages([createWelcomeMessage(language, coachGender)]);
    setVoiceHint('');
  };

  const handleLanguageChange = (nextLang: CoachLanguage) => {
    setLanguage(nextLang);
    stopSpeaking();
    setPendingSpeech(null);
    setIsThinking(false);
    setBookingState({ active: false, step: 'done' });
    setMessages([createWelcomeMessage(nextLang, coachGender)]);
  };

  const handleGenderChange = (nextGender: CoachGender) => {
    setCoachGender(nextGender);
    const coachLabel = nextGender === 'female' ? 'Coach Sara' : 'Coach Adam';
    const switchText =
      language === 'UR'
        ? `اب آپ **${coachLabel}** سے بات کر رہے ہیں۔ بتائیں آج کس فٹنس ہدف پر کام کرنا ہے؟`
        : `Switched to **${coachLabel}**. How can I help with your training or trial booking today?`;

    const switchNote: ChatMessage = {
      id: `switch-${Date.now()}`,
      sender: 'coach',
      text: switchText,
    };
    appendCoachMessageAndSpeak(
      switchNote,
      `Switched to ${coachLabel}. How can I help with your training or trial booking today?`,
      nextGender,
      language
    );
  };

  const handleToggleSpeaker = () => {
    setSpeakerEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stopSpeaking();
      }
      return next;
    });
  };

  const handleToggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionInstanceLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstanceLike;
      }).SpeechRecognition ||
      (window as unknown as {
        webkitSpeechRecognition?: new () => SpeechRecognitionInstanceLike;
      }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setVoiceHint('Voice mic is unavailable in this browser — type your question below.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = language === 'UR' ? 'ur-PK' : 'en-GB';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onToggleOpen(true);
          handleSendMessageRef.current(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceHint('Microphone permission denied or unavailable.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setVoiceHint('');
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceHint('Could not start voice microphone.');
    }
  };

  return (
    <>
      {/* Minimized Floating Launcher */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => onToggleOpen(true)}
          aria-label="Open Ask IronPulse 24/7 Voice and Chat AI Fitness Coach"
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 px-4 py-3.5 rounded-full bg-[#C8F135] text-[#090D16] font-bold text-sm shadow-2xl hover:bg-[#d8fb54] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <MessageSquare className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">Ask IronPulse AI Coach</span>
        </button>
      )}

      {/* Expanded Viewport-Safe Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.section
            role="dialog"
            aria-label="Ask IronPulse — 24/7 Voice & Chat AI Fitness Coach"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl bg-[#0F1523] border border-white/20"
          >
            {/* Header */}
            <div className="bg-[#131B2E] border-b border-white/10 px-4 py-3 space-y-2.5 shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#C8F135] shrink-0" aria-hidden="true" />
                    <h2 className="font-display text-lg font-bold text-white leading-tight truncate">
                      Ask IronPulse
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {isSpeaking
                      ? `${coachGender === 'female' ? 'Coach Sara' : 'Coach Adam'} is reading full reply...`
                      : '24/7 Voice & Chat AI Fitness Coach'}
                  </p>
                </div>

                {/* Header Action Controls: Speaker Auto-Read, Clear Chat, Close */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleSpeaker}
                    aria-label={speakerEnabled ? 'Mute voice replies' : 'Enable voice auto-read'}
                    title={speakerEnabled ? 'Speaker Auto-Read: ON' : 'Speaker Auto-Read: OFF'}
                    className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      speakerEnabled
                        ? 'text-[#C8F135] bg-white/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {speakerEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>{speakerEnabled ? 'Voice' : 'Muted'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearChat}
                    aria-label="Clear Chat"
                    title="Clear Chat"
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Clear Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      onToggleOpen(false);
                    }}
                    aria-label="Minimize AI Coach"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Language & Voice Switcher Row */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                {/* EN | اردو Toggle */}
                <div
                  role="group"
                  aria-label="Coach Language"
                  className="inline-flex p-0.5 rounded-lg bg-[#090D16] border border-white/10 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('EN')}
                    className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      language === 'EN'
                        ? 'bg-[#C8F135] text-[#090D16]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('UR')}
                    className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      language === 'UR'
                        ? 'bg-[#D4AF37] text-[#090D16]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    اردو
                  </button>
                </div>

                {/* Female (Coach Sara) | Male (Coach Adam) Voice Switcher */}
                <div
                  role="group"
                  aria-label="Coach Voice Persona"
                  className="inline-flex p-0.5 rounded-lg bg-[#090D16] border border-white/10 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => handleGenderChange('female')}
                    className={`px-2 py-1 rounded-md text-[10.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      coachGender === 'female'
                        ? 'bg-white text-[#090D16] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Female (Coach Sara)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderChange('male')}
                    className={`px-2 py-1 rounded-md text-[10.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      coachGender === 'male'
                        ? 'bg-white text-[#090D16] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Male (Coach Adam)
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3.5 space-y-3 bg-[#090D16]">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const isRtlText = !isUser && /[\u0600-\u06FF]/.test(msg.text);
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      dir={isRtlText ? 'auto' : 'ltr'}
                      className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                        isUser
                          ? 'bg-[#C8F135] text-[#090D16] font-medium rounded-br-sm'
                          : 'bg-[#131B2E] text-slate-100 border border-white/10 rounded-bl-sm'
                      }`}
                    >
                      <FormattedMessageContent text={msg.text} isUser={isUser} />
                      {!isUser && (
                        <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSpeakerEnabled(true);
                              speakFullMessageSequentially(msg.text, coachGender, language);
                            }}
                            aria-label="Read reply aloud"
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-[#C8F135] transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-3 h-3" aria-hidden="true" />
                            <span>Listen</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Step-specific clickable options during booking flow */}
                    {msg.quickOptions && msg.quickOptions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-w-[92%]">
                        {msg.quickOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => void handleSendMessage(opt)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#151D2F] border border-[#D4AF37]/40 text-[11px] font-medium text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#090D16] transition-colors cursor-pointer"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Confirmed Pass Card from In-Chat Booking Flow */}
                    {msg.confirmedPass && (
                      <div className="mt-2.5 w-full max-w-[94%] p-3.5 rounded-xl bg-[#131B2E] border border-[#C8F135]/60 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C8F135]">
                            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Free 3-Day Trial Pass</span>
                          </span>
                          <span className="font-mono-num text-[11px] font-semibold text-white">
                            {msg.confirmedPass.passCode}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 space-y-1 border-t border-white/10 pt-2">
                          <p>
                            <span className="text-slate-400">Name:</span>{' '}
                            <span className="text-white font-medium">
                              {msg.confirmedPass.name}
                            </span>
                          </p>
                          <p>
                            <span className="text-slate-400">Goal:</span>{' '}
                            <span className="text-white font-medium">
                              {msg.confirmedPass.goal}
                            </span>
                          </p>
                          <p>
                            <span className="text-slate-400">Session:</span>{' '}
                            <span className="text-white font-medium">
                              {msg.confirmedPass.slot}
                            </span>
                          </p>
                        </div>

                        <a
                          href={msg.confirmedPass.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#C8F135] text-[#090D16] text-xs font-bold hover:bg-[#d8fb54] transition-colors"
                        >
                          <span>Confirm on WhatsApp ↗</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}

              {isThinking && (
                <div className="flex items-start">
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-[#131B2E] border border-white/10 text-xs text-slate-300">
                    {coachGender === 'female' ? 'Coach Sara' : 'Coach Adam'} is typing...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 5 Quick-Action Chips */}
            <div className="px-3 py-2 bg-[#0D1320] border-t border-white/10 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_ACTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => void handleSendMessage(chip)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#151D2F] border border-white/10 text-[11px] font-medium text-slate-200 hover:border-[#C8F135] hover:text-[#C8F135] transition-colors whitespace-nowrap cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Voice Error / Hint */}
            {voiceHint && (
              <div className="px-3.5 py-1.5 bg-[#151D2F] text-[11px] text-amber-300 border-t border-white/10 shrink-0">
                {voiceHint}
              </div>
            )}

            {/* Input Form + Mic Button */}
            <form
              onSubmit={handleSubmit}
              className="p-2.5 bg-[#131B2E] border-t border-white/10 flex items-center gap-2 shrink-0"
            >
              <button
                type="button"
                onClick={handleToggleMic}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                className={`p-2.5 rounded-xl border transition-colors shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                    : 'bg-[#090D16] border-white/15 text-slate-300 hover:text-[#C8F135] hover:border-[#C8F135]'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening...'
                    : language === 'UR'
                    ? 'اپنا سوال لکھیں یا بولیں...'
                    : 'Ask about fees, fat loss, or trial...'
                }
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#090D16] border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C8F135]"
              />

              <button
                type="submit"
                disabled={isThinking}
                aria-label="Send message"
                className="p-2.5 rounded-xl bg-[#C8F135] text-[#090D16] hover:bg-[#d8fb54] disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
