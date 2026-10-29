export const PROPERTY_TYPES = ['شقة', 'فيلا', 'تاون هاوس', 'توين هاوس', 'أرض', 'محل تجاري', 'إداري']
export const ROOM_TYPES = ['شقة', 'فيلا', 'تاون هاوس', 'توين هاوس']
export const OPERATIONS = [
  { id: 'sale', label: 'بيع' },
  { id: 'investment', label: 'استثمار' },
]
export const PAYMENTS = [
  { id: 'cash', label: 'كاش' },
  { id: 'installment', label: 'تقسيط' },
  { id: 'both', label: 'كاش أو تقسيط' },
]
export const STATUSES = [
  { id: 'available', label: 'متاح' },
  { id: 'reserved', label: 'محجوز' },
  { id: 'sold', label: 'مباع' },
]
export const SORTS = [
  { id: 'newest', label: 'الأحدث' },
  { id: 'price_asc', label: 'السعر من الأقل للأعلى' },
  { id: 'price_desc', label: 'السعر من الأعلى للأقل' },
  { id: 'area_desc', label: 'المساحة من الأكبر' },
  { id: 'area_asc', label: 'المساحة من الأصغر' },
]
// Sale details shown on a property: finishing level, delivery and the contract's legal state.
export const FINISHINGS = [
  { id: 'red-brick', label: 'على الطوب الأحمر' },
  { id: 'semi', label: 'نص تشطيب' },
  { id: 'finished', label: 'تشطيب كامل' },
  { id: 'super-lux', label: 'سوبر لوكس' },
  { id: 'ultra-lux', label: 'ألترا سوبر لوكس' },
  { id: 'furnished', label: 'مفروش' },
]
export const DELIVERIES = [
  { id: 'ready', label: 'استلام فوري' },
  { id: 'construction', label: 'تحت الإنشاء' },
]
export const LEGAL_STATES = [
  { id: 'registered', label: 'مسجّل شهر عقاري' },
  { id: 'primary', label: 'عقد ابتدائي' },
  { id: 'court', label: 'صحة توقيع' },
  { id: 'poa', label: 'توكيل' },
]
// Everything in «العقارات» is a whole building sold as one property.
export const BUILDING_TYPE = 'عقار'
// Floors only mean something for these; finishing applies to everything but land.
export const FLOOR_TYPES = ['شقة', 'إداري', 'محل تجاري']

export const REQUEST_TYPES = [
  { id: 'viewing', label: 'طلب معاينة' },
  { id: 'details', label: 'معرفة التفاصيل' },
  { id: 'contact', label: 'تواصل عام' },
]

export function labelOf(list, id) {
  return list.find((item) => item.id === id)?.label || ''
}

// Phones typed on Arabic keyboards come as ٠١٢… (or Persian ۰۱۲…); validation and links need 0-9.
export function latinDigits(value) {
  return String(value ?? '')
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0))
}
