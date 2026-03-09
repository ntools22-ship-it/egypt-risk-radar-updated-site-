import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { TABS } from '@/lib/sources'

export const maxDuration = 60 // لضمان عدم توقف الطلب أثناء معالجة الذكاء الاصطناعي

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`

// تحديد أولوية ظهور الأقسام في التقرير
const PRIORITY = [
  'warning', 'credit', 'cbe', 'banks', 'fx', 'global',
  'breaking', 'sector_agri', 'sector_industry', 'sector_realestate',
  'sector_energy', 'sector_transport', 'sector_tech',
]

async function askGemini(prompt: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'get'

  // المسار الأول: جلب ملخص اليوم من قاعدة البيانات
  if (action === 'get') {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('digest')
      .select('*')
      .eq('digest_date', today)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data || [] })
  }

  // المسار الثاني: توليد ملخص جديد باستخدام Gemini
  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
  }

  // جلب أخبار آخر 24 ساعة فقط
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: news, error } = await supabase
    .from('news')
    .select('title, tabs')
    .gte('created_at', since)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!news || news.length === 0) return NextResponse.json({ message: 'No news to digest' })

  // تجميع العناوين حسب القسم (Tab)
  const grouped: Record<string, string[]> = {}
  for (const item of news) {
    for (const tab of item.tabs) {
      if (!grouped[tab]) grouped[tab] = []
      grouped[tab].push(item.title)
    }
  }

  // ترتيب الأقسام حسب المصفوفة المحددة مسبقاً
  const orderedTabs = Object.keys(grouped).sort((a, b) => {
    const ai = PRIORITY.indexOf(a), bi = PRIORITY.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const today = new Date().toISOString().split('T')[0]
  const digestItems = []

  for (const tab of orderedTabs) {
    const headlines = grouped[tab]
    if (!headlines?.length) continue

    const tabLabel = TABS[tab] || tab
    // البرومبت (الأمر) الموجه للذكاء الاصطناعي ليقوم بدور محلل مخاطر
    const prompt = `أنت محلل أول في قسم المخاطر والائتمان في أحد البنوك المصرية الكبرى.
الأخبار التالية من تبويب "${tabLabel}" خلال الـ 24 ساعة الماضية:

${headlines.map(h => `- ${h}`).join('\n')}

المطلوب بأسلوب احترافي وموجز:
1. أبرز الأخبار في نقاط مختصرة
2. ما يستوجب الانتباه من منظور مخاطر وائتمان
3. توصية مهنية واحدة للعاملين في القطاع

بدون مقدمات أو تحيات.`

    try {
