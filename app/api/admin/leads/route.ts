"use server"

import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  
  const estado = searchParams.get("estado")
  const temperatura = searchParams.get("temperatura")
  const interes = searchParams.get("interes")
  const asignado = searchParams.get("asignado_a")
  
  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (estado) query = query.eq("estado", estado)
  if (temperatura) query = query.eq("temperatura", temperatura)
  if (interes) query = query.eq("interes", interes)
  if (asignado) query = query.eq("asignado_a", asignado)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono,
      interes: body.interes || "alquiler",
      temperatura: body.temperatura || "tibio",
      estado: "nuevo",
      fuente: body.fuente || "web",
      propiedad_id: body.propiedad_id || null,
      presupuesto_min: body.presupuesto_min || null,
      presupuesto_max: body.presupuesto_max || null,
      preferencias: body.preferencias || {},
      notas: body.notas || null,
      asignado_a: body.asignado_a || null,
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Registrar actividad inicial
  await supabase.from("lead_activities").insert({
    lead_id: lead.id,
    tipo: "creacion",
    descripcion: "Lead creado",
    metadata: { fuente: body.fuente || "web" }
  })
  
  return NextResponse.json(lead)
}
