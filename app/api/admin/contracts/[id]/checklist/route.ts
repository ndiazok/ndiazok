import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Default checklist items by participant type
const DEFAULT_CHECKLIST = {
  inquilino: [
    { requirement: "DNI frente", requirement_type: "documento" },
    { requirement: "DNI dorso", requirement_type: "documento" },
    { requirement: "Recibo de sueldo 1", requirement_type: "documento" },
    { requirement: "Recibo de sueldo 2", requirement_type: "documento" },
    { requirement: "Recibo de sueldo 3", requirement_type: "documento" },
    { requirement: "Constancia de CUIT", requirement_type: "documento" },
    { requirement: "Datos personales validados", requirement_type: "validacion" },
    { requirement: "Firma del contrato", requirement_type: "firma" },
  ],
  garante: [
    { requirement: "DNI frente", requirement_type: "documento" },
    { requirement: "DNI dorso", requirement_type: "documento" },
    { requirement: "Recibo de sueldo 1", requirement_type: "documento" },
    { requirement: "Recibo de sueldo 2", requirement_type: "documento" },
    { requirement: "Recibo de sueldo 3", requirement_type: "documento" },
    { requirement: "Escritura de propiedad en garantía", requirement_type: "documento" },
    { requirement: "Libre deuda de la propiedad", requirement_type: "documento" },
    { requirement: "Datos personales validados", requirement_type: "validacion" },
    { requirement: "Firma del contrato", requirement_type: "firma" },
  ],
  propietario: [
    { requirement: "DNI frente", requirement_type: "documento" },
    { requirement: "DNI dorso", requirement_type: "documento" },
    { requirement: "Escritura de la propiedad", requirement_type: "documento" },
    { requirement: "Firma del contrato", requirement_type: "firma" },
  ],
  inmobiliaria: [
    { requirement: "Verificación de documentación", requirement_type: "validacion" },
    { requirement: "Generación de contrato", requirement_type: "otro" },
    { requirement: "Firma del contrato", requirement_type: "firma" },
  ]
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contract_checklist")
    .select(`
      *,
      participant:profiles(full_name, email),
      document:person_documents(*)
    `)
    .eq("contract_id", id)
    .order("participant_type")
    .order("created_at")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by participant
  const grouped = data.reduce((acc: any, item: any) => {
    const key = `${item.participant_type}_${item.participant_id || "general"}`
    if (!acc[key]) {
      acc[key] = {
        participant_type: item.participant_type,
        participant_id: item.participant_id,
        participant_name: item.participant?.full_name || item.participant_type,
        items: []
      }
    }
    acc[key].items.push(item)
    return acc
  }, {})

  return NextResponse.json(Object.values(grouped))
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()
  const { action, ...data } = body

  if (action === "generate_default") {
    // Get contract participants
    const { data: contract } = await supabase
      .from("contratos")
      .select(`
        inquilino_id,
        participants:contract_participants(person_id, party_role),
        guarantees:guarantee_links(guarantor_person_id)
      `)
      .eq("id", id)
      .single()

    const checklistItems: any[] = []

    // Add inquilino items
    if (contract?.inquilino_id) {
      DEFAULT_CHECKLIST.inquilino.forEach(item => {
        checklistItems.push({
          contract_id: id,
          participant_type: "inquilino",
          participant_id: contract.inquilino_id,
          ...item,
          is_required: true
        })
      })
    }

    // Add garante items
    contract?.guarantees?.forEach((g: any) => {
      DEFAULT_CHECKLIST.garante.forEach(item => {
        checklistItems.push({
          contract_id: id,
          participant_type: "garante",
          participant_id: g.guarantor_person_id,
          ...item,
          is_required: true
        })
      })
    })

    // Add inmobiliaria items
    DEFAULT_CHECKLIST.inmobiliaria.forEach(item => {
      checklistItems.push({
        contract_id: id,
        participant_type: "inmobiliaria",
        participant_id: null,
        ...item,
        is_required: true
      })
    })

    // Delete existing and insert new
    await supabase.from("contract_checklist").delete().eq("contract_id", id)
    
    const { error } = await supabase.from("contract_checklist").insert(checklistItems)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: checklistItems.length })
  }

  if (action === "toggle_item") {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("contract_checklist")
      .update({
        is_completed: data.is_completed,
        completed_at: data.is_completed ? new Date().toISOString() : null,
        completed_by: data.is_completed ? user?.id : null,
        document_id: data.document_id || null
      })
      .eq("id", data.item_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === "add_item") {
    const { error } = await supabase
      .from("contract_checklist")
      .insert({
        contract_id: id,
        participant_type: data.participant_type,
        participant_id: data.participant_id,
        requirement: data.requirement,
        requirement_type: data.requirement_type || "otro",
        is_required: data.is_required ?? true
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
