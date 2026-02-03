import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      propiedad:propiedades(id, direccion, ciudad, tipo),
      cliente:profiles!appointments_cliente_id_fkey(id, full_name, email, phone),
      asignado:profiles!appointments_asignado_a_fkey(id, full_name, email)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const updateData: Record<string, unknown> = {}
  
  if (body.tipo !== undefined) updateData.tipo = body.tipo
  if (body.titulo !== undefined) updateData.titulo = body.titulo
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion
  if (body.fecha !== undefined) updateData.fecha = body.fecha
  if (body.hora_inicio !== undefined) updateData.hora_inicio = body.hora_inicio
  if (body.hora_fin !== undefined) updateData.hora_fin = body.hora_fin
  if (body.propiedad_id !== undefined) updateData.propiedad_id = body.propiedad_id
  if (body.cliente_id !== undefined) updateData.cliente_id = body.cliente_id
  if (body.asignado_a !== undefined) updateData.asignado_a = body.asignado_a
  if (body.estado !== undefined) updateData.estado = body.estado
  if (body.notas !== undefined) updateData.notas = body.notas
  if (body.resultado !== undefined) updateData.resultado = body.resultado

  const { data, error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
