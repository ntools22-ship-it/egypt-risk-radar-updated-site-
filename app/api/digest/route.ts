import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { TABS } from '@/lib/sources'

export const maxDuration = 60

const GROQ_KEY = process.env.GROQ_API_KEY || ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const PRIORITY = [
  'warning', 'credit', 'cbe', 'banks', 'fx', 'global',
  'breaking', 'sector_agri', 'sector_industry', 'sector_realestate',
  'sector_energy', 'sector_transport', 'sector_tech',
]

async function askGroq(prompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  })
  const data = await res.json()
  return data?.choices?.[0]?.message?.content || ''
}

function buildTabPrompt(tabLabel: string, headlines: string[]): string {
  const list = headlines.map(h => '- ' + h).join('\n')
  return `أنت محلل أول في قسم المخاطر والائتمان بأحد البنوك المصرية الكبرى.

عناوين أخبار تبويب "${tabLabel}" خلال آخر 24 ساعة:
${list}

المطلوب (اكتب بإيجاز واحترافية):
1. 📌 أبرز الأخبار في نقاط مختصرة
2. ⚠️ ما يستوجب الانتباه من منظور مخاطر الائتمان والاستعلامات المصرفية
3. 🔭 توقع استباقي: ما الذي قد يحدث خلال الـ 48 ساعة القادمة بناءً على هذه المؤشرات؟

اكتب بأسلوب مهني مباشر باللغة العربية، بدون مقدمات أو تحيات.`
}

function buildOverallPrompt(grouped: Record<string, string[]>): string {
  let sections = ''
  for (const [tab, headlines] of Object.entries(grouped)) {
    const label = TABS[tab] || tab
    sections += `\n${label}:\n` + headlines.slice(0, 5).map(h => '- ' + h).join('\n') + '\n'
  }
  return `أنت كبير محللي المخاطر في القطاع المصرفي المصري.

ملخص أخبار اليوم عبر كل القطاعات:
${sections}

المطلوب:
1. 🧭 الصورة الكبيرة: ما الاتجاه العام للسوق المصري اليوم؟
2. 🚨 أعلى 3 مخاطر تستدعي متابعة فورية من فرق المخاطر والائتمان
3. 💡 توصية استباقية واحدة للبنوك والمؤسسات المالية

اكتب بأسلوب تنفيذي موجز باللغة العربية.`
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'get'
  const dateParam = req.nextUrl.searchParams.get('date')

  // جلب الموجز — كل التواريخ المتاحة أو تاريخ محدد
  if (action === 'get') {
    let query = supabase
      .from('digest')
      .select('*')
      .order('digest_date', { ascending: false })
      .order('created_at', { ascending: true })

    if (dateParam) {
      query = query.eq('digest_date', dateParam)
    } else {
      // آخر 7 أيام
      const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      query = query.gte('digest_date', week)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // نجمع التواريخ المتاحة
    const dates = Array.from(new Set((data || []).map((d: { digest_date: string }) => d.digest_date))).sort().reverse()
    return NextResponse.json({ items: data || [], dates })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
