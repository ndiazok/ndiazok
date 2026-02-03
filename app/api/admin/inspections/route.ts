import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const propiedad_id = searchParams.get("propiedad_id")
  const contrato_id = searchParams.get("contrato_id")
  const tipo = searchParams.get("tipo")
  const estado = searchParams.get("estado")

  let query = supabase
    .from("inspections")
    .select(`
      *,
      propiedad:propiedades(id, direccion, ciudad, tipo),
      contrato:contratos(id, inquilino_id),
      inspector:profiles!inspections_inspector_id_fkey(id, full_name, email),
      items:inspection_items(*)
    `)
    .order("fecha_programada", { ascending: false })

  if (propiedad_id) query = query.eq("propiedad_id", propiedad_id)
  if (contrato_id) query = query.eq("contrato_id", contrato_id)
  if (tipo) query = query.eq("tipo", tipo)
  if (estado) query = query.eq("estado", estado)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const {
    propiedad_id,
    contrato_id,
    tipo,
    fecha_programada,
    hora_programada,
    inspector_id,
    notas_previas,
    checklist_template,
  } = body

  // Crear la inspección
  const { data: inspection, error: inspectionError } = await supabase
    .from("inspections")
    .insert({
      propiedad_id,
      contrato_id: contrato_id || null,
      tipo,
      fecha_programada,
      hora_programada: hora_programada || null,
      inspector_id: inspector_id || null,
      notas_previas: notas_previas || null,
      estado: "programada",
    })
    .select()
    .single()

  if (inspectionError) {
    return NextResponse.json({ error: inspectionError.message }, { status: 500 })
  }

  // Crear items del checklist si se provee un template
  if (checklist_template && Array.isArray(checklist_template)) {
    const items = checklist_template.map((item: any, index: number) => ({
      inspection_id: inspection.id,
      categoria: item.categoria,
      item_nombre: item.nombre,
      descripcion: item.descripcion || null,
      orden: index + 1,
      estado: "pendiente",
    }))

    const { error: itemsError } = await supabase
      .from("inspection_items")
      .insert(items)

    if (itemsError) {
      console.error("Error creating inspection items:", itemsError)
    }
  }

  // Generar tokens de firma
  const tokens = []
  const participantes = ["propietario", "inquilino"]
  
  for (const participante of participantes) {
    const token = crypto.randomBytes(32).toString("hex")
    tokens.push({
      inspection_id: inspection.id,
      token,
      tipo_firmante: participante,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
    })
  }

  const { error: tokensError } = await supabase
    .from("inspection_tokens")
    .insert(tokens)

  if (tokensError) {
    console.error("Error creating inspection tokens:", tokensError)
  }

  return NextResponse.json(inspection, { status: 201 })
}
