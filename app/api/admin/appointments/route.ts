import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const fecha = searchParams.get("fecha")
  const semana = searchParams.get("semana")
  const tipo = searchParams.get("tipo")
  const estado = searchParams.get("estado")
  const asignado = searchParams.get("asignado_a")

  let query = supabase
    .from("appointments")
    .select(`
      *,
      propiedad:propiedades(id, direccion, ciudad),
      cliente:profiles!appointments_cliente_id_fkey(id, full_name, email, phone),
      asignado:profiles!appointments_asignado_a_fkey(id, full_name)
    `)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true })

  if (fecha) {
    query = query.eq("fecha", fecha)
  }
  
  if (semana) {
    const startDate = new Date(semana)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)
    query = query.gte("fecha", startDate.toISOString().split("T")[0])
      .lt("fecha", endDate.toISOString().split("T")[0])
  }

  if (tipo) {
    query = query.eq("tipo", tipo)
  }

  if (estado) {
    query = query.eq("estado", estado)
  }

  if (asignado) {
    query = query.eq("asignado_a", asignado)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      tipo: body.tipo,
      titulo: body.titulo,
      descripcion: body.descripcion,
      fecha: body.fecha,
      hora_inicio: body.hora_inicio,
      hora_fin: body.hora_fin,
      propiedad_id: body.propiedad_id || null,
      cliente_id: body.cliente_id || null,
      asignado_a: body.asignado_a || null,
      estado: "programado",
      recordatorio_enviado: false,
      notas: body.notas,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
