import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`

export async function POST(req: NextRequest) {
  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
  }

  const { title, source } = await req.json()
  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 })
  }

  const lines = [
    '\u0623\u0646\u062a \u0645\u062d\u0644\u0644 \u0645\u062e\u0627\u0637\u0631 \u0648\u0627\u0626\u062a\u0645\u0627\u0646 \u0641\u064a \u0628\u0646\u0643 \u0645\u0635\u0631\u064a \u0643\u0628\u064a\u0631.',
    '\u0627\u0644\u062e\u0628\u0631: ' + title,
    '\u0627\u0644\u0645\u0635\u062f\u0631: ' + (source || ''),
    '',
    '\u062d\u0644\u0644 \u0647\u0630\u0627 \u0627\u0644\u062e\u0628\u0631 \u0628\u0627\u062e\u062a\u0635\u0627\u0631 \u0634\u062f\u064a\u062f \u0645\u0646 \u0645\u0646\u0638\u0648\u0631 \u0645\u0633\u0624\u0648\u0644 \u0645\u062e\u0627\u0637\u0631 \u0648\u0627\u0626\u062a\u0645\u0627\u0646:',
    '1. \u0645\u0627\u0630\u0627 \u064a\u0639\u0646\u064a \u0647\u0630\u0627 \u0627\u0644\u062e\u0628\u0631 \u0644\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0645\u0635\u0631\u0641\u064a\u061f',
    '2. \u0647\u0644 \u064a\u0634\u064a\u0631 \u0644\u0645\u062e\u0627\u0637\u0631\u0629 \u0623\u0648 \u0641\u0631\u0635\u0629\u061f',
    '3. \u062a\u0648\u0635\u064a\u0629 \u0639\u0645\u0644\u064a\u0629 \u0648\u0627\u062d\u062f\u0629.',
    '',
    '\u0631\u062f \u0628\u062trok 3 \u0646\u0642\u0627\u0637 \u0641\u0642\u0637 \u0628\u062f\u0648\u0646 \u0645\u0642\u062f\u0645\u0627\u062a.',
  ]

  const prompt = [
    '\u0623\u0646\u062a \u0645\u062d\u0644\u0644 \u0645\u062e\u0627\u0637\u0631 \u0648\u0627\u0626\u062a\u0645\u0627\u0646 \u0641\u064a \u0628\u0646\u0643 \u0645\u0635\u0631\u064a \u0643\u0628\u064a\u0631.',
    '\u0627\u0644\u062e\u0628\u0631: ' + title,
    '\u0627\u0644\u0645\u0635\u062f\u0631: ' + (source || ''),
    '',
    '\u062d\u0644\u0644 \u0647\u0630\u0627 \u0627\u0644\u062e\u0628\u0631 \u0628\u0627\u062e\u062a\u0635\u0627\u0631 \u0645\u0646 \u0645\u0646\u0638\u0648\u0631 \u0645\u0633\u0624\u0648\u0644 \u0645\u062e\u0627\u0637\u0631 \u0648\u0627\u0626\u062a\u0645\u0627\u0646 \u0641\u064a 3 \u0646\u0642\u0627\u0637 \u0641\u0642\u0637:',
    '1. \u0645\u0627\u0630\u0627 \u064a\u0639\u0646\u064a \u0644\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0645\u0635\u0631\u0641\u064a\u061f',
    '2. \u0647\u0644 \u064a\u0634\u064a\u0631 \u0644\u0645\u062e\u0627\u0637\u0631\u0629 \u0623\u0648 \u0641\u0631\u0635\u0629\u061f',
    '3. \u062a\u0648\u0635\u064a\u0629 \u0639\u0645\u0644\u064a\u0629.',
    '',
    '\u0628\u062f\u0648\u0646 \u0645\u0642\u062f\u0645\u0627\u062a \u0623\u0648 \u062a\u062d\u064a\u0627\u062a.',
  ].join('\n')

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })
    const data = await res.json()
    const analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return NextResponse.json({ analysis })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
