"use server"

import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  const body = await request.json()
  
  const { data, error } = await supabase
    .from("lead_activities")
    .insert({
      lead_id: id,
      tipo: body.tipo,
      descripcion: body.descripcion,
      metadata: body.metadata || {}
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Actualizar fecha de última actividad en el lead
  await supabase
    .from("leads")
    .update({ ultima_actividad: new Date().toISOString() })
    .eq("id", id)
  
  return NextResponse.json(data)
}
