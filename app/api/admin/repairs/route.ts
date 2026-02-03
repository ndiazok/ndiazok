import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data: reparaciones, error } = await supabase
    .from("reparaciones")
    .select(`
      id,
      titulo,
      descripcion,
      categoria,
      urgencia,
      estado,
      fecha_solicitud,
      presupuesto_estimado,
      costo_final,
      moneda,
      proveedor_nombre,
      propiedad:propiedades(direccion, ciudad),
      solicitante:profiles!reparaciones_solicitante_id_fkey(full_name, email)
    `)
    .order("fecha_solicitud", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching repairs:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten the response
  const formatted = reparaciones?.map((r) => ({
    ...r,
    propiedad: r.propiedad || { direccion: "Sin propiedad", ciudad: "" },
    solicitante: r.solicitante || null,
  }))

  return NextResponse.json(formatted || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("reparaciones")
    .insert({
      propiedad_id: body.propiedad_id,
      solicitante_id: body.solicitante_id || null,
      titulo: body.titulo,
      descripcion: body.descripcion,
      categoria: body.categoria,
      urgencia: body.urgencia || "media",
      estado: "pendiente",
      fecha_solicitud: new Date().toISOString(),
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating repair:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
