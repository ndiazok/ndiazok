/**
 * Client-side collage generation using Canvas API
 * Optimized for AI analysis with smaller file sizes
 */

interface CollageOptions {
  images: File[]
  maxPerCollage?: number
  cellSize?: number
  gap?: number
  quality?: number
}

interface CollageResult {
  collages: Blob[]
  gridInfo: { rows: number; cols: number; count: number }[]
}

/**
 * Calculate optimal grid for a number of images
 */
function calculateGrid(count: number): { rows: number; cols: number } {
  if (count <= 2) return { rows: 1, cols: 2 }
  if (count <= 4) return { rows: 2, cols: 2 }
  if (count <= 6) return { rows: 2, cols: 3 }
  return { rows: 3, cols: 3 }
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // Validate file first
    if (!file || !(file instanceof File)) {
      reject(new Error("Invalid file object"))
      return
    }
    
    if (!file.type.startsWith("image/")) {
      reject(new Error(`Invalid file type: ${file.type}`))
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    
    let objectUrl: string | null = null
    
    img.onload = () => {
      resolve(img)
    }
    
    img.onerror = (e) => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      reject(new Error(`Failed to load image: ${file.name}`))
    }
    
    try {
      objectUrl = URL.createObjectURL(file)
      img.src = objectUrl
    } catch (err) {
      reject(new Error(`Failed to create object URL for: ${file.name}`))
    }
  })
}

/**
 * Draw an image centered and cropped to fill a cell
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imgRatio = img.width / img.height
  const cellRatio = width / height

  let srcX = 0,
    srcY = 0,
    srcW = img.width,
    srcH = img.height

  if (imgRatio > cellRatio) {
    srcW = img.height * cellRatio
    srcX = (img.width - srcW) / 2
  } else {
    srcH = img.width / cellRatio
    srcY = (img.height - srcH) / 2
  }

  ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, width, height)
}

/**
 * Create a single collage from images
 */
async function createSingleCollage(
  images: File[],
  cellSize: number,
  gap: number,
  quality: number,
): Promise<{ blob: Blob; grid: { rows: number; cols: number; count: number } }> {
  const grid = calculateGrid(images.length)
  const { rows, cols } = grid

  const width = cols * cellSize + (cols - 1) * gap
  const height = rows * cellSize + (rows - 1) * gap

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  const loadedImages = await Promise.all(images.map(loadImage))

  for (let i = 0; i < loadedImages.length; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    const x = col * (cellSize + gap)
    const y = row * (cellSize + gap)

    drawImageCover(ctx, loadedImages[i], x, y, cellSize, cellSize)
  }

  loadedImages.forEach((img) => URL.revokeObjectURL(img.src))

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))), "image/jpeg", quality)
  })

  return { blob, grid: { ...grid, count: images.length } }
}

/**
 * Generate collages from an array of image files
 * Groups images into collages of max 9 images each
 * Uses smaller cell sizes and lower quality for AI analysis
 */
export async function generateCollagesClient(options: CollageOptions): Promise<CollageResult> {
  const { images, maxPerCollage = 9, cellSize = 200, gap = 2, quality = 0.6 } = options

  if (images.length === 0) {
    return { collages: [], gridInfo: [] }
  }

  // Filter out invalid files
  const validImages = images.filter(file => 
    file && file instanceof File && file.type.startsWith("image/") && file.size > 0
  )

  if (validImages.length === 0) {
    throw new Error("No hay imágenes válidas para procesar")
  }

  const groups: File[][] = []
  for (let i = 0; i < validImages.length; i += maxPerCollage) {
    groups.push(validImages.slice(i, i + maxPerCollage))
  }

  const results: { blob: Blob; grid: { rows: number; cols: number; count: number } }[] = []
  
  for (let i = 0; i < groups.length; i++) {
    try {
      const result = await createSingleCollage(groups[i], cellSize, gap, quality)
      results.push(result)
    } catch (err) {
      console.error(`[v0] Error creating collage ${i + 1}:`, err)
      // Continue with other groups if one fails
    }
  }

  if (results.length === 0) {
    throw new Error("No se pudo crear ningún collage de las imágenes")
  }

  return {
    collages: results.map((r) => r.blob),
    gridInfo: results.map((r) => r.grid),
  }
}
