import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!

const PAGE_SIZE = 30

export async function GET(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { searchParams } = new URL(req.url)
  const tab  = searchParams.get('tab')  || 'all'
  const page = parseInt(searchParams.get('page') || '1', 10)

  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  try {
    let query = supabase
      .from('news')
      .select('id, title, url, source_name, tabs, created_at')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (tab !== 'all') {
      query = query.contains('tabs', [tab])
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data || [], page, tab })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
