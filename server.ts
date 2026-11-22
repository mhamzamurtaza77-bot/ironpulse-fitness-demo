import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface CoachRequestBody {
  message?: string;
  history?: Array<{ sender: 'user' | 'coach'; text: string }>;
  coachGender?: 'female' | 'male';
  language?: 'EN' | 'UR';
  currency?: 'GBP' | 'PKR';
}

function buildSystemInstruction(
  coachGender: 'female' | 'male',
  language: 'EN' | 'UR',
  currency: 'GBP' | 'PKR'
): string {
  const coachName = coachGender === 'female' ? 'Coach Sara' : 'Coach Adam';
  const activePrices =
    currency === 'GBP'
      ? [
          'Basic Gym Access: £35/month',
          'Pro Strength & Group Classes: £55/month',
          'VIP 1-on-1 Personal Training: £110/month',
          'Custom Nutrition & Transformation Plan: £75 (one-time)',
          'Couple / Buddy Pass: £60/month',
          'Day Pass & Sauna Recovery: £15/visit',
        ].join('; ')
      : [
          'Basic Gym Access: Rs 5,000/month',
          'Pro Strength & Group Classes: Rs 8,500/month',
          'VIP 1-on-1 Personal Training: Rs 18,000/month',
          'Custom Nutrition & Transformation Plan: Rs 12,000 (one-time)',
          'Couple / Buddy Pass: Rs 9,000/month',
          'Day Pass & Sauna Recovery: Rs 1,500/visit',
        ].join('; ');

  return [
    `You are ${coachName}, a warm, encouraging, human-like certified fitness coach at "IronPulse Fitness Studio" (flagship studios in London Mayfair & Lahore Gulberg III).`,
    `Respond in a friendly conversational coaching style like ChatGPT: start with a clear, warm 1-2 sentence intro, provide helpful structured bullet points (using **bold** for key terms and "- " bullets), and finish with one friendly follow-up question.`,
    `Match the user's exact language automatically: if they write in English reply in English; if they write in Roman Urdu (e.g., "aoa", "wazan kam karna hai", "fees kitni hai") reply naturally in Roman Urdu; if they write in Urdu script (or if the UI language toggle is set to "UR" and they click a chip) reply in natural Urdu script.`,
    `Current UI language toggle: ${language}. Active currency: ${currency}.`,
    `Exact IronPulse Membership Prices (${currency}): ${activePrices}. (Also mention the other currency if helpful: £35=Rs 5,000, £55=Rs 8,500, £110=Rs 18,000, £75=Rs 12,000, £60=Rs 9,000, £15=Rs 1,500).`,
    `Studio Timings: Monday to Saturday, 6:00 AM – 11:00 PM (closed Sundays for deep equipment calibration & recovery reset). Trial coaching slots: 7:00 AM, 10:30 AM, 5:00 PM, 8:00 PM.`,
    `Studio Facilities & Team: 18+ Olympic squat racks, calibrated Eleiko plates, 85°C Cedar Finnish Sauna & contrast cold rain showers, Coach Sara (Fat Loss & Mobility), Coach Adam (Powerlifting & Hypertrophy), Coach Hamza (Conditioning & Nutrition). Free 3-Day Trial Pass available anytime.`,
    `Keep replies concise (roughly 70-130 words) so they are easy to read and sound natural when spoken aloud.`,
  ].join('\n');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/coach', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(200).json({ fallback: true });
      return;
    }

    const body = (req.body ?? {}) as CoachRequestBody;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
      res.status(400).json({ fallback: true });
      return;
    }

    const coachGender = body.coachGender === 'male' ? 'male' : 'female';
    const language = body.language === 'UR' ? 'UR' : 'EN';
    const currency = body.currency === 'PKR' ? 'PKR' : 'GBP';
    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const conversationContext = history
        .map((m) => `${m.sender === 'user' ? 'Member' : 'Coach'}: ${m.text}`)
        .join('\n');

      const prompt = conversationContext
        ? `Recent conversation:\n${conversationContext}\n\nMember's latest message: ${message}`
        : message;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: buildSystemInstruction(coachGender, language, currency),
        },
      });

      const replyText = response.text?.trim();
      if (!replyText) {
        res.status(200).json({ fallback: true });
        return;
      }

      res.status(200).json({ fallback: false, text: replyText });
    } catch {
      // Seamlessly trigger client-side conversational fallback without surfacing errors
      res.status(200).json({ fallback: true });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IronPulse Fitness server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
