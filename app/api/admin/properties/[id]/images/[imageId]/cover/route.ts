import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id: propertyId, imageId } = await params

  try {
    const supabase = await createClient()

    // First, unset all images as primary for this property
    const { error: resetError } = await supabase
      .from("property_images")
      .update({ es_principal: false })
      .eq("property_id", propertyId)

    if (resetError) {
      console.error("Error resetting cover images:", resetError)
      return NextResponse.json({ error: "Error al actualizar imágenes" }, { status: 500 })
    }

    // Then set the selected image as primary
    const { error: updateError } = await supabase
      .from("property_images")
      .update({ es_principal: true })
      .eq("id", imageId)
      .eq("property_id", propertyId)

    if (updateError) {
      console.error("Error setting cover image:", updateError)
      return NextResponse.json({ error: "Error al establecer portada" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in set cover image:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
