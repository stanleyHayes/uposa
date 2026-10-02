const MAX_DIMENSION = 2000
const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024
const JPEG_QUALITY = 0.85

/**
 * Downscale a photo before upload: long side capped at 2000px, re-encoded as
 * JPEG (quality 0.85). Only applied when the file is over ~1.5MB or larger than
 * 2000px. GIFs (animation) and anything this browser cannot decode (e.g. HEIC
 * in Chrome) are returned untouched for the server to handle.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file
  }

  try {
    const longSide = Math.max(bitmap.width, bitmap.height)
    if (file.size <= COMPRESS_ABOVE_BYTES && longSide <= MAX_DIMENSION) return file

    const scale = Math.min(1, MAX_DIMENSION / longSide)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    // JPEG has no alpha channel — paint white so transparent areas don't turn black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob) return file
    // Already-small sources can re-encode larger; keep the original then.
    if (blob.size >= file.size && longSide <= MAX_DIMENSION) return file

    const name = `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified })
  } catch {
    return file
  } finally {
    bitmap.close()
  }
}
