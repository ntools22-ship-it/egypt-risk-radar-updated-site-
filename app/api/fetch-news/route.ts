import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SOURCES } from '@/lib/sources'
import { getTabs, isArabic } from '@/lib/keywords'

export const runtime = 'edge'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!

// SHA-256 — متوافق مع bot.py (hashlib.sha256)
async function makeHash(title: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(title.trim())
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function parseRSS(url: string): Promise<{ title: string; link: string; summary: string }[]> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EgyptRiskRadar/1.0)' },
    })
    clearTimeout(timer)
    if (!res.ok) return []
    const xml = await res.text()
    const items: { title: string; link: string; summary: string }[] = []
    const itemRegex = /<item[\s\S]*?<\/item>/gi
    let match
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const block = match[0]
      const titleMatch = block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]>/) ||
                         block.match(/<title[^>]*>([\s\S]*?)<\/title>/)
      const linkMatch  = block.match(/<link>([\s\S]*?)<\/link>/) ||
                         block.match(/<link[^>]*href="([^"]+)"/)
      const descMatch  = block.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]>/) ||
                         block.match(/<description[^>]*>([\s\S]*?)<\/description>/)
      const title   = (titleMatch?.[1] || '').replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#\d+;/g,'').trim()
      const link    = (linkMatch?.[1] || '').replace(/<[^>]+>/g,'').trim()
      const summary = (descMatch?.[1] || '').slice(0, 300)
      if (title && link) items.push({ title, link, summary })
    }
    return items
  } catch {
    return []
  }
}

async function fetchSource(src: typeof SOURCES[0]) {
  const rawItems = await parseRSS(src.url)
  const results = []
  for (const item of rawItems) {
    if (!item.title || !item.link) continue
    if (!isArabic(item.title)) continue
    const tabs = getTabs(item.title, item.summary, src.tab)
    if (tabs.length === 0) continue
    results.push({
      title: item.title,
      url: item.link,
      source_name: src.name,
      tabs,
      hash: await makeHash(item.title),
    })
  }
  return results
}

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const allResults = await Promise.allSettled(SOURCES.map(fetchSource))
    const allItems: { title: string; url: string; source_name: string; tabs: string[]; hash: string }[] = []
    for (const r of allResults) {
      if (r.status === 'fulfilled') allItems.push(...r.value)
    }

    if (allItems.length === 0) {
      return NextResponse.json({ message: 'No items found', count: 0 })
    }

    const seen = new Set<string>()
    const unique = allItems.filter(item => {
      if (seen.has(item.hash)) return false
      seen.add(item.hash)
      return true
    })

    const { error } = await supabase
      .from('news')
      .upsert(unique, { onConflict: 'hash', ignoreDuplicates: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Done', count: unique.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
