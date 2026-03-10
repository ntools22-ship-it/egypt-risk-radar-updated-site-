import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const title: string = body.title || ''
    const source: string = body.source || ''

    if (!title) {
      return NextResponse.json({ error: 'no title' }, { status: 400 })
    }

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      return NextResponse.json({ error: 'no key' }, { status: 500 })
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`

    const prompt = `انت مسؤول مخاطر وائتمان في بنك مصري. حلل الخبر التالي في 3 نقاط فقط باللغة العربية بدون مقدمات:
1. ماذا يعني للقطاع المصرفي؟
2. مخاطرة أم فرصة؟
3. توصية عملية.

الخبر: ${title}
المصدر: ${source}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Gemini error ${res.status}`, detail: err }, { status: 500 })
    }

    const data = await res.json()
    const analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!analysis) {
      return NextResponse.json({ error: 'no analysis', raw: JSON.stringify(data) }, { status: 500 })
    }

    return NextResponse.json({ analysis })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
