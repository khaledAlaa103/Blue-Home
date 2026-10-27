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
