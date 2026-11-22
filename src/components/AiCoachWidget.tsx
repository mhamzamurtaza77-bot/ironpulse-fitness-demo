import { useEffect, useRef, useState, type FormEvent } from 'react';
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
  'Ryan',
  'Guy',
  'Daniel',
  'George',
  'Google UK English Male',
  'Alex',
];

function createWelcomeMessage(language: CoachLanguage, gender: CoachGender): ChatMessage {
  const coachName = gender === 'female' ? 'Coach Sara' : 'Coach Adam';
  return {
    id: 'welcome-msg',
    sender: 'coach',
    text:
      language === 'UR'
        ? `خوش آمدید! میں ${coachName} ہوں، IronPulse کی 24/7 AI فٹنس کوچ۔ آپ مجھ سے ممبرشپ فیس، وزن کم کرنے یا مسلز پلان، جم اوقات پوچھ سکتے ہیں یا 3 دن کا فری ٹرائل بُک کر سکتے ہیں۔`
        : `Hi there! I'm ${coachName}, your 24/7 IronPulse AI Fitness Coach. Ask about memberships, fat loss/muscle splits, London & Lahore timings, or tap a chip below to claim your Free 3-Day Trial.`,
  };
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[•*#_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);

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

  // Scroll to newest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle queued prompt sent from BMI Calculator or Hero CTA
  useEffect(() => {
    if (isOpen && queuedPrompt) {
      handleSendMessage(queuedPrompt);
      onConsumeQueuedPrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, queuedPrompt]);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const selectPreferredVoice = (gender: CoachGender): SpeechSynthesisVoice | null => {
    if (availableVoices.length === 0) return null;
    const priorityList =
      gender === 'female' ? FEMALE_VOICE_PRIORITY : MALE_VOICE_PRIORITY;

    for (const token of priorityList) {
      const matched = availableVoices.find(
        (v) =>
          v.name.toLowerCase().includes(token.toLowerCase()) &&
          (gender === 'female'
            ? !v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('female')
            : !v.name.toLowerCase().includes('female'))
      );
      if (matched) return matched;
    }

    // Fallback to English voice
    return (
      availableVoices.find((v) => v.lang.toLowerCase().startsWith('en-gb')) ||
      availableVoices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      availableVoices[0] ||
      null
    );
  };

  const speakText = (rawText: string, genderOverride?: CoachGender) => {
    if (
      !speakerEnabled ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    stopSpeaking();
    const clean = cleanTextForSpeech(rawText);
    if (!clean) return;

    const activeGender = genderOverride ?? coachGender;
    const utterance = new SpeechSynthesisUtterance(clean);
    const chosenVoice = selectPreferredVoice(activeGender);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    if (activeGender === 'female') {
      utterance.pitch = 1.04;
      utterance.rate = 0.94;
    } else {
      utterance.pitch = 0.92;
      utterance.rate = 0.95;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text: trimmed,
    };

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

    setMessages((prev) => [...prev, userMsg, coachMsg]);
    setBookingState(reply.nextBookingState);
    setInputValue('');
    speakText(reply.spokenText);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleClearChat = () => {
    stopSpeaking();
    setBookingState({ active: false, step: 'done' });
    setMessages([createWelcomeMessage(language, coachGender)]);
    setVoiceHint('');
  };

  const handleLanguageChange = (nextLang: CoachLanguage) => {
    setLanguage(nextLang);
    stopSpeaking();
    setBookingState({ active: false, step: 'done' });
    setMessages([createWelcomeMessage(nextLang, coachGender)]);
  };

  const handleGenderChange = (nextGender: CoachGender) => {
    setCoachGender(nextGender);
    const coachLabel = nextGender === 'female' ? 'Coach Sara' : 'Coach Adam';
    const switchNote: ChatMessage = {
      id: `switch-${Date.now()}`,
      sender: 'coach',
      text:
        language === 'UR'
          ? `اب آپ ${coachLabel} سے بات کر رہے ہیں۔ بتائیں آج کس فٹنس ہدف پر کام کرنا ہے؟`
          : `Switched to ${coachLabel}. How can I help with your training or trial booking?`,
    };
    setMessages((prev) => [...prev, switchNote]);
    speakText(
      `Switched to ${coachLabel}. How can I help with your training today?`,
      nextGender
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
          handleSendMessage(transcript);
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
                    24/7 Voice &amp; Chat AI Fitness Coach
                  </p>
                </div>

                {/* Header Action Controls: Speaker, Clear Chat, Close */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleSpeaker}
                    aria-label={speakerEnabled ? 'Mute voice replies' : 'Unmute voice replies'}
                    title={speakerEnabled ? 'Voice On' : 'Voice Muted'}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      speakerEnabled
                        ? 'text-[#C8F135] bg-white/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {speakerEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearChat}
                    aria-label="Clear Chat"
                    title="Clear Chat"
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
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
              <div className="flex items-center justify-between gap-2 text-[11px]">
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
                  className="inline-flex p-0.5 rounded-lg bg-[#090D16] border border-white/10 min-w-0"
                >
                  <button
                    type="button"
                    onClick={() => handleGenderChange('female')}
                    className={`px-2 py-1 rounded-md font-medium transition-colors truncate cursor-pointer ${
                      coachGender === 'female'
                        ? 'bg-white text-[#090D16] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Female (Sara)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderChange('male')}
                    className={`px-2 py-1 rounded-md font-medium transition-colors truncate cursor-pointer ${
                      coachGender === 'male'
                        ? 'bg-white text-[#090D16] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Male (Adam)
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3.5 space-y-3 bg-[#090D16]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    dir={language === 'UR' && msg.sender === 'coach' ? 'auto' : 'ltr'}
                    className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-[#C8F135] text-[#090D16] font-medium rounded-br-sm'
                        : 'bg-[#131B2E] text-slate-100 border border-white/10 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Step-specific clickable options during booking flow */}
                  {msg.quickOptions && msg.quickOptions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[92%]">
                      {msg.quickOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSendMessage(opt)}
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
                          <span className="text-white font-medium">{msg.confirmedPass.name}</span>
                        </p>
                        <p>
                          <span className="text-slate-400">Goal:</span>{' '}
                          <span className="text-white font-medium">{msg.confirmedPass.goal}</span>
                        </p>
                        <p>
                          <span className="text-slate-400">Session:</span>{' '}
                          <span className="text-white font-medium">{msg.confirmedPass.slot}</span>
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
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 5 Quick-Action Chips */}
            <div className="px-3 py-2 bg-[#0D1320] border-t border-white/10 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_ACTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
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
                aria-label="Send message"
                className="p-2.5 rounded-xl bg-[#C8F135] text-[#090D16] hover:bg-[#d8fb54] transition-colors shrink-0 cursor-pointer"
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
