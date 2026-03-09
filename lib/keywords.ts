export const WARNING_KW = [
  'تعثر', 'تعثر في السداد', 'عجز عن السداد', 'توقف عن السداد',
  'ديون متعثرة', 'قروض متعثرة', 'محفظة متعثرة', 'ديون رديئة',
  'مخصصات', 'شطب ديون', 'استرداد ديون', 'NPL',
  'إفلاس', 'شهر إفلاس', 'إعسار', 'تصفية', 'حراسة قضائية',
  'إدارة قضائية', 'تعليق النشاط', 'وقف الأعمال',
  'بيع أصول قسري', 'تنازل عن أصول',
  'حجز على أصول', 'حجز على أموال', 'دعوى قضائية', 'نزاع مالي',
  'غرامة مالية', 'خفض تصنيف', 'تخفيض تصنيف', 'جدولة ديون',
  'إعادة جدولة', 'أزمة سيولة', 'خسائر متراكمة', 'مخالفة مالية',
  'انهيار', 'أزمة مالية', 'إغلاق شركة',
]

export const CREDIT_KW = [
  'تسهيل ائتماني', 'تسهيلات ائتمانية', 'قرض', 'تمويل',
  'خط ائتماني', 'توريق', 'سندات', 'صكوك', 'قرض مشترك',
  'تمويل مشترك', 'اتفاقية تمويل', 'اتفاقية قرض', 'ائتمان',
  'حصلت على تمويل', 'وقعت اتفاقية', 'منحة قرض', 'موافقة ائتمانية',
  'اعتماد مستندي', 'ضمانات بنكية', 'رسملة', 'بروتوكول تمويل',
  'مذكرة تفاهم', 'تمويل مشروع', 'متناهي الصغر', 'قرض ميسر',
]

export function getTabs(title: string, summary: string, primaryTab: string | null): string[] {
  const text = title + ' ' + summary
  const tabs: string[] = []

  if (primaryTab) tabs.push(primaryTab)

  if (WARNING_KW.some(k => text.includes(k)) && !tabs.includes('warning')) {
    tabs.push('warning')
  }
  if (CREDIT_KW.some(k => text.includes(k)) && !tabs.includes('credit')) {
    tabs.push('credit')
  }

  return tabs
}

export function isArabic(text: string): boolean {
  const count = (text.match(/[\u0600-\u06ff]/g) || []).length
  return count / Math.max(text.length, 1) > 0.3
}
