import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { TABS } from '@/lib/sources'

export const maxDuration = 60

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY

const PRIORITY = [
  'warning', 'credit', 'cbe', 'banks', 'fx', 'global',
  'breaking', 'sector_agri', 'sector_industry', 'sector_realestate',
  'sector_energy', 'sector_transport', 'sector_tech',
]

async function askGemini(tabLabel: string, headlines: string[]): Promise<string> {
  const headlinesList = headlines.map((h) => '- ' + h).join('\n')
  const prompt = [
    'You are a senior risk and credit analyst at a major Egyptian bank. Respond only in Arabic.',
    'The following news headlines are from the "' + tabLabel + '" category in the last 24 hours:',
    '',
    headlinesList,
    '',
    'Write a professional analysis in 3 parts:',
    '1. Key highlights (bullet points)',
    '2. What requires attention from a risk/credit perspective',
    '3. One professional recommendation for banking sector professionals',
    '',
    'Be concise. No greetings or preamble. Arabic only.',
  ].join('\n')

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

  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: news, error } = await supabase
    .from('news')
    .select('title, tabs')
    .gte('created_at', since)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!news || news.length === 0) return NextResponse.json({ message: 'No news in last 24h', count: 0 })

  const grouped: Record<string, string[]> = {}
  for (const item of news) {
    for (const tab of item.tabs) {
      if (!grouped[tab]) grouped[tab] = []
      grouped[tab].push(item.title)
    }
  }

  const orderedTabs = Object.keys(grouped).sort((a, b) => {
    const ai = PRIORITY.indexOf(a)
    const bi = PRIORITY.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const today = new Date().toISOString().split('T')[0]
  const digestItems = []

  for (const tab of orderedTabs) {
    const headlines = grouped[tab]
    if (!headlines || headlines.length === 0) continue

    const tabLabel = TABS[tab] || tab

    try {
      const content = await askGemini(tabLabel, headlines)
      if (content) {
        digestItems.push({
          tab_key: tab,
          tab_label: tabLabel,
          content,
          news_count: headlines.length,
          digest_date: today,
        })
      }
      await new Promise(r => setTimeout(r, 1500))
    } catch {
      continue
    }
  }

  if (digestItems.length > 0) {
    await supabase.from('digest').delete().eq('digest_date', today)
    const { error: insertError } = await supabase.from('digest').insert(digestItems)
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'Digest generated', count: digestItems.length })
}
