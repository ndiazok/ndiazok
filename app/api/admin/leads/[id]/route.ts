"use server"

import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  
  // Obtener actividades
  const { data: activities } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false })
  
  return NextResponse.json({ ...lead, activities: activities || [] })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  const body = await request.json()
  
  // Obtener estado anterior para registrar cambio
  const { data: oldLead } = await supabase
    .from("leads")
    .select("estado, temperatura")
    .eq("id", id)
    .single()
  
  const { data: lead, error } = await supabase
    .from("leads")
    .update({
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono,
      interes: body.interes,
      temperatura: body.temperatura,
      estado: body.estado,
      propiedad_id: body.propiedad_id,
      presupuesto_min: body.presupuesto_min,
      presupuesto_max: body.presupuesto_max,
      preferencias: body.preferencias,
      notas: body.notas,
      asignado_a: body.asignado_a,
      proxima_accion: body.proxima_accion,
      fecha_proxima_accion: body.fecha_proxima_accion,
    })
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Registrar cambio de estado si hubo
  if (oldLead && oldLead.estado !== body.estado) {
    await supabase.from("lead_activities").insert({
      lead_id: id,
      tipo: "cambio_estado",
      descripcion: `Estado cambiado de ${oldLead.estado} a ${body.estado}`,
      metadata: { estado_anterior: oldLead.estado, estado_nuevo: body.estado }
    })
  }
  
  return NextResponse.json(lead)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
