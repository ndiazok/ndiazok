import { createClient } from "@supabase/supabase-js"
import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const document_type = (formData.get("document_type") as string) || "otro"
    const notes = (formData.get("notes") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`properties/${id}/documents/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    // Save to database
    const { data, error } = await supabaseAdmin
      .from("property_documents")
      .insert({
        property_id: id,
        name,
        document_type,
        url: blob.url,
        file_type: file.type,
        file_size: file.size,
        notes,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error adding document:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al agregar documento" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(req.url)
    const docId = searchParams.get("docId")

    if (!docId) {
      return NextResponse.json({ error: "docId requerido" }, { status: 400 })
    }

    // Get the document URL first
    const { data: doc } = await supabaseAdmin.from("property_documents").select("url").eq("id", docId).single()

    // Delete from Blob storage if URL exists
    if (doc?.url) {
      try {
        await del(doc.url)
      } catch (blobError) {
        console.error("Error deleting from blob:", blobError)
      }
    }

    // Delete from database
    const { error } = await supabaseAdmin.from("property_documents").delete().eq("id", docId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar documento" },
      { status: 500 },
    )
  }
}
