import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const itemId = formData.get("item_id") as string
    const tipo = formData.get("tipo") as string || "evidencia"

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 })
    }

    // Subir a Vercel Blob
    const filename = `inspections/${id}/${itemId || "general"}/${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    })

    // Si hay un item_id, agregar la foto al array de fotos del item
    if (itemId) {
      const supabase = await createClient()
      
      // Obtener fotos actuales del item
      const { data: item } = await supabase
        .from("inspection_items")
        .select("fotos")
        .eq("id", itemId)
        .single()

      const currentPhotos = item?.fotos || []
      const updatedPhotos = [...currentPhotos, {
        url: blob.url,
        tipo,
        uploaded_at: new Date().toISOString(),
      }]

      // Actualizar el item con la nueva foto
      await supabase
        .from("inspection_items")
        .update({ fotos: updatedPhotos })
        .eq("id", itemId)
    }

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error uploading photo:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
