'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────
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
}

// ─── Tabs config ────────────────────────────────────────────────────────────
const MAIN_TABS = [
  { key: 'all',     label: '📋 الكل' },
  { key: 'warning', label: '⚠️ إنذار مبكر' },
  { key: 'credit',  label: '💰 تمويل وائتمان' },
  { key: 'banks',   label: '🏦 البنوك' },
  { key: 'cbe',     label: '🏛️ المركزي' },
  { key: 'fx',      label: '💵 الدولار' },
  { key: 'global',  label: '🌍 اقتصاد عالمي' },
  { key: 'breaking',label: '⚡ عاجل' },
  { key: 'sectors', label: '🏗️ القطاعات' },
  { key: 'digest',  label: '🤖 الموجز اليومي' },
]

const SECTOR_TABS = [
  { key: 'sector_realestate', label: '🏗️ عقارات' },
  { key: 'sector_energy',     label: '⚡ طاقة' },
  { key: 'sector_industry',   label: '🏭 صناعة' },
  { key: 'sector_tech',       label: '💻 تكنولوجيا' },
  { key: 'sector_agri',       label: '🌾 زراعة' },
  { key: 'sector_transport',  label: '🚢 نقل وملاحة' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ar-EG', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

function isWarning(tabs: string[]): boolean { return tabs.includes('warning') }
function isCredit(tabs: string[]): boolean  { return tabs.includes('credit') && !tabs.includes('warning') }

function tabBadgeColor(tab: string): string {
  if (tab === 'warning') return 'bg-red-100 text-red-700'
  if (tab === 'credit')  return 'bg-green-100 text-green-700'
  if (tab === 'cbe')     return 'bg-blue-100 text-blue-700'
  if (tab === 'banks')   return 'bg-indigo-100 text-indigo-700'
  if (tab === 'fx')      return 'bg-yellow-100 text-yellow-700'
  if (tab === 'breaking')return 'bg-orange-100 text-orange-700'
  return 'bg-gray-100 text-gray-600'
}

const TAB_LABELS: Record<string, string> = {
  breaking: '⚡ عاجل', banks: '🏦 البنوك', credit: '💰 تمويل',
  warning: '⚠️ إنذار', fx: '💵 دولار', cbe: '🏛️ مركزي',
  global: '🌍 عالمي', sector_agri: '🌾 زراعة', sector_industry: '🏭 صناعة',
  sector_realestate: '🏗️ عقارات', sector_energy: '⚡ طاقة',
  sector_transport: '🚢 نقل', sector_tech: '💻 تكنولوجيا',
}

// ─── Share helper ────────────────────────────────────────────────────────────
async function share(title: string, url: string) {
  if (navigator.share) {
    try { await navigator.share({ title, url }) } catch {}
  } else {
    await navigator.clipboard.writeText(`${title}\n${url}`)
    alert('تم نسخ الرابط')
  }
}

// ─── News Card ───────────────────────────────────────────────────────────────
function NewsCard({ item }: { item: NewsItem }) {
  const warn = isWarning(item.tabs)
  const credit = isCredit(item.tabs)

  return (
    <div className={`news-card bg-white rounded-xl p-4 border-r-4 shadow-sm mb-3 ${
      warn   ? 'border-red-500 warning-card'
      : credit ? 'border-green-500'
      : 'border-transparent'
    }`}>
      {/* Title */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-[#1a3c5e] font-semibold text-base leading-relaxed hover:text-[#2980b9] transition-colors mb-3"
      >
        {item.title}
      </a>

      {/* Tab badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        {item.tabs.map(tab => (
          <span key={tab} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tabBadgeColor(tab)}`}>
            {TAB_LABELS[tab] || tab}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400 min-w-0">
          <span className="truncate">📰 {item.source_name}</span>
          <span>·</span>
          <span className="whitespace-nowrap">🕐 {formatDate(item.created_at)}</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => share(item.title, item.url)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            📤 مشاركة
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-[#1a3c5e] hover:bg-[#2980b9] text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            ↗ التفاصيل
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Digest Card ─────────────────────────────────────────────────────────────
function DigestCard({ item }: { item: DigestItem }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl p-4 border-r-4 border-[#2980b9] shadow-sm mb-3">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="font-bold text-[#1a3c5e] text-base">{item.tab_label}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{item.news_count} خبر · {item.digest_date}</p>
        </div>
        <span className="text-gray-400 text-lg">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.content}</div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState('all')
  const [activeSector, setActiveSector] = useState('sector_realestate')
  const [news, setNews] = useState<NewsItem[]>([])
  const [digest, setDigest] = useState<DigestItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')

  const fetchTab = activeTab === 'sectors' ? activeSector : activeTab

  const loadNews = useCallback(async (tab: string, pg: number, replace = false) => {
    if (tab === 'digest') return
    setLoading(true)
    try {
      const res = await fetch(`/api/news?tab=${tab}&page=${pg}`)
      const data = await res.json()
      const items: NewsItem[] = data.items || []
      setNews(prev => replace ? items : [...prev, ...items])
      setHasMore(items.length === 30)
      if (replace) setLastUpdated(new Date().toLocaleTimeString('ar-EG'))
    } catch {}
    setLoading(false)
  }, [])

  const loadDigest = useCallback(async () => {
    try {
      const res = await fetch('/api/digest?action=get')
      const data = await res.json()
      setDigest(data.items || [])
    } catch {}
  }, [])

  // Load on tab change
  useEffect(() => {
    setPage(1)
    setNews([])
    if (activeTab === 'digest') {
      loadDigest()
    } else {
      loadNews(fetchTab, 1, true)
    }
  }, [activeTab, activeSector])

  // Refresh news
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/fetch-news')
      await loadNews(fetchTab, 1, true)
      setPage(1)
    } catch {}
    setRefreshing(false)
  }

  // Generate digest
  const handleGenerateDigest = async () => {
    setGenerating(true)
    try {
      await fetch('/api/digest?action=generate')
      await loadDigest()
    } catch {}
    setGenerating(false)
  }

  // Load more
  const loadMore = () => {
    const next = page + 1
    setPage(next)
    loadNews(fetchTab, next, false)
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">

      {/* ── Header ── */}
      <header className="bg-[#1a3c5e] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg leading-tight">🛡 رادار المخاطر</h1>
            <p className="text-blue-200 text-xs">Egypt Risk Radar</p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-blue-300 text-xs hidden sm:block">آخر تحديث: {lastUpdated}</span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-[#2980b9] hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
            >
              {refreshing ? (
                <span className="inline-block animate-spin">⟳</span>
              ) : '⟳'}
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Tabs ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
        <div className="max-w-2xl mx-auto">
          <div className="tabs-scroll flex overflow-x-auto px-2 py-1 gap-1">
            {MAIN_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-btn whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-[#1a3c5e] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sector Sub-tabs ── */}
      {activeTab === 'sectors' && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto">
            <div className="tabs-scroll flex overflow-x-auto px-2 py-1 gap-1">
              {SECTOR_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSector(tab.key)}
                  className={`tab-btn whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                    activeSector === tab.key
                      ? 'bg-[#2980b9] text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <main className="max-w-2xl mx-auto px-4 py-4">

        {/* Digest Tab */}
        {activeTab === 'digest' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-[#1a3c5e] text-lg">🤖 الموجز اليومي</h2>
                <p className="text-gray-500 text-xs mt-0.5">تحليل الأخبار بالذكاء الاصطناعي</p>
              </div>
              <button
                onClick={handleGenerateDigest}
                disabled={generating}
                className="bg-[#1a3c5e] hover:bg-[#2980b9] disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {generating ? '⟳ جاري التوليد...' : '✨ توليد جديد'}
              </button>
            </div>

            {digest.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🤖</div>
                <p className="text-gray-500 font-medium">لا يوجد موجز لليوم</p>
                <p className="text-gray-400 text-sm mt-1">اضغط "توليد جديد" لإنشاء التحليل</p>
              </div>
            ) : (
              digest.map(item => <DigestCard key={item.id} item={item} />)
            )}
          </div>
        )}

        {/* News Tabs */}
        {activeTab !== 'digest' && (
          <>
            {loading && news.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-3 border-[#1a3c5e] border-t-transparent rounded-full animate-spin" />
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
                <div className="mb-2 text-xs text-gray-400">{news.length} خبر</div>
                {news.map(item => <NewsCard key={item.id} item={item} />)}

                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-3 mt-2 text-sm text-[#2980b9] bg-white rounded-xl border border-gray-200 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'جاري التحميل...' : 'تحميل المزيد'}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-xs text-gray-400">
        🛡 رادار المخاطر · Egypt Risk Radar
      </footer>
    </div>
  )
}
