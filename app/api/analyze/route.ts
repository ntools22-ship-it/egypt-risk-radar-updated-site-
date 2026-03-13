import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const title: string = body.title || ''
    const source: string = body.source || ''

    if (!title) return NextResponse.json({ error: 'no title' }, { status: 400 })

    const key = process.env.GROQ_API_KEY
    if (!key) return NextResponse.json({ error: 'no key' }, { status: 500 })

    const prompt = `أنت متخصص في المخاطر الائتمانية والاستعلامات المصرفية في مصر.

حلّل هذا الخبر بأسلوب بسيط يفهمه أي شخص، في 3 نقاط واضحة:

1️⃣ ماذا يعني هذا الخبر ببساطة؟
2️⃣ هل هو خطر أم فرصة للبنوك والمقترضين في مصر؟ ولماذا؟
3️⃣ ماذا يجب أن يفعل المسؤول عن الائتمان أو المخاطر استباقياً؟

الخبر: ${title}
المصدر: ${source}

اكتب بالعربية فقط، بدون مقدمات.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Groq ${res.status}`, detail: err }, { status: 500 })
    }

    const data = await res.json()
    const analysis = data?.choices?.[0]?.message?.content

    if (!analysis) return NextResponse.json({ error: 'empty response' }, { status: 500 })
    return NextResponse.json({ analysis })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
