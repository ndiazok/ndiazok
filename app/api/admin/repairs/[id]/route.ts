import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: reparacion, error } = await supabase
    .from("reparaciones")
    .select(`
      *,
      propiedad:propiedades(id, direccion, ciudad),
      solicitante:profiles!reparaciones_solicitante_id_fkey(id, full_name, email, phone)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("[v0] Error fetching repair:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ...reparacion,
    propiedad: reparacion.propiedad || { id: null, direccion: "Sin propiedad", ciudad: "" },
    solicitante: reparacion.solicitante || null,
    fotos_antes: reparacion.fotos_antes || [],
    fotos_despues: reparacion.fotos_despues || [],
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  // Only include fields that are provided
  if (body.estado !== undefined) {
    updateData.estado = body.estado
    
    // Auto-set dates based on status changes
    if (body.estado === "aprobada" && !body.fecha_aprobacion) {
      updateData.fecha_aprobacion = new Date().toISOString()
      updateData.aprobado_por = user.id
    }
    if (body.estado === "en_proceso" && !body.fecha_inicio) {
      updateData.fecha_inicio = new Date().toISOString()
    }
    if (body.estado === "completada" && !body.fecha_fin) {
      updateData.fecha_fin = new Date().toISOString()
    }
  }

  if (body.proveedor_nombre !== undefined) updateData.proveedor_nombre = body.proveedor_nombre
  if (body.proveedor_contacto !== undefined) updateData.proveedor_contacto = body.proveedor_contacto
  if (body.presupuesto_estimado !== undefined) updateData.presupuesto_estimado = body.presupuesto_estimado
  if (body.costo_final !== undefined) updateData.costo_final = body.costo_final
  if (body.moneda !== undefined) updateData.moneda = body.moneda
  if (body.responsable_pago !== undefined) updateData.responsable_pago = body.responsable_pago
  if (body.porcentaje_inquilino !== undefined) updateData.porcentaje_inquilino = body.porcentaje_inquilino
  if (body.notas !== undefined) updateData.notas = body.notas
  if (body.factura_url !== undefined) updateData.factura_url = body.factura_url

  const { data, error } = await supabase
    .from("reparaciones")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating repair:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from("reparaciones")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("[v0] Error deleting repair:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
