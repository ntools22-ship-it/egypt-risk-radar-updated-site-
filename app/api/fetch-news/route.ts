import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'
import { SOURCES } from '@/lib/sources'
import { getTabs, isArabic } from '@/lib/keywords'

export const maxDuration = 60

function makeHash(title: string): string {
  return crypto.createHash('md5').update(title.trim()).digest('hex')
}

async function parseRSS(url: string): Promise<{ title: string; link: string; summary: string }[]> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EgyptRiskRadar/1.0)' },
    })
    clearTimeout(timer)
    if (!res.ok) return []
    const xml = await res.text()
    const items: { title: string; link: string; summary: string }[] = []
    const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi
    let match
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const block = match[1]
      const title = (block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                     block.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || ''
      const link  = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/) ||
                     block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || ''
      const summary = (block.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                       block.match(/<description[^>]*>([\s\S]*?)<\/description>/) || [])[1] || ''
      const cleanTitle = title.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '').trim()
      const cleanLink  = link.replace(/<[^>]+>/g, '').trim()
      if (cleanTitle && cleanLink) {
        items.push({ title: cleanTitle, link: cleanLink, summary: summary.slice(0, 300) })
      }
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
      hash: makeHash(item.title),
    })
  }
  return results
}

export async function GET() {
  try {
    // Process in batches of 6 to avoid timeout
    const batchSize = 6
    const allItems: { title: string; url: string; source_name: string; tabs: string[]; hash: string }[] = []

    for (let i = 0; i < SOURCES.length; i += batchSize) {
      const batch = SOURCES.slice(i, i + batchSize)
      const results = await Promise.allSettled(batch.map(fetchSource))
      for (const r of results) {
        if (r.status === 'fulfilled') allItems.push(...r.value)
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({ message: 'No items found', count: 0 })
    }

    // Deduplicate
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
