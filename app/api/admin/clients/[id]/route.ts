import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", id).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await request.json()

  const updateData: Record<string, any> = {
    full_name: body.full_name,
    company_name: body.company_name,
    phone: body.phone,
    tipo_persona: body.tipo_persona,
  }

  // Persona humana fields
  if (body.tipo_persona === "humana") {
    updateData.dni = body.dni || null
    updateData.cuit = body.cuit || null
    updateData.domicilio_legal = body.domicilio_legal || null
    updateData.localidad = body.localidad || null
    updateData.provincia = body.provincia || null
    updateData.codigo_postal = body.codigo_postal || null
    updateData.nacionalidad = body.nacionalidad || null
    updateData.estado_civil = body.estado_civil || null
    updateData.profesion = body.profesion || null
    updateData.fecha_nacimiento = body.fecha_nacimiento || null
    // Clear juridica fields
    updateData.razon_social = null
    updateData.tipo_societario = null
    updateData.fecha_constitucion = null
    updateData.inscripcion_registral = null
  } else {
    // Persona jurídica fields
    updateData.razon_social = body.razon_social || null
    updateData.cuit = body.cuit || null
    updateData.tipo_societario = body.tipo_societario || null
    updateData.fecha_constitucion = body.fecha_constitucion || null
    updateData.inscripcion_registral = body.inscripcion_registral || null
    updateData.domicilio_legal = body.domicilio_legal || null
    updateData.localidad = body.localidad || null
    updateData.provincia = body.provincia || null
    updateData.codigo_postal = body.codigo_postal || null
    // Clear humana fields
    updateData.dni = null
    updateData.nacionalidad = null
    updateData.estado_civil = null
    updateData.profesion = null
    updateData.fecha_nacimiento = null
  }

  const { data: updatedData, error: updateError } = await supabaseAdmin
    .from("profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(updatedData)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  // Delete the user (will cascade to profile via trigger or FK)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
