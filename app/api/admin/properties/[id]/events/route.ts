import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("property_events")
    .select("*")
    .eq("property_id", id)
    .order("event_date", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { data: userData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("property_events")
    .insert({
      property_id: id,
      event_type: body.event_type,
      event_date: body.event_date || new Date().toISOString(),
      lead_id: body.lead_id || null,
      notes: body.notes || null,
      source: body.source || null,
      created_by: userData.user?.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
