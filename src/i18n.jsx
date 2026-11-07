import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Arabic is the source language: every string in the code is Arabic, and English is looked up here.
// A string with no entry stays as it is, so nothing ever shows up blank.
const EN = {
  // Header, footer, account
  'بلو هوم': 'Blue Home',
  'إغلاق القائمة': 'Close menu',
  'فتح القائمة': 'Open menu',
  'الرئيسية': 'Home',
  'العقارات': 'Properties',
  'الوحدات': 'Units',
  'الأراضي': 'Lands',
  'من نحن': 'About us',
  'تواصل معنا': 'Contact us',
  'تسجيل الدخول': 'Login',
  'إنشاء حساب': 'Sign up',
  'الحساب': 'Account',
  'خروج': 'Log out',
  'نظرة عامة': 'Overview',
  'الإعلانات': 'Listings',
  'المناطق': 'Areas',
  'العملاء': 'Customers',
  'الطلبات': 'Requests',
  'الآراء': 'Testimonials',
  'الإعدادات': 'Settings',
  'بتدوّر على عقار مناسب؟': 'Looking for the right property?',
  'فريق بلو هوم يساعدك تختار الوحدة الصح بالسعر ونظام السداد اللي يناسبك.': 'The Blue Home team helps you pick the right unit at a price and payment plan that suit you.',
  'اتصل بنا': 'Call us',
  'واتساب': 'WhatsApp',
  'فيسبوك': 'Facebook',
  'إنستغرام': 'Instagram',
  'يوتيوب': 'YouTube',
  'روابط سريعة': 'Quick links',
  'العروض': 'Offers',
  'بحث متقدم': 'Advanced search',
  'الشركة': 'Company',
  'مرحباً، أود الاستفسار عن عروض بلو هوم.': 'Hello, I would like to ask about Blue Home offers.',
  'جميع الحقوق محفوظة.': 'All rights reserved.',
  'شقق وفلل وأراضٍ ومحلات للبيع': 'Apartments, villas, lands and shops for sale',
  'بأسعار واضحة ونظام سداد يناسبك.': 'with clear prices and a payment plan that suits you.',
  'في': 'in',
  'و': 'and',
  'English': 'English',
  'عربي': 'عربي',

  // Login / signup
  'أهلاً بعودتك': 'Welcome back',
  'سجّل دخولك لمتابعة العقارات والأسعار': 'Log in to follow properties and prices',
  'ادخل باسم المستخدم وكلمة المرور.': 'Enter your username and password.',
  'اسم المستخدم': 'Username',
  'كلمة المرور': 'Password',
  'تأكيد كلمة المرور': 'Confirm password',
  'جارٍ الدخول…': 'Logging in…',
  'ليس لديك حساب؟': "Don't have an account?",
  'لديك حساب؟': 'Already have an account?',
  'انضم إلى بلو هوم': 'Join Blue Home',
  'أنشئ حسابك المجاني واطّلع على الأسعار الكاملة': 'Create your free account and see the full prices',
  'أنشئ حسابًا جديدًا على بلو هوم.': 'Create a new Blue Home account.',
  'الاسم الأول': 'First name',
  'الاسم الثاني': 'Last name',
  'رقم التليفون': 'Phone number',
  'العنوان': 'Address',
  'جارٍ إنشاء الحساب…': 'Creating account…',
  'تأكيد كلمة المرور غير مطابق': 'Passwords do not match',
  'إظهار كلمة المرور': 'Show password',
  'إخفاء كلمة المرور': 'Hide password',

  // Price gate
  'الأسعار تظهر بعد التسجيل': 'Prices appear after sign-up',
  'السعر يظهر بعد التسجيل': 'Price appears after sign-up',
  'إغلاق': 'Close',
  'حصري للأعضاء': 'Members only',
  'سجّل مجاناً لعرض الأسعار': 'Sign up free to see prices',
  'أنشئ حسابك في بلو هوم خلال دقيقة واحدة، واطّلع على الأسعار الكاملة لكل العقارات والوحدات.': 'Create your Blue Home account in one minute and see the full prices of every property and unit.',
  'أسعار كل الشقق والفلل والأراضي والمحلات': 'Prices of all apartments, villas, lands and shops',
  'تفاصيل المقدّم والأقساط وسعر المتر': 'Down payment, installments and price per meter',
  'تواصل مباشر مع فريق المبيعات': 'Direct contact with the sales team',
  'إنشاء حساب مجاني': 'Create a free account',
  'لديّ حساب: تسجيل الدخول': 'I have an account: Login',
  'تصفّح بدون أسعار': 'Browse without prices',

  // Home
  'اكتشف سكنك القادم': 'Discover your next home',
  'شقق، فلل، تاون وتوين هاوس، وأراضٍ في 6 أكتوبر والشيخ زايد وأكتوبر الجديدة. السعر والمساحة ونظام السداد يظهرون عند إدخالهم فقط.': 'Apartments, villas, townhouses, twin houses and lands in 6th of October, Sheikh Zayed and New October. Price, area and payment plan are shown only when entered.',
  'اكتب كلمة من اسم العقار': 'Type part of the property name',
  'المنطقة أو اسم الكمبوند': 'Area or compound name',
  'المنطقة': 'Area',
  'كل المناطق': 'All areas',
  'نوع العقار': 'Property type',
  'الغرف': 'Rooms',
  'نطاق السعر': 'Price range',
  'حتى 3 مليون': 'Up to 3 million',
  'حتى 6 مليون': 'Up to 6 million',
  'حتى 10 مليون': 'Up to 10 million',
  'حتى 20 مليون': 'Up to 20 million',
  'بحث': 'Search',
  'اختصارات': 'Shortcuts',
  'بتدور على إيه؟': 'What are you looking for?',
  'شقق': 'Apartments',
  'فلل': 'Villas',
  'تاون': 'Townhouses',
  'توين': 'Twin houses',
  'أراضي': 'Lands',
  'محلات': 'Shops',
  'إداري': 'Administrative',
  'فنادق': 'Hotels',
  'جارٍ تحميل العقارات…': 'Loading properties…',
  'للبيع': 'For sale',
  'عقارات للبيع': 'Properties for sale',
  'كل العقارات': 'All properties',
  'متاح الآن': 'Available now',
  'أحدث الوحدات': 'Latest units',
  'عرض الوحدات': 'View units',
  'أراضٍ': 'Lands',
  'أحدث الأراضي': 'Latest lands',
  'كل الأراضي': 'All lands',
  'سداد': 'Payment',
  'عروض وفرص استثمارية': 'Offers and investment opportunities',
  'كل العروض': 'All offers',
  'التغطية': 'Coverage',
  'المناطق الأكثر طلبًا': 'Most requested areas',
  'إعلان منشور': 'published listings',
  'آراء العملاء': 'Customer reviews',
  'لا ننشر تقييمات جاهزة. يظهر هنا رأي العميل فقط بعد موافقته، ولا توجد آراء منشورة حاليًا.': 'We do not publish ready-made reviews. A customer’s opinion appears here only with their approval, and none are published right now.',
  'رسالة سريعة': 'Quick message',
  'تواصل مع بلو هوم': 'Contact Blue Home',
  'اكتب اسمك ورقم الموبايل وطلبك. الطلب يتحفظ لصاحب المنصة.': 'Write your name, mobile number and request. It is saved for the platform owner.',

  // Property types and labels
  'شقة': 'Apartment',
  'فيلا': 'Villa',
  'تاون هاوس': 'Townhouse',
  'توين هاوس': 'Twin house',
  'أرض': 'Land',
  'محل تجاري': 'Shop',
  'فندق': 'Hotel',
  'عقار': 'Property',
  'بيع': 'Sale',
  'استثمار': 'Investment',
  'كاش': 'Cash',
  'تقسيط': 'Installments',
  'كاش أو تقسيط': 'Cash or installments',
  'متاح': 'Available',
  'محجوز': 'Reserved',
  'مباع': 'Sold',
  'الأحدث': 'Newest',
  'السعر من الأقل للأعلى': 'Price: low to high',
  'السعر من الأعلى للأقل': 'Price: high to low',
  'المساحة من الأكبر': 'Area: largest first',
  'المساحة من الأصغر': 'Area: smallest first',
  'على الطوب الأحمر': 'Red brick',
  'نص تشطيب': 'Semi-finished',
  'تشطيب كامل': 'Fully finished',
  'سوبر لوكس': 'Super lux',
  'ألترا سوبر لوكس': 'Ultra super lux',
  'مفروش': 'Furnished',
  'استلام فوري': 'Immediate delivery',
  'تحت الإنشاء': 'Under construction',
  'مسجّل شهر عقاري': 'Registered (Real Estate Registry)',
  'عقد ابتدائي': 'Preliminary contract',
  'صحة توقيع': 'Signature validated',
  'توكيل': 'Power of attorney',
  'شغّال حاليًا': 'Currently operating',
  'متوقف عن التشغيل': 'Not operating',
  'طلب معاينة': 'Request a viewing',
  'معرفة التفاصيل': 'Get details',
  'تواصل عام': 'General inquiry',
  'نجمة واحدة': '1 star',
  'نجمتان': '2 stars',

  // Cards, listings, filters
  'السعر غير مُدخل': 'Price not entered',
  'تواصل معنا وهنبعتلك صور وفيديو العقار': 'Contact us and we will send you photos and a video of the property',
  'تصفية': 'Filter',
  'الخريطة': 'Map',
  'إغلاق الخريطة': 'Close map',
  'جارٍ التحميل…': 'Loading…',
  'عدد الغرف': 'Number of rooms',
  'كل الغرف': 'All rooms',
  'لا توجد نتائج مطابقة. وسّع السعر أو امسح بعض الفلاتر.': 'No matching results. Widen the price or clear some filters.',
  'السابق': 'Previous',
  'التالي': 'Next',
  'لا توجد إحداثيات للنتائج الحالية، والخريطة توضح نطاق غرب القاهرة.': 'The current results have no coordinates; the map shows the West Cairo area.',
  'البحث العقاري': 'Property search',
  'الكل': 'All',
  'نوع العملية': 'Operation',
  'اسم المشروع أو الكمبوند': 'Project or compound name',
  'اكتب جزءًا من الاسم': 'Type part of the name',
  'السعر من': 'Price from',
  'السعر إلى': 'Price to',
  'المساحة من م²': 'Area from m²',
  'المساحة إلى م²': 'Area to m²',
  'الحمامات': 'Bathrooms',
  'نظام السداد': 'Payment plan',
  'المقدم من': 'Down payment from',
  'المقدم إلى': 'Down payment to',
  'مدة التقسيط': 'Installment period',
  'الحالة': 'Status',
  'عروض وتقسيط وفرص استثمار': 'Offers, installments and investment opportunities',
  'الترتيب': 'Sort',
  'عرض النتائج': 'Show results',
  'مسح': 'Clear',

  // Property detail
  'تفاصيل العقار': 'Property details',
  'النوع': 'Type',
  'العملية': 'Operation',
  'مساحة الأرض': 'Land area',
  'المساحة': 'Area',
  'التصنيف': 'Rating',
  'عدد الغرف الفندقية': 'Hotel rooms',
  'حالة التشغيل': 'Operating status',
  'الترخيص السياحي': 'Tourism licence',
  'مرخّص': 'Licensed',
  'عدد الأدوار': 'Floors',
  'عدد الوحدات': 'Units',
  'الحمامات ': 'Bathrooms',
  'الدور': 'Floor',
  'التشطيب': 'Finishing',
  'الاستلام': 'Delivery',
  'الوضع القانوني': 'Legal status',
  'السداد': 'Payment',
  'المقدم': 'Down payment',
  'القسط': 'Installment',
  'ملاحظة السداد': 'Payment note',
  'سعر المتر': 'Price per meter',
  'آخر تحديث': 'Last updated',
  'فيديو العقار': 'Property video',
  'الوصف': 'Description',
  'الجولة الافتراضية': 'Virtual tour',
  'الموقع': 'Location',
  'فتح في خرائط جوجل': 'Open in Google Maps',
  'السعر غير مُدخل بعد': 'Price not entered yet',
  'السعر قابل للتفاوض': 'Price is negotiable',
  'اتصال': 'Call',
  'أرقام الاتصال المباشر غير مضافة بعد.': 'Direct contact numbers have not been added yet.',
  'طلب معاينة أو تفاصيل': 'Request a viewing or details',
  'عقارات قريبة في نفس المنطقة': 'Nearby properties in the same area',

  // Contact / inquiry / misc pages
  'بيانات التواصل': 'Contact details',
  'الهاتف': 'Phone',
  'البريد الإلكتروني': 'Email',
  'أرسل رسالة': 'Send a message',
  'الاسم': 'Name',
  'الموبايل': 'Mobile',
  'نوع الطلب': 'Request type',
  'الرسالة': 'Message',
  'جارٍ الإرسال…': 'Sending…',
  'إرسال الطلب': 'Send request',
  'تم استلام طلبك. سيظهر لصاحب المنصة في لوحة التحكم.': 'Your request was received. The platform owner will see it in the dashboard.',
  'الصفحة غير موجودة': 'Page not found',
  'الرابط لا يطابق عقارًا أو إعلانًا منشورًا.': 'The link does not match a published property or listing.',
  'العودة للرئيسية': 'Back to home',
  'المشروع': 'Project',

  // Install prompt
  'نزّل أبلكيشن بلو هوم': 'Get the Blue Home app',
  'افتح الموقع أسرع من أيقونة على الشاشة الرئيسية.': 'Open the site faster from an icon on your home screen.',
  'تثبيت': 'Install',
}

