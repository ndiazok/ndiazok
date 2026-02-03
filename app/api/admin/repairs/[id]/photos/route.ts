import { createClient } from "@/lib/supabase/server"
import { put, del } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const formData = await request.formData()
  const file = formData.get("file") as File
  const type = formData.get("type") as string // "antes" | "despues"

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!["antes", "despues"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  // Upload to Vercel Blob
  const blob = await put(`repairs/${id}/${type}/${file.name}`, file, {
    access: "public",
  })

  // Get current repair
  const { data: repair } = await supabase
    .from("reparaciones")
    .select("fotos_antes, fotos_despues")
    .eq("id", id)
    .single()

  if (!repair) {
    return NextResponse.json({ error: "Repair not found" }, { status: 404 })
  }

  // Update the appropriate array
  const fieldName = type === "antes" ? "fotos_antes" : "fotos_despues"
  const currentPhotos = repair[fieldName] || []
  const updatedPhotos = [...currentPhotos, blob.url]

  const { error } = await supabase
    .from("reparaciones")
    .update({ [fieldName]: updatedPhotos })
    .eq("id", id)

  if (error) {
    console.error("[v0] Error updating repair photos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ url: blob.url })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")
  const type = searchParams.get("type") as string

  if (!url || !type) {
    return NextResponse.json({ error: "Missing url or type" }, { status: 400 })
  }

  // Delete from Blob storage
  try {
    await del(url)
  } catch (e) {
    console.error("[v0] Error deleting blob:", e)
  }

  // Get current repair
  const { data: repair } = await supabase
    .from("reparaciones")
    .select("fotos_antes, fotos_despues")
    .eq("id", id)
    .single()

  if (!repair) {
    return NextResponse.json({ error: "Repair not found" }, { status: 404 })
  }

  // Remove from the appropriate array
  const fieldName = type === "antes" ? "fotos_antes" : "fotos_despues"
  const currentPhotos = repair[fieldName] || []
  const updatedPhotos = currentPhotos.filter((p: string) => p !== url)

  const { error } = await supabase
    .from("reparaciones")
    .update({ [fieldName]: updatedPhotos })
    .eq("id", id)

  if (error) {
    console.error("[v0] Error updating repair photos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
