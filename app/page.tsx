'use client'

import { useState, useEffect, useCallback } from 'react'

interface NewsItem {
  id: string
  title: string
  url: string
  source_name: string
  tabs: string[]
  created_at: string
}

interface DigestItem {
  id: string
  tab_key: string
  tab_label: string
  content: string
  news_count: number
  digest_date: string
  headlines?: string
}

const MAIN_TABS = [
  { key: 'all',      label: '📋 آخر الأخبار' },
  { key: 'warning',  label: '⚠️ إنذار مبكر' },
  { key: 'credit',   label: '💰 تمويل وائتمان' },
  { key: 'banks',    label: '🏦 البنوك' },
  { key: 'cbe',      label: '🏛️ المركزي' },
  { key: 'fx',       label: '💵 الدولار' },
  { key: 'global',   label: '🌍 اقتصاد عالمي' },
  { key: 'breaking', label: '⚡ عاجل' },
  { key: 'sectors',  label: '🏗️ القطاعات' },
  { key: 'digest',   label: '🤖 الموجز اليومي' },
]

const SECTOR_TABS = [
  { key: 'sector_invest',      label: '💼 استثمار' },
  { key: 'sector_realestate',  label: '🏗️ عقارات' },
  { key: 'sector_energy',      label: '⚡ طاقة' },
  { key: 'sector_industry',    label: '🏭 صناعة' },
  { key: 'sector_tech',        label: '💻 تكنولوجيا' },
  { key: 'sector_agri',        label: '🌾 زراعة' },
  { key: 'sector_transport',   label: '🚢 نقل وملاحة' },
]