// Patterns for strings with a number inside (5 غرف, 12 دور, 3 نجوم ...).
const PATTERNS = [
  [/^(\d+) نجوم$/, '$1 stars'],
  [/^(\d+) (?:دور|أدوار)$/, (_, n) => `${n} ${Number(n) === 1 ? 'floor' : 'floors'}`],
  [/^(\d+) (?:وحدة|وحدات)$/, (_, n) => `${n} ${Number(n) === 1 ? 'unit' : 'units'}`],
  [/^(\d+) (?:غرفة|غرف)$/, (_, n) => `${n} ${Number(n) === 1 ? 'room' : 'rooms'}`],
  [/^(\d+)\+ غرف$/, '$1+ rooms'],
  [/^(\d+) حمام$/, (_, n) => `${n} ${Number(n) === 1 ? 'bath' : 'baths'}`],
  [/^(\d+) شهر$/, '$1 months'],
  [/^حتى (\d+) شهر$/, 'Up to $1 months'],
  [/^(\d+) نتيجة$/, (_, n) => `${n} ${Number(n) === 1 ? 'result' : 'results'}`],
  [/^(\d+) إعلان منشور$/, '$1 published listings'],
  [/^صفحة (\d+) من (\d+)$/, 'Page $1 of $2'],
  [/^الرئيسية \/ (.+)$/, (_, rest) => `Home / ${rest}`],
  [/^موقع (.+)$/, 'Location of $1'],
  [/^المشروع: (.+)$/, 'Project: $1'],
]

