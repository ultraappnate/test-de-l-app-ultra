// Compression d'image côté navigateur : redimensionne + compresse en JPEG/dataURL
// pour éviter de stocker des images lourdes en base64 (sauvegarde Postgres).
// maxDim = côté le plus long max (px) ; quality = 0..1.
export async function compressImage(file, maxDim = 800, quality = 0.82) {
  if (!file || !file.type?.startsWith('image/')) return null
  // Les GIF/SVG ne se recompressent pas bien → on garde tel quel s'ils sont petits, sinon on tente quand même
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = dataUrl
    })
    let { width, height } = img
    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    const out = canvas.toDataURL('image/jpeg', quality)
    // Si la compression n'a pas aidé (rare), on garde le plus petit des deux
    return out.length < dataUrl.length ? out : dataUrl
  } catch {
    return dataUrl // fallback : image originale
  }
}

// Garde-fou de taille (en Mo) sur le fichier source
export function fileTooLarge(file, maxMB = 8) {
  return !!file && file.size > maxMB * 1024 * 1024
}
