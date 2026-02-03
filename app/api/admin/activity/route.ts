import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    let query = supabaseAdmin.from("activity_log").select("*").order("created_at", { ascending: false }).limit(limit)

    if (entityType) {
      query = query.eq("entity_type", entityType)
    }
    if (entityId) {
      query = query.eq("entity_id", entityId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching activity:", error)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in activity API:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from("activity_log")
      .insert({
        actor_id: body.actorId,
        actor_name: body.actorName,
        entity_type: body.entityType,
        entity_id: body.entityId,
        entity_label: body.entityLabel,
        action: body.action,
        action_label: body.actionLabel,
        description: body.description,
        old_value: body.oldValue,
        new_value: body.newValue,
        related_entity_type: body.relatedEntityType,
        related_entity_id: body.relatedEntityId,
        related_entity_label: body.relatedEntityLabel,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating activity:", error)
    return NextResponse.json({ error: "Error creating activity" }, { status: 500 })
  }
}
