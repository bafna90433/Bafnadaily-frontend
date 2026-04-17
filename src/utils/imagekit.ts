/**
 * ImageKit URL transformer
 * Appends ?tr=w-{width},h-{height},q-{quality},f-webp to ImageKit URLs
 * Falls back to original URL for non-ImageKit images
 */
export function ikImg(
  url: string | undefined,
  width: number,
  height?: number,
  quality = 80
): string {
  if (!url) return ''
  if (!url.includes('ik.imagekit.io')) return url

  // Remove existing tr params if any
  const base = url.split('?')[0]
  const h = height ? `,h-${height}` : ''
  return `${base}?tr=w-${width}${h},q-${quality},f-webp`
}

/** Preset sizes for common use cases */
export const ik = {
  /** Product card thumbnail (square) */
  thumb: (url: string) => ikImg(url, 300, 300, 80),
  /** Category circle image */
  catCircle: (url: string) => ikImg(url, 200, 200, 80),
  /** Hero / banner (wide) */
  banner: (url: string) => ikImg(url, 900, 400, 85),
  /** Hanging keychain item */
  hanging: (url: string) => ikImg(url, 120, 180, 80),
  /** Product detail main image */
  detail: (url: string) => ikImg(url, 600, 600, 85),
  /** Product detail thumbnail */
  detailThumb: (url: string) => ikImg(url, 100, 100, 75),
}
