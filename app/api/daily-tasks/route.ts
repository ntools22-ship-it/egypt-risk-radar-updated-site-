import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!

const TAB_LABELS: Record<string, string> = {
  warning:           '⚠️ إنذار مبكر',
  credit:            '💰 تمويل وائتمان',
  cbe:               '🏛️ المركزي',
  banks:             '🏦 البنوك',
  fx:                '💵 الدولار',
  global:            '🌍 اقتصاد عالمي',
  breaking:          '⚡ عاجل',
  sector_agri:       '🌾 زراعة',
  sector_industry:   '🏭 صناعة',
  sector_realestate: '🏗️ عقارات',
  sector_energy:     '⚡ طاقة',
  sector_transport:  '🚢 نقل وملاحة',
  sector_tech:       '💻 تكنولوجيا',
}

const TAB_ORDER = [
  'warning', 'credit', 'cbe', 'banks', 'fx', 'global',
  'breaking', 'sector_agri', 'sector_industry',
  'sector_realestate', 'sector_energy', 'sector_transport', 'sector_tech',
]

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const log: string[] = []

  // توقيت مصر UTC+2
  const nowEgypt   = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const digestDate = nowEgypt.toISOString().slice(0, 10)
  const dateStr    = nowEgypt.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric', year: 'numeric' })
  const dayOfWeek  = nowEgypt.getDay() // 0 = الأحد

  // ══════════════════════════════════════════
  // 1. الموجز اليومي
  // ══════════════════════════════════════════
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: news, error } = await supabase
      .from('news')
      .select('title, url, tabs')
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    if (!news || news.length === 0) {
      log.push('digest: مفيش أخبار في آخر 24 ساعة')
    } else {
      // تجميع الأخبار بالتبويب
      const grouped: Record<string, { title: string; url: string }[]> = {}
      for (const item of news) {
        for (const tab of (item.tabs as string[])) {
          if (!grouped[tab]) grouped[tab] = []
          grouped[tab].push({ title: item.title, url: item.url })
        }
      }

      const orderedTabs = TAB_ORDER.filter(t => grouped[t]?.length > 0)

      // حفظ كل تبويب في Supabase
      for (const tab of orderedTabs) {
        const items    = grouped[tab]
        const label    = TAB_LABELS[tab] || tab
        let tabContent = ''
        for (const item of items) {
          tabContent += `• [${item.title}](${item.url})\n`
        }

        // احذف الموجز القديم لنفس اليوم ونفس التبويب
        await supabase
          .from('digest')
          .delete()
          .eq('tab_key', tab)
          .eq('digest_date', digestDate)

        await supabase
          .from('digest')
          .insert({
            tab_key:     tab,
            tab_label:   label,
            content:     tabContent.trim(),
            news_count:  items.length,
            digest_date: digestDate,
          })
      }

      log.push(`digest: ✅ ${news.length} خبر في ${orderedTabs.length} تبويب — ${dateStr}`)
    }
  } catch (e: any) {
    log.push(`digest error: ${e.message}`)
  }

  // ══════════════════════════════════════════
  // 2. CLEANUP أسبوعي — كل أحد بس
  // ══════════════════════════════════════════
  if (dayOfWeek === 0) {
    try {
      const cutoff       = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const digestCutoff = cutoff.slice(0, 10)

      const { error: newsErr, count: newsCount } = await supabase
        .from('news')
        .delete({ count: 'exact' })
        .lt('created_at', cutoff)

      if (newsErr) throw new Error(newsErr.message)

      await supabase
        .from('digest')
        .delete()
        .lt('digest_date', digestCutoff)

      log.push(`cleanup: ✅ حذف ${newsCount ?? 0} خبر قديم`)
    } catch (e: any) {
      log.push(`cleanup error: ${e.message}`)
    }
  } else {
    log.push('cleanup: ⏭️ مش يوم الأحد')
  }

  return NextResponse.json({ ok: true, log })
}
