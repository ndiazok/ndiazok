import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const propertyAnalysisSchema = z.object({
  tipo: z.enum(["departamento", "casa", "local", "oficina", "cochera", "deposito", "terreno", "otro"]),
  ambientes: z.number().nullable(),
  dormitorios: z.number().nullable(),
  banos: z.number().nullable(),
  metros_cuadrados: z.number().nullable(),
  cochera: z.boolean(),
  estado_general: z.enum(["excelente", "muy_bueno", "bueno", "regular", "a_refaccionar"]).nullable(),
  uso_sugerido: z.enum(["vivienda", "comercial", "mixto"]).nullable(),
  descripcion: z.string(),
  caracteristicas_detectadas: z.array(z.string()),
  ambientes_detectados: z.array(z.string()),
})

const MAX_COLLAGES = 5
const MAX_COLLAGE_SIZE_KB = 4096 // 4MB per collage

// Direct call to OpenAI API without SDK/Gateway
async function callOpenAIVision(apiKey: string, prompt: string, imageContents: { base64: string; mimeType: string }[]) {
  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        ...imageContents.map(img => ({
          type: "image_url",
          image_url: {
            url: `data:${img.mimeType};base64,${img.base64}`,
            detail: "high"
          }
        }))
      ]
    }
  ]

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  
  if (!content) {
    throw new Error("OpenAI returned empty response")
  }

  return JSON.parse(content)
}

export async function POST(request: NextRequest) {
  console.log("[v0] Smart-analyze API called")

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const keys = Array.from(formData.keys())
    console.log("[v0] Form data keys:", keys)

    const collageBlobs: Blob[] = []

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("collage_") && value instanceof File) {
        if (value.size <= MAX_COLLAGE_SIZE_KB * 1024) {
          collageBlobs.push(value)
        } else {
          console.log(`[v0] Skipping collage ${key} - too large: ${(value.size / 1024).toFixed(0)}KB`)
        }
      }
    }

    if (collageBlobs.length === 0) {
      return NextResponse.json(
        { error: "No se recibieron imágenes válidas. Intentá con menos imágenes o imágenes más pequeñas." },
        { status: 400 },
      )
    }

    const collagesToProcess = collageBlobs.slice(0, MAX_COLLAGES)
    const totalImages = Number.parseInt(formData.get("total_images") as string) || 0
    const gridInfo = JSON.parse((formData.get("grid_info") as string) || "[]")

    console.log(`[v0] Processing ${collagesToProcess.length} collage(s) for ${totalImages} images`)

    const imageContents = await Promise.all(
      collagesToProcess.map(async (blob) => {
        const arrayBuffer = await blob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString("base64")
        return { base64, mimeType: "image/jpeg" }
      }),
    )

    console.log("[v0] Sending to OpenAI directly...")

    const prompt = `Analiza estas imágenes de una propiedad inmobiliaria argentina (${totalImages} fotos en ${collagesToProcess.length} collages).

Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "tipo": "departamento" | "casa" | "local" | "oficina" | "cochera" | "deposito" | "terreno" | "otro",
  "ambientes": número o null,
  "dormitorios": número o null,
  "banos": número o null,
  "metros_cuadrados": número o null,
  "cochera": true o false,
  "estado_general": "excelente" | "muy_bueno" | "bueno" | "regular" | "a_refaccionar" o null,
  "uso_sugerido": "vivienda" | "comercial" | "mixto" o null,
  "descripcion": "texto de descripción comercial atractiva (máx 100 palabras)",
  "caracteristicas_detectadas": ["lista", "de", "características"],
  "ambientes_detectados": ["lista", "de", "ambientes"]
}

Si no podés determinar algo, usá null. NO incluyas explicaciones, SOLO el JSON.`

    const result = await callOpenAIVision(apiKey, prompt, imageContents)

    console.log("[v0] AI analysis complete:", result)

    // Validate with zod
    const parsed = propertyAnalysisSchema.safeParse(result)
    
    if (!parsed.success) {
      console.error("[v0] Schema validation failed:", parsed.error)
      // Return raw result anyway, let frontend handle it
      return NextResponse.json({
        extracted: result,
        collage_info: {
          total_images: totalImages,
          collages_generated: collagesToProcess.length,
          grids: gridInfo,
        },
        validation_warning: "Some fields may not match expected format"
      })
    }

    return NextResponse.json({
      extracted: parsed.data,
      collage_info: {
        total_images: totalImages,
        collages_generated: collagesToProcess.length,
        grids: gridInfo,
      },
    })
  } catch (error) {
    console.error("[v0] Error in smart analyze:", error)

    const errorMessage = error instanceof Error ? error.message : "Error desconocido"

    if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      return NextResponse.json({ error: "API key de OpenAI inválida." }, { status: 401 })
    }

    if (errorMessage.includes("429")) {
      return NextResponse.json({ error: "Límite de OpenAI alcanzado. Intentá en unos minutos." }, { status: 429 })
    }

    return NextResponse.json({ error: `Error al analizar: ${errorMessage}` }, { status: 500 })
  }
}
