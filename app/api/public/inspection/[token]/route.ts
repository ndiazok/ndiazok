import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET - Obtener datos de la inspección para firma
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  // Buscar el token
  const { data: tokenData, error: tokenError } = await supabase
    .from("inspection_tokens")
    .select(`
      *,
      inspection:inspections(
        *,
        propiedad:propiedades(id, direccion, ciudad, tipo),
        items:inspection_items(*)
      )
    `)
    .eq("token", token)
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: "Token inválido o no encontrado" }, { status: 404 })
  }

  // Verificar si ya fue usado
  if (tokenData.used) {
    return NextResponse.json({ error: "Este enlace ya fue utilizado" }, { status: 400 })
  }

  // Verificar si expiró
  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: "Este enlace ha expirado" }, { status: 400 })
  }

  // Verificar que la inspección esté en estado adecuado
  if (!["en_progreso", "completada", "pendiente_firmas"].includes(tokenData.inspection.estado)) {
    return NextResponse.json({ error: "La inspección no está lista para firma" }, { status: 400 })
  }

  return NextResponse.json({
    token: tokenData.token,
    tipo_firmante: tokenData.tipo_firmante,
    inspection: tokenData.inspection,
  })
}

// POST - Registrar firma
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()
  const body = await request.json()

  const {
    nombre_firmante,
    dni_firmante,
    firma_base64,
    foto_evidencia_url,
    observaciones,
    ip_address,
    user_agent,
  } = body

  // Validar datos requeridos
  if (!nombre_firmante || !firma_base64) {
    return NextResponse.json({ error: "Nombre y firma son requeridos" }, { status: 400 })
  }

  // Buscar y validar el token
  const { data: tokenData, error: tokenError } = await supabase
    .from("inspection_tokens")
    .select("*, inspection:inspections(*)")
    .eq("token", token)
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: "Token inválido" }, { status: 404 })
  }

  if (tokenData.used) {
    return NextResponse.json({ error: "Este enlace ya fue utilizado" }, { status: 400 })
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: "Este enlace ha expirado" }, { status: 400 })
  }

  // Registrar la firma
  const { data: signature, error: signatureError } = await supabase
    .from("inspection_signatures")
    .insert({
      inspection_id: tokenData.inspection_id,
      tipo_firmante: tokenData.tipo_firmante,
      nombre_firmante,
      dni_firmante: dni_firmante || null,
      firma_base64,
      foto_evidencia_url: foto_evidencia_url || null,
      observaciones: observaciones || null,
      ip_address: ip_address || request.headers.get("x-forwarded-for") || null,
      user_agent: user_agent || request.headers.get("user-agent") || null,
      signed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (signatureError) {
    return NextResponse.json({ error: signatureError.message }, { status: 500 })
  }

  // Marcar token como usado
  await supabase
    .from("inspection_tokens")
    .update({ used: true, used_at: new Date().toISOString() })
    .eq("id", tokenData.id)

  // Verificar si todas las firmas están completas
  const { data: allSignatures } = await supabase
    .from("inspection_signatures")
    .select("tipo_firmante")
    .eq("inspection_id", tokenData.inspection_id)

  const firmantes = allSignatures?.map(s => s.tipo_firmante) || []
  const todasLasFirmas = firmantes.includes("propietario") && firmantes.includes("inquilino")

  // Si todas las firmas están, actualizar estado de la inspección
  if (todasLasFirmas) {
    await supabase
      .from("inspections")
      .update({ estado: "firmada" })
      .eq("id", tokenData.inspection_id)
  }

  return NextResponse.json({
    success: true,
    signature_id: signature.id,
    todas_firmas_completas: todasLasFirmas,
  })
}