function translate(text) {
  if (typeof text !== 'string' || !text) return text
  if (EN[text] != null) return EN[text]
  for (const [pattern, replacement] of PATTERNS) {
    if (pattern.test(text)) return text.replace(pattern, replacement)
  }
  // Units glued to numbers: «12,000 ج.م» / «120 م²».
  if (/ج\.م|م²/.test(text)) return text.replace(/ج\.م/g, 'EGP').replace(/م²/g, 'm²')
  return text
}

const STORAGE_KEY = 'bluehome_lang'
const LangContext = createContext({ lang: 'ar', t: (text) => text, setLang: () => {} })

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ar' || saved === 'en') return saved
  } catch { /* storage blocked */ }
  return 'ar'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)
  const setLang = useCallback((next) => {
    setLangState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* private mode */ }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl'
  }, [lang])

  const value = useMemo(() => ({
    lang,
    setLang,
    t: lang === 'en' ? translate : (text) => text,
  }), [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

// Header button: shows the language you would switch TO.
export function LangToggle() {
  const { lang, setLang } = useLang()
  const next = lang === 'en' ? 'ar' : 'en'
  return (
    <button
      type="button"
      className="lang-toggle"
      lang={next}
      aria-label={next === 'en' ? 'Switch to English' : 'التبديل إلى العربية'}
      onClick={() => setLang(next)}
    >
      {next === 'en' ? 'EN' : 'عربي'}
    </button>
  )
}
