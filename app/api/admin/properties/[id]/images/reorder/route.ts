import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { images } = await request.json()

    // Update orden for each image
    for (const img of images) {
      await supabaseAdmin.from("property_images").update({ orden: img.orden }).eq("id", img.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error reordering images:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
