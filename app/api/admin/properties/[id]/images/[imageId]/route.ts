import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  try {
    const { id, imageId } = await params
    const body = await request.json()

    // If setting as cover, unset other covers first
    if (body.is_cover) {
      await supabaseAdmin.from("property_images").update({ is_cover: false }).eq("property_id", id)
    }

    const { error } = await supabaseAdmin.from("property_images").update(body).eq("id", imageId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating image:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
