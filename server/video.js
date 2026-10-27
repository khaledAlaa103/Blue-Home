// Shared rules for admin video uploads (Cloudflare Worker and local Express server).
export const VIDEO_TYPES = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-m4v': 'm4v',
}

export const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// The admin page shrinks photos before upload; this only stops originals it couldn't shrink.
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024

// Cloudflare rejects request bodies over 100 MB on the Free and Pro plans.
export const VIDEO_MAX_BYTES = 95 * 1024 * 1024

export function videoUploadError(type, size) {
  if (!VIDEO_TYPES[type]) return 'الفيديو لازم يكون MP4 أو MOV أو WebM'
  if (!Number.isFinite(size) || size <= 0) return 'اختر فيديو'
  if (size > VIDEO_MAX_BYTES) return 'حجم الفيديو أكبر من 95 ميجا. صغّره أو ارفعه على يوتيوب وحط اللينك.'
  return ''
}
