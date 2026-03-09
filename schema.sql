-- ═══════════════════════════════════════════
-- رادار المخاطر — Egypt Risk Radar
-- Supabase Schema
-- ═══════════════════════════════════════════

-- جدول الأخبار
CREATE TABLE IF NOT EXISTS news (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text        NOT NULL,
  url         text        NOT NULL,
  source_name text        NOT NULL,
  tabs        text[]      NOT NULL DEFAULT '{}',
  hash        text        UNIQUE NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- جدول الموجز اليومي
CREATE TABLE IF NOT EXISTS digest (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tab_key     text        NOT NULL,
  tab_label   text        NOT NULL,
  content     text        NOT NULL,
  news_count  integer     DEFAULT 0,
  digest_date date        NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz DEFAULT now()
);

-- تعطيل RLS (البيانات عامة)
ALTER TABLE news   DISABLE ROW LEVEL SECURITY;
ALTER TABLE digest DISABLE ROW LEVEL SECURITY;

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_news_tabs       ON news USING GIN(tabs);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_hash       ON news(hash);
CREATE INDEX IF NOT EXISTS idx_digest_date     ON digest(digest_date DESC, tab_key);
