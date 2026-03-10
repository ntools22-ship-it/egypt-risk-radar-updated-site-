import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
  }

  const body = await req.json()
  const title: string = body.title || ''
  const source: string = body.source || ''

  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 })
  }

  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY

  const prompt = `انت مسؤول مخاطر وائتمان واستعلامات في بنك مصري كبير.
العنوان: ${title}
المصدر: ${source}

حلل هذا الخبر في 3 نقاط فقط:
1. ماذا يعني هذا الخبر للقطاع المصرفي المصري؟
2. هل يشير لمخاطرة أم فرصة؟
3. توصية عملية واحدة لمسؤولي الائتمان والمخاطر.

بدون مقدمات. باللغة العربية فقط.`

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500 }
      }),
    })
    const data = await res.json()
    const analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!analysis) {
      return NextResponse.json({ error: 'empty', raw: JSON.stringify(data) }, { status: 500 })
    }
    return NextResponse.json({ analysis })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
