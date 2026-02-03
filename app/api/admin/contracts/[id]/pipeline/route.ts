import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get contract with all related data
  const { data: contract, error } = await supabase
    .from("contratos")
    .select(`
      *,
      propiedad:propiedades(*),
      inquilino:profiles!contratos_inquilino_id_fkey(*),
      participants:contract_participants(
        *,
        person:profiles(*)
      ),
      guarantees:guarantee_links(
        *,
        guarantor:profiles!guarantee_links_guarantor_person_id_fkey(*)
      ),
      checklist:contract_checklist(*),
      status_history:contract_status_history(*, changed_by_user:profiles!contract_status_history_changed_by_fkey(full_name)),
      invitations:contract_invitations(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get documents for all participants
  const participantIds = [
    contract.inquilino_id,
    ...(contract.participants?.map((p: any) => p.person_id) || []),
    ...(contract.guarantees?.map((g: any) => g.guarantor_person_id) || [])
  ].filter(Boolean)

  const { data: documents } = await supabase
    .from("person_documents")
    .select("*")
    .in("person_id", participantIds)

  // Calculate completion percentage
  const totalChecklist = contract.checklist?.length || 0
  const completedChecklist = contract.checklist?.filter((c: any) => c.is_completed).length || 0
  const completionPct = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0

  // Determine semaforo
  let semaforo = "rojo"
  if (["cancelado"].includes(contract.pipeline_status)) semaforo = "gris"
  else if (["firmado", "activo"].includes(contract.pipeline_status)) semaforo = "azul"
  else if (["pre_aprobado", "contrato_generado", "firma_pendiente"].includes(contract.pipeline_status)) semaforo = "verde"
  else if (["docs_inquilino", "docs_garantes", "revision_legal"].includes(contract.pipeline_status)) semaforo = "amarillo"

  return NextResponse.json({
    ...contract,
    documents,
    completionPct,
    semaforo,
    canAdvance: completionPct === 100 || contract.pipeline_status === "borrador"
  })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()
  const { action, ...data } = body

  const { data: { user } } = await supabase.auth.getUser()

  if (action === "advance_status") {
    // Get current contract
    const { data: contract } = await supabase
      .from("contratos")
      .select("pipeline_status")
      .eq("id", id)
      .single()

    const statusOrder = [
      "borrador", "seña_pendiente", "seña_recibida", 
      "docs_inquilino", "docs_garantes", "revision_legal",
      "pre_aprobado", "contrato_generado", "firma_pendiente", 
      "firmado", "activo"
    ]
    
    const currentIndex = statusOrder.indexOf(contract?.pipeline_status || "borrador")
    const nextStatus = statusOrder[currentIndex + 1]

    if (nextStatus) {
      // Record history
      await supabase.from("contract_status_history").insert({
        contract_id: id,
        previous_status: contract?.pipeline_status,
        new_status: nextStatus,
        changed_by: user?.id,
        change_reason: data.reason || "Avance manual"
      })

      // Update contract
      await supabase
        .from("contratos")
        .update({ pipeline_status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      return NextResponse.json({ success: true, newStatus: nextStatus })
    }
  }

  if (action === "set_status") {
    const { data: contract } = await supabase
      .from("contratos")
      .select("pipeline_status")
      .eq("id", id)
      .single()

    await supabase.from("contract_status_history").insert({
      contract_id: id,
      previous_status: contract?.pipeline_status,
      new_status: data.status,
      changed_by: user?.id,
      change_reason: data.reason
    })

    await supabase
      .from("contratos")
      .update({ pipeline_status: data.status, updated_at: new Date().toISOString() })
      .eq("id", id)

    return NextResponse.json({ success: true })
  }

  if (action === "register_seña") {
    await supabase
      .from("contratos")
      .update({
        seña_monto: data.monto,
        seña_fecha: data.fecha,
        seña_comprobante_url: data.comprobante_url,
        pipeline_status: "seña_recibida",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
