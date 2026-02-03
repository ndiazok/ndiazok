"use client"

/**
 * Supported image formats for upload
 * Includes iPhone formats (HEIC/HEIF)
 */
const SUPPORTED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif',
  '.heic', '.heif', // iPhone formats
]

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
]

/**
 * Check if a file is a supported image format
 */
export function isValidImageFile(file: File): boolean {
  // Check by MIME type
  if (file.type && SUPPORTED_MIME_TYPES.some(mime => file.type.toLowerCase().includes(mime.split('/')[1]))) {
    return true
  }
  
  // Check by extension (for HEIC files that may not have correct MIME)
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (SUPPORTED_EXTENSIONS.includes(ext)) {
    return true
  }
  
  // Also accept generic image types
  if (file.type.startsWith('image/')) {
    return true
  }
  
  return false
}

/**
 * Convert any image file to JPEG format using canvas
 * This handles HEIC conversion if the browser supports it
 */
export async function convertToJpeg(file: File): Promise<File> {
  // If already JPEG, return as is
  if (file.type === 'image/jpeg') {
    return file
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  
  // For HEIC/HEIF, try using createImageBitmap which has better support
  if (ext === 'heic' || ext === 'heif' || file.type.includes('heic') || file.type.includes('heif')) {
    try {
      return await convertHeicToJpeg(file)
    } catch (err) {
      console.warn('[v0] HEIC conversion failed, trying canvas fallback:', err)
    }
  }
  
  // Standard canvas conversion for other formats
  return await convertWithCanvas(file)
}

/**
 * Convert HEIC to JPEG using canvas/createImageBitmap
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  // Try createImageBitmap first (modern browsers)
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }
      
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to convert to blob')),
          'image/jpeg',
          0.85
        )
      })
      
      const baseName = file.name.replace(/\.[^.]+$/, '')
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
    } catch (err) {
      console.warn('[v0] createImageBitmap failed for HEIC:', err)
    }
  }
  
  // Fallback: try loading as regular image (some browsers support HEIC natively)
  return await convertWithCanvas(file)
}

/**
 * Convert image to JPEG using canvas
 */
async function convertWithCanvas(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    let objectUrl: string | null = null
    
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas')
        
        // Limit max dimensions to avoid memory issues
        const maxDim = 2048
        let width = img.width
        let height = img.height
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Could not get canvas context')
        }
        
        // White background for transparency
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => b ? resolve(b) : reject(new Error('Failed to convert to blob')),
            'image/jpeg',
            0.85
          )
        })
        
        const baseName = file.name.replace(/\.[^.]+$/, '')
        const jpegFile = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
        
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        resolve(jpegFile)
      } catch (err) {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        reject(err)
      }
    }
    
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load image: ${file.name}`))
    }
    
    try {
      objectUrl = URL.createObjectURL(file)
      img.src = objectUrl
    } catch (err) {
      reject(new Error(`Failed to create object URL: ${file.name}`))
    }
  })
}

/**
 * Process multiple images - validate and convert to JPEG
 */
export async function processImagesForUpload(
  files: File[], 
  onProgress?: (current: number, total: number) => void
): Promise<{ converted: File[], failed: string[] }> {
  const converted: File[] = []
  const failed: string[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(i + 1, files.length)
    
    if (!isValidImageFile(file)) {
      failed.push(`${file.name}: formato no soportado`)
      continue
    }
    
    try {
      const jpegFile = await convertToJpeg(file)
      converted.push(jpegFile)
    } catch (err) {
      console.error(`[v0] Failed to convert ${file.name}:`, err)
      failed.push(`${file.name}: error al procesar`)
    }
  }
  
  return { converted, failed }
}
