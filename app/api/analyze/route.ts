import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY

export async function POST(req: NextRequest) {
  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
  }

  const body = await req.json()
  const title: string = body.title || ''
  const source: string = body.source || ''

  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 })
  }

  const prompt = [
    'You are a risk and credit analyst at a major Egyptian bank. Respond only in Arabic.',
    'News headline: ' + title,
    'Source: ' + source,
    '',
    'Analyze this news in exactly 3 short bullet points from a risk and credit perspective:',
    '1. What does this mean for the Egyptian banking sector?',
    '2. Does it indicate a risk or an opportunity?',
    '3. One practical recommendation for banking professionals.',
    '',
    'Be concise. No greetings or preamble. Arabic only.',
  ].join('\n')

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })
    const data = await res.json()
    const analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!analysis) {
      return NextResponse.json({ error: 'empty response', raw: data }, { status: 500 })
    }
    return NextResponse.json({ analysis })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
