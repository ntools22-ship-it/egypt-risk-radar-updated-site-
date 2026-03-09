import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'
import { SOURCES } from '@/lib/sources'
import { getTabs, isArabic } from '@/lib/keywords'

export const maxDuration = 60

const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EgyptRiskRadar/1.0)' },
})

function makeHash(title: string): string {
  return crypto.createHash('md5').update(title.trim()).digest('hex')
}

async function fetchSource(src: typeof SOURCES[0]) {
  try {
    const feed = await parser.parseURL(src.url)
    const items = feed.items.slice(0, 10)
    const results = []

    for (const item of items) {
      const title = (item.title || '').trim()
      const url = item.link || ''
      const summary = (item.contentSnippet || item.content || '').slice(0, 400)

      if (!title || !url) continue
      if (!isArabic(title)) continue

      const tabs = getTabs(title, summary, src.tab)
      if (tabs.length === 0) continue

      results.push({
        title,
        url,
        source_name: src.name,
        tabs,
        hash: makeHash(title),
      })
    }
    return results
  } catch {
    return []
  }
}

export async function GET() {
  try {
    // جلب جميع المصادر بالتوازي (Parallel Fetching)
    const allResults = await Promise.allSettled(SOURCES.map(fetchSource))

    const items: { title: string; url: string; source_name: string; tabs: string[]; hash: string }[] = []
    for (const result of allResults) {
      if (result.status === 'fulfilled') {
        items.push(...result.value)
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ message: 'No new items', count: 0 })
    }

    // إزالة التكرار بناءً على الـ Hash
    const seen = new Set<string>()
    const unique = items.filter(item => {
      if (seen.has(item.hash)) return false
      seen.add(item.hash)
      return true
    })

    // حفظ البيانات في Supabase (تجاهل المكرر آلياً)
    const { error } = await supabase
      .from('news')
      .upsert(unique, { onConflict: 'hash', ignoreDuplicates: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Done', count: unique.length })
