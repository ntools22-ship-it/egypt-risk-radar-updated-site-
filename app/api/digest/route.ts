import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { TABS } from '@/lib/sources'

export const maxDuration = 60

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`

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

function buildPrompt(tabLabel: string, headlines: string[]): string {
  const headlinesList = headlines.map((h) => '- ' + h).join('\n')
  const intro = '\u0623\u0646\u062a \u0645\u062d\u0644\u0644 \u0623\u0648\u0644 \u0641\u064a \u0642\u0633\u0645 \u0627\u0644\u0645\u062e\u0627\u0637\u0631 \u0648\u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646 \u0641\u064a \u0623\u062d\u062f \u0627\u0644\u0628\u0646\u0648\u0643 \u0627\u0644\u0645\u0635\u0631\u064a\u0629 \u0627\u0644\u0643\u0628\u0631\u0649.'
  const section = '\u0627\u0644\u0623\u062e\u0628\u0627\u0631 \u0627\u0644\u062a\u0627\u0644\u064a\u0629 \u0645\u0646 \u062a\u0628\u0648\u064a\u0628 "'
  const hours = '" \u062e\u0644\u0627\u0644 \u0627\u0644\u0640 24 \u0633\u0627\u0639\u0629 \u0627\u0644\u0645\u0627\u0636\u064a\u0629:'
  const req1 = '1. \u0623\u0628\u0631\u0632 \u0627\u0644\u0623\u062e\u0628\u0627\u0631 \u0641\u064a \u0646\u0642\u0627\u0637 \u0645\u062e\u062a\u0635\u0631\u0629'
  const req2 = '2. \u0645\u0627 \u064a\u0633\u062a\u0648\u062c\u0628 \u0627\u0644\u0627\u0646\u062a\u0628\u0627\u0647 \u0645\u0646 \u0645\u0646\u0638\u0648\u0631 \u0645\u062e\u0627\u0637\u0631 \u0648\u0627\u0626\u062a\u0645\u0627\u0646'
  const req3 = '3. \u062a\u0648\u0635\u064a\u0629 \u0645\u0647\u0646\u064a\u0629 \u0648\u0627\u062d\u062f\u0629 \u0644\u0644\u0639\u0627\u0645\u0644\u064a\u0646 \u0641\u064a \u0627\u0644\u0642\u0637\u0627\u0639'
  const note = '\u0628\u062f\u0648\u0646 \u0645\u0642\u062f\u0645\u0627\u062a \u0623\u0648 \u062a\u062d\u064a\u0627\u062a.'

  return [intro, section + tabLabel + hours, '', headlinesList, '', req1, req2, req3, '', note].join('\n')
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
  if (!news || news.length === 0) return NextResponse.json({ message: 'No news to digest' })

  const grouped: Record<string, string[]> = {}
  for (const item of news) {
    for (const tab of item.tabs) {
      if (!grouped[tab]) grouped[tab] = []
      grouped[tab].push(item.title)
    }
  }

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
    const prompt = buildPrompt(tabLabel, headlines)

    try {
      const content = await askGemini(prompt)
      if (content) {
        digestItems.push({
          tab_key: tab,
          tab_label: tabLabel,
          content,
          news_count: headlines.length,
          digest_date: today,
        })
      }
      await new Promise(r => setTimeout(r, 1000))
    } catch {
      continue
    }
  }

  if (digestItems.length > 0) {
    await supabase.from('digest').delete().eq('digest_date', today)
    await supabase.from('digest').insert(digestItems)
  }

  return NextResponse.json({ message: 'Digest generated', count: digestItems.length })
}
