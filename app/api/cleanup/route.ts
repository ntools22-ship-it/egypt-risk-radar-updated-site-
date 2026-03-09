import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // تحديد تاريخ ما قبل 30 يوماً من الآن
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // حذف الأخبار القديمة من جدول 'news'
    const { error: newsError, count: newsCount } = await supabase
      .from('news')
      .delete()
      .lt('created_at', thirtyDaysAgo)

    // حذف الملخصات القديمة من جدول 'digest'
    const { error: digestError, count: digestCount } = await supabase
      .from('digest')
      .delete()
      .lt('created_at', thirtyDaysAgo)

    // التحقق من وجود أخطاء أثناء عملية الحذف
    if (newsError || digestError) {
      return NextResponse.json({ error: newsError?.message || digestError?.message }, { status: 500 })
    }

    // إرسال تقرير بعدد السجلات التي تم تنظيفها
    return NextResponse.json({
      message: 'Cleanup done',
      deleted_news: newsCount,
      deleted_digest: digestCount,
    })
  } catch (err: any) {
    // معالجة أي خطأ غير متوقع في الخادم
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
