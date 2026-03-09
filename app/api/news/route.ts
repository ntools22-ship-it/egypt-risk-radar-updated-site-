import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab') || 'all'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 30
  const offset = (page - 1) * limit

  try {
    let query = supabase
      .from('news')
      .select('id, title, url, source_name, tabs, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // إذا كان المستخدم يطلب قسماً معيناً وليس "الكل"
    if (tab !== 'all') {
      query = query.contains('tabs', [tab])
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data || [], total: count })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