const TAB_LABELS: Record<string, string> = {
  breaking: '⚡ عاجل', banks: '🏦 البنوك', credit: '💰 تمويل',
  warning: '⚠️ إنذار', fx: '💵 دولار', cbe: '🏛️ مركزي',
  global: '🌍 عالمي', sector_invest: '💼 استثمار',
  sector_agri: '🌾 زراعة', sector_industry: '🏭 صناعة',
  sector_realestate: '🏗️ عقارات', sector_energy: '⚡ طاقة',
  sector_transport: '🚢 نقل', sector_tech: '💻 تكنولوجيا',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

function tabBadgeColor(tab: string, dark: boolean): string {
  const base: Record<string, string> = {
    warning:  dark ? 'bg-red-900 text-red-300'      : 'bg-red-100 text-red-700',
    credit:   dark ? 'bg-green-900 text-green-300'   : 'bg-green-100 text-green-700',
    cbe:      dark ? 'bg-blue-900 text-blue-300'     : 'bg-blue-100 text-blue-700',
    banks:    dark ? 'bg-indigo-900 text-indigo-300'  : 'bg-indigo-100 text-indigo-700',
    fx:       dark ? 'bg-yellow-900 text-yellow-300'  : 'bg-yellow-100 text-yellow-700',
    breaking: dark ? 'bg-orange-900 text-orange-300'  : 'bg-orange-100 text-orange-700',
  }
  return base[tab] || (dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
}

async function share(title: string, url: string) {
  if (navigator.share) {
    try { await navigator.share({ title, url }) } catch {}
  } else {
    await navigator.clipboard.writeText(title + '\n' + url)
    alert('تم نسخ الرابط')
  }
}

function NewsCard({ item, dark }: { item: NewsItem; dark: boolean }) {
  const [analysis, setAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const warn   = item.tabs.includes('warning')
  const credit = item.tabs.includes('credit') && !warn

  const handleAnalyze = async () => {
    if (analysis) {
      setShowAnalysis(!showAnalysis)
      return
    }
    setAnalyzing(true)
    setShowAnalysis(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: item.title, source: item.source_name }),
      })
      const data = await res.json()
      if (data.analysis) {
        setAnalysis(data.analysis)
      } else {
        setAnalysis('خطأ: ' + (data.error || data.detail || JSON.stringify(data)))
      }
    } catch (e: any) {
      setAnalysis('خطأ في الاتصال: ' + e.message)
    }
    setAnalyzing(false)
  }

  return (
    <div className={[
      'news-card rounded-xl p-4 border-r-4 shadow-sm mb-3',
      dark ? 'bg-gray-800' : 'bg-white',
      warn ? 'border-red-500' : credit ? 'border-green-500' : dark ? 'border-gray-700' : 'border-transparent',
    ].join(' ')}>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={[
          'block font-semibold text-base leading-relaxed mb-3 transition-colors',
          dark ? 'text-blue-300 hover:text-blue-200' : 'text-[#1a3c5e] hover:text-[#2980b9]',
        ].join(' ')}
      >
        {item.title}
      </a>

      <div className="flex flex-wrap gap-1 mb-3">
        {item.tabs.map(tab => (
          <span key={tab} className={'text-xs px-2 py-0.5 rounded-full font-medium ' + tabBadgeColor(tab, dark)}>
            {TAB_LABELS[tab] || tab}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400 min-w-0">
          <span className="truncate">{'📰 ' + item.source_name}</span>
          <span>·</span>
          <span className="whitespace-nowrap">{'🕐 ' + formatDate(item.created_at)}</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleAnalyze}
            title="تحليل بالذكاء الاصطناعي"
            className={[
              'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
              showAnalysis
                ? 'bg-purple-600 text-white'
                : dark
                  ? 'bg-purple-900 hover:bg-purple-800 text-purple-300'
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-700',
            ].join(' ')}
          >
            🤖
          </button>
          <button
            onClick={() => share(item.title, item.url)}
            className={[
              'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
              dark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600',
            ].join(' ')}
          >
            📤
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-[#1a3c5e] hover:bg-[#2980b9] text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {'↗ التفاصيل'}
          </a>
        </div>
      </div>

      {showAnalysis && (
        <div className={[
          'mt-3 p-3 rounded-lg border text-sm leading-relaxed',
          dark
            ? 'bg-purple-950 border-purple-800 text-purple-200'
            : 'bg-purple-50 border-purple-200 text-purple-900',
        ].join(' ')}>
          {analyzing ? (
            <div className="flex items-center gap-2 text-purple-500">
              <span className="inline-block animate-spin">{'⟳'}</span>
              <span>جاري التحليل...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{analysis}</div>
          )}
        </div>
      )}
    </div>
  )
}

function DigestCard({ item, dark }: { item: DigestItem; dark: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const headlines: string[] = (() => {
    try { return item.headlines ? JSON.parse(item.headlines) : [] } catch { return [] }
  })()
  const isOverall = item.tab_key === 'overall'

  return (
    <div className={['rounded-xl p-4 border-r-4 shadow-sm mb-3',
      isOverall ? 'border-yellow-400' : 'border-[#2980b9]',
      dark ? 'bg-gray-800' : 'bg-white'].join(' ')}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <h3 className={['font-bold text-base', dark ? 'text-blue-300' : 'text-[#1a3c5e]'].join(' ')}>
            {item.tab_label}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{item.news_count + ' خبر'}</p>
        </div>
        <span className="text-gray-400 text-lg">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className={['mt-4 pt-4 border-t text-sm', dark ? 'border-gray-700' : 'border-gray-100'].join(' ')}>
          {headlines.length > 0 && (
            <div className="mb-4">
              <p className={['font-semibold text-xs mb-2', dark ? 'text-gray-400' : 'text-gray-500'].join(' ')}>📋 الأخبار</p>
              <ul className="space-y-1">
                {headlines.map((h, i) => (
                  <li key={i} className={['text-sm leading-relaxed', dark ? 'text-gray-300' : 'text-gray-700'].join(' ')}>
                    {'• ' + h}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className={['pt-3 border-t', dark ? 'border-gray-700' : 'border-gray-100'].join(' ')}>
            <p className={['font-semibold text-xs mb-2', dark ? 'text-gray-400' : 'text-gray-500'].join(' ')}>🤖 تحليل المخاطر</p>
            <div className={['leading-relaxed whitespace-pre-wrap', dark ? 'text-gray-300' : 'text-gray-700'].join(' ')}>
              {item.content}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [dark, setDark] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [activeSector, setActiveSector] = useState('sector_invest')
  const [news, setNews] = useState<NewsItem[]>([])
  const [digest, setDigest] = useState<DigestItem[]>([])
  const [digestDates, setDigestDates] = useState<string[]>([])
  const [activeDigestDate, setActiveDigestDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') setDark(true)
  }, [])

  const toggleDark = () => {
    setDark(prev => {
      localStorage.setItem('darkMode', String(!prev))
      return !prev
    })
  }

  const fetchTab = activeTab === 'sectors' ? activeSector : activeTab

  const loadNews = useCallback(async (tab: string, pg: number, replace = false) => {
    if (tab === 'digest') return
    setLoading(true)
    try {
      const res = await fetch('/api/news?tab=' + tab + '&page=' + pg)
      const data = await res.json()
      const items: NewsItem[] = data.items || []
      setNews(prev => replace ? items : [...prev, ...items])
      setHasMore(items.length === 30)
      if (replace) setLastUpdated(new Date().toLocaleTimeString('ar-EG'))
    } catch {}
    setLoading(false)
  }, [])

  const loadDigest = useCallback(async (date?: string) => {
    try {
      const url = date ? `/api/digest?action=get&date=${date}` : '/api/digest?action=get'
      const res = await fetch(url)
      const data = await res.json()
      setDigest(data.items || [])
      if (data.dates && data.dates.length > 0) {
        setDigestDates(data.dates)
        if (!date) setActiveDigestDate(data.dates[0])
      }
    } catch {}
  }, [])

  useEffect(() => {
    setPage(1)
    setNews([])
    if (activeTab === 'digest') loadDigest()
    else loadNews(fetchTab, 1, true)
  }, [activeTab, activeSector])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadNews(fetchTab, 1, true)
      setPage(1)
    } catch {}
    setRefreshing(false)
  }

  // auto-refresh كل دقيقتين
  useEffect(() => {
    if (activeTab === 'digest') return
    const interval = setInterval(() => {
      loadNews(fetchTab, 1, true)
    }, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [activeTab, activeSector])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    loadNews(fetchTab, next, false)
  }

  return (
    <div className={['min-h-screen', dark ? 'bg-gray-900' : 'bg-[#f0f4f8]'].join(' ')}>

      <header className="bg-[#1a3c5e] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg leading-tight">🛡 رادار المخاطر</h1>
            <p className="text-blue-200 text-xs">Egypt Risk Radar</p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && <span className="text-blue-300 text-xs hidden sm:block">{'آخر تحديث: ' + lastUpdated}</span>}
            <button onClick={toggleDark} className="bg-[#2980b9] hover:bg-blue-500 text-white text-sm px-3 py-2 rounded-lg transition-colors">
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={handleRefresh} disabled={refreshing} className="bg-[#2980b9] hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-3 py-2 rounded-lg font-medium transition-colors">
              {refreshing ? <span className="inline-block animate-spin">⟳</span> : '⟳'}
            </button>
          </div>
        </div>
      </header>

      <div className={['border-b sticky top-[60px] z-40', dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'].join(' ')}>
        <div className="max-w-2xl mx-auto">
          <div className="tabs-scroll flex overflow-x-auto px-2 py-1 gap-1">
            {MAIN_TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={['tab-btn whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium shrink-0',
                  activeTab === tab.key ? 'bg-[#1a3c5e] text-white' : dark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100',
                ].join(' ')}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'sectors' && (
        <div className={['border-b', dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'].join(' ')}>
          <div className="max-w-2xl mx-auto">
            <div className="tabs-scroll flex overflow-x-auto px-2 py-1 gap-1">
              {SECTOR_TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveSector(tab.key)}
                  className={['tab-btn whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium shrink-0',
                    activeSector === tab.key ? 'bg-[#2980b9] text-white' : dark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-50',
                  ].join(' ')}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-4">

        {activeTab === 'digest' && (
          <div>
            <div className="mb-4">
              <h2 className={['font-bold text-lg', dark ? 'text-blue-300' : 'text-[#1a3c5e]'].join(' ')}>🤖 الموجز اليومي</h2>
              <p className="text-gray-400 text-xs mt-0.5">موجز أنباء وتحليلات — ينزل كل يوم الساعة 10 مساءً</p>
            </div>

            {/* تبويبات التواريخ */}
            {digestDates.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {digestDates.map(d => (
                  <button key={d} onClick={() => { setActiveDigestDate(d); loadDigest(d) }}
                    className={['whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors',
                      activeDigestDate === d
                        ? 'bg-[#1a3c5e] text-white'
                        : dark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600 border border-gray-200',
                    ].join(' ')}>
                    {'📅 موجز ' + new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </button>
                ))}
              </div>
            )}

            {digest.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🤖</div>
                <p className="text-gray-500 font-medium">لا يوجد موجز لليوم</p>
                <p className="text-gray-400 text-sm mt-1">ينزل الموجز اليومي الساعة 10 مساءً</p>
              </div>
            ) : (
              <>
                <div className={['text-xs font-medium mb-3 px-1', dark ? 'text-gray-400' : 'text-gray-500'].join(' ')}>
                  {'📋 موجز ' + (activeDigestDate ? new Date(activeDigestDate).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '')}
                  {' · ' + digest.filter(d => d.tab_key !== 'overall').reduce((s, d) => s + d.news_count, 0) + ' خبر'}
                </div>
                {digest.map(item => <DigestCard key={item.id} item={item} dark={dark} />)}
              </>
            )}
          </div>
        )}

        {activeTab !== 'digest' && (
          <>
            {loading && news.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-[#1a3c5e] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">جاري التحميل...</p>
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-500 font-medium">لا توجد أخبار</p>
                <p className="text-gray-400 text-sm mt-1">اضغط تحديث لجلب أحدث الأخبار</p>
              </div>
            ) : (
              <>
                <div className="mb-2 text-xs text-gray-400">{news.length + ' خبر'}</div>
                {news.map(item => <NewsCard key={item.id} item={item} dark={dark} />)}
                {hasMore && (
                  <button onClick={loadMore} disabled={loading}
                    className={['w-full py-3 mt-2 text-sm rounded-xl border font-medium transition-colors disabled:opacity-50',
                      dark ? 'bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-[#2980b9] hover:bg-gray-50',
                    ].join(' ')}>
                    {loading ? 'جاري التحميل...' : 'تحميل المزيد'}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        🛡 رادار المخاطر · Egypt Risk Radar
      </footer>
    </div>
  )
}
