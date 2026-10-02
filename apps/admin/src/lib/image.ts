const MAX_DIMENSION = 2000
const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024
const JPEG_QUALITY = 0.85

/**
 * Downscale (max 2000px on the long side) and re-encode an image as JPEG before
 * upload, but only when it is larger than ~1.5MB or 2000px. GIFs are left alone
 * (animation), and anything the browser can't decode (e.g. HEIC in Chrome) is
 * returned untouched so the API can still handle it.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  try {
    const longSide = Math.max(bitmap.width, bitmap.height)
    if (file.size <= COMPRESS_ABOVE_BYTES && longSide <= MAX_DIMENSION) return file

    const scale = Math.min(1, MAX_DIMENSION / longSide)
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    // JPEG has no alpha channel: paint white so transparent PNG areas don't turn black.
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    // Keep the original if encoding failed or bought nothing (no resize and no smaller).
    if (!blob || (scale === 1 && blob.size >= file.size)) return file

    const name = file.name.replace(/\.[^./]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified })
  } catch {
    return file
  } finally {
    bitmap.close()
  }
}
