import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("inspections")
    .select(`
      *,
      propiedad:propiedades(id, direccion, ciudad, tipo, propietario_id),
      contrato:contratos(id, inquilino_id, fecha_inicio, fecha_fin),
      inspector:profiles!inspections_inspector_id_fkey(id, full_name, email, phone),
      items:inspection_items(*),
      tokens:inspection_tokens(id, token, tipo_firmante, used, used_at, expires_at),
      signatures:inspection_signatures(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
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

  const updateData: any = {}

  if (body.fecha_programada !== undefined) updateData.fecha_programada = body.fecha_programada
  if (body.hora_programada !== undefined) updateData.hora_programada = body.hora_programada
  if (body.inspector_id !== undefined) updateData.inspector_id = body.inspector_id
  if (body.estado !== undefined) updateData.estado = body.estado
  if (body.notas_previas !== undefined) updateData.notas_previas = body.notas_previas
  if (body.notas_finales !== undefined) updateData.notas_finales = body.notas_finales
  if (body.observaciones_generales !== undefined) updateData.observaciones_generales = body.observaciones_generales

  // Si se marca como completada, registrar fecha
  if (body.estado === "completada" && !body.fecha_realizacion) {
    updateData.fecha_realizacion = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("inspections")
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

  // Solo permitir eliminar inspecciones programadas
  const { data: inspection } = await supabase
    .from("inspections")
    .select("estado")
    .eq("id", id)
    .single()

  if (inspection?.estado !== "programada") {
    return NextResponse.json(
      { error: "Solo se pueden eliminar inspecciones programadas" },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("inspections")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
