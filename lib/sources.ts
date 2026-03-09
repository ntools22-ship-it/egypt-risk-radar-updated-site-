export const TABS: Record<string, string> = {
  breaking:          '⚡ عاجل',
  banks:             '🏦 البنوك',
  credit:            '💰 تمويل وائتمان',
  warning:           '⚠️ إنذار مبكر',
  fx:                '💵 أسعار الدولار',
  cbe:               '🏛️ المركزي',
  global:            '🌍 اقتصاد عالمي',
  sector_agri:       '🌾 زراعة',
  sector_industry:   '🏭 صناعة',
  sector_realestate: '🏗️ عقارات',
  sector_energy:     '⚡ طاقة',
  sector_transport:  '🚢 نقل وملاحة',
  sector_tech:       '💻 تكنولوجيا',
}

export const SECTOR_TABS = [
  'sector_agri',
  'sector_industry',
  'sector_realestate',
  'sector_energy',
  'sector_transport',
  'sector_tech',
]

export const SOURCES = [
  // ⚡ عاجل
  { id: 'youm7_breaking',    name: 'اليوم السابع',          url: 'https://www.youm7.com/rss/Section/65',                                                                                                               tab: 'breaking' },
  // 🏦 البنوك
  { id: 'amwal_banks',       name: 'أموال الغد - بنوك',     url: 'https://amwalalghad.com/category/%d8%a8%d9%86%d9%88%d9%83-%d9%88%d9%85%d8%a4%d8%b3%d8%b3%d8%a7%d8%aa-%d9%85%d8%a7%d9%84%d9%8a%d8%a9/feed/',     tab: 'banks' },
  { id: 'masrafeyoun_banks', name: 'المصرفيون - أخبار البنوك', url: 'https://masrafeyoun.ebi.gov.eg/category/banksnews/feed/', tab: 'banks' },
  // 💰 تمويل
  { id: 'amwal_micro',       name: 'أموال الغد - تمويل',    url: 'https://amwalalghad.com/tag/%d9%85%d8%aa%d9%86%d8%a7%d9%87%d9%8a-%d8%a7%d9%84%d8%b5%d8%ba%d8%b1/feed/',                                           tab: 'credit' },
  { id: 'hapi_credit',       name: 'حابي - تمويل',          url: 'https://hapijournal.com/category/%d8%aa%d9%85%d9%88%d9%8a%d9%84/feed/',                                                                             tab: 'credit' },
  { id: 'motawwer_credit',   name: 'المطور - تمويل',        url: 'https://almotawwer.com/tag/%d8%aa%d9%85%d9%88%d9%8a%d9%84-%d8%a7%d9%84%d9%85%d8%b4%d8%b1%d9%88%d8%a7%d8%aa-%d8%a7%d9%84%d8%b5%d8%ba%d9%8a%d8%b1%d8%a9/feed/', tab: 'credit' },
  // 💵 الدولار
  { id: 'hapi_fx',           name: 'حابي - دولار',          url: 'https://hapijournal.com/tag/%d8%a3%d8%a3%d8%b3%d8%b9%d8%a7%d8%b1-%d8%a7%d9%84%d8%af%d9%88%d9%84%d8%a7%d8%b1/feed/',                                     tab: 'fx' },
  // 🏛️ المركزي
  { id: 'almal_cbe',         name: 'المال - مركزي',         url: 'https://almalnews.com/tag/%D8%A7%D9%84%D8%A8%D9%86%D9%83-%D8%A7%D9%84%D9%85%D8%B1%D9%83%D8%B2%D9%8I-%D8%A7%D9%84%D9%85%D8%B5%D8%B1%D9%8A/feed/',  tab: 'cbe' },
  // 🌍 اقتصاد عالمي
  { id: 'alarabiya_economy', name: 'العربية - اقتصاد',      url: 'https://www.alarabiya.net/aswaq/economy.rss',                                                                                                       tab: 'global' },
  // 🌾 زراعة
  { id: 'borsaa_agri',       name: 'البورصة نيوز',          url: 'https://www.alborsaanews.com/tag/%d8%a7%d9%84%d8%b2%d8%b1%d8%a7%d8%b9%d8%a9/feed/',                                                                tab: 'sector_agri' },
  // 🏭 صناعة
  { id: 'borsaa_industry',   name: 'البورصة نيوز',          url: 'https://www.alborsaanews.com/tag/%d8%a7%d9%84%d8%b5%d9%86%d8%a7%d8%b9%d8%a9/feed/',                                                                tab: 'sector_industry' },
  // 🏗️ عقارات
  { id: 'borsaa_realestate', name: 'البورصة نيوز',          url: 'https://www.alborsaanews.com/category/%d8%a7%d9%84%d8%b9%d9%82%d8%a7%d8%b1%d8%a7%d8%aa/feed/',                                                     tab: 'sector_realestate' },
  // ⚡ طاقة
  { id: 'amwal_energy',      name: 'أموال الغد - طاقة',     url: 'https://amwalalghad.com/category/%d8%b7%d8%a7%d9%82%d8%a9/feed/',                                                                                   tab: 'sector_energy' },
  // 🚢 نقل
  { id: 'amwal_transport',   name: 'أموال الغد - نقل',      url: 'https://amwalalghad.com/category/%d9%86%d9%82%d9%84-%d9%88-%d9%85%d9%84%d8%a7%d8%ad%d8%a9/feed/',                                                  tab: 'sector_transport' },
  // 💻 تكنولوجيا
  { id: 'amwal_tech',        name: 'أموال الغد - تكنولوجيا',url: 'https://amwalalghad.com/category/%d8%aa%d9%83%d9%86%d9%88%d9%84%d9%88%d8%ac%d9%8a%d8%a7-%d9%88%d8%a7%d8%aa%d8%b5%d8%a7%d9%84%d8%a7%d8%aa/feed/',   tab: 'sector_tech' },
  // ⚠️ إنذار مبكر — كلمات مفتاحية من كل المصادر
  { id: 'amwal_all',         name: 'أموال الغد',            url: 'https://amwalalghad.com/feed/',              tab: null },
  { id: 'hapi_all',          name: 'حابي',                  url: 'https://hapijournal.com/feed/',              tab: null },
  { id: 'almal_all',         name: 'المال',                 url: 'https://almalnews.com/feed/',                tab: null },
  { id: 'febanks_all',       name: 'في البنوك',             url: 'https://febanks.com/feed/',                  tab: null },
  { id: 'sahm_all',          name: 'سهم نيوز',              url: 'https://sahmnews.com/feed/',                 tab: null },
  { id: 'borsaa_all',        name: 'البورصة نيوز',          url: 'https://www.alborsaanews.com/feed/',         tab: null },
  { id: 'mubasher_all',      name: 'مباشر',                 url: 'https://www.mubasher.info/feed/',            tab: null },
  { id: 'elborsa_all',       name: 'البورصة',               url: 'https://www.elborsa.com/feed/',              tab: null },
  { id: 'masrawy_econ',      name: 'مصراوي اقتصاد',        url: 'https://www.masrawy.com/news/economy/rss',    tab: null },
  { id: 'youm7_econ',        name: 'اليوم السابع اقتصاد',  url: 'https://www.youm7.com/rss/Section/97',        tab: null },
]
