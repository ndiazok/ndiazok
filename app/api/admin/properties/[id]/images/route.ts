import { createClient } from "@supabase/supabase-js"
import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get("file") as File
    const titulo = (formData.get("titulo") as string) || ""
    const descripcion = (formData.get("descripcion") as string) || ""
    const es_principal = formData.get("es_principal") === "true"

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`properties/${id}/images/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    // Get current max orden
    const { data: existing } = await supabaseAdmin
      .from("property_images")
      .select("orden")
      .eq("property_id", id)
      .order("orden", { ascending: false })
      .limit(1)

    const newOrden = (existing?.[0]?.orden || 0) + 1

    // If setting as principal, unset others
    if (es_principal) {
      await supabaseAdmin.from("property_images").update({ es_principal: false }).eq("property_id", id)
    }

    // Save to database
    const { data, error } = await supabaseAdmin
      .from("property_images")
      .insert({
        property_id: id,
        url: blob.url,
        titulo,
        descripcion,
        es_principal: es_principal || false,
        orden: newOrden,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error adding image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al agregar imagen" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(req.url)
    const imageId = searchParams.get("imageId")

    if (!imageId) {
      return NextResponse.json({ error: "imageId requerido" }, { status: 400 })
    }

    // Get the image URL first
    const { data: image } = await supabaseAdmin.from("property_images").select("url").eq("id", imageId).single()

    // Delete from Blob storage if URL exists
    if (image?.url) {
      try {
        await del(image.url)
      } catch (blobError) {
        console.error("Error deleting from blob:", blobError)
      }
    }

    // Delete from database
    const { error } = await supabaseAdmin.from("property_images").delete().eq("id", imageId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar imagen" },
      { status: 500 },
    )
  }
}
