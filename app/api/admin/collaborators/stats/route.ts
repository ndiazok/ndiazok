import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  // Get all admin/staff users
  const { data: collaborators } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .in("role", ["admin", "agente", "administrativo"])

  if (!collaborators) {
    return NextResponse.json({ error: "Error fetching collaborators" }, { status: 500 })
  }

  const collaboratorStats = await Promise.all(
    collaborators.map(async (collab) => {
      // Properties created by this user
      const { count: propertiesCreated } = await supabase
        .from("propiedades")
        .select("*", { count: "exact", head: true })
        .eq("created_by", collab.id)

      // Contracts where user is involved (as creator or manager)
      const { data: contracts } = await supabase
        .from("contratos")
        .select("id, estado, monto_alquiler")
        .eq("created_by", collab.id)

      const contractsCreated = contracts?.length || 0
      const contractsActive = contracts?.filter(c => c.estado === "activo").length || 0
      const totalContractValue = contracts?.reduce((sum, c) => sum + (c.monto_alquiler || 0), 0) || 0

      // Leads assigned to this user
      const { data: leads } = await supabase
        .from("leads")
        .select("id, estado, temperatura")
        .eq("asignado_a", collab.id)

      const leadsAssigned = leads?.length || 0
      const leadsWon = leads?.filter(l => l.estado === "ganado").length || 0
      const leadsLost = leads?.filter(l => l.estado === "perdido").length || 0
      const leadsActive = leads?.filter(l => !["ganado", "perdido"].includes(l.estado)).length || 0
      const conversionRate = leadsAssigned > 0 ? (leadsWon / leadsAssigned) * 100 : 0

      // Appointments handled
      const { count: appointmentsCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("asignado_a", collab.id)

      const { count: appointmentsCompleted } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("asignado_a", collab.id)
        .eq("estado", "completado")

      // Repairs managed
      const { count: repairsCount } = await supabase
        .from("reparaciones")
        .select("*", { count: "exact", head: true })
        .eq("created_by", collab.id)

      // Activity log entries (if tracking)
      const { count: activityCount } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", collab.id)

      return {
        ...collab,
        metrics: {
          propertiesCreated: propertiesCreated || 0,
          contractsCreated,
          contractsActive,
          totalContractValue,
          leadsAssigned,
          leadsWon,
          leadsLost,
          leadsActive,
          conversionRate,
          appointments: appointmentsCount || 0,
          appointmentsCompleted: appointmentsCompleted || 0,
          repairs: repairsCount || 0,
          activityCount: activityCount || 0,
        },
        score: calculateScore({
          propertiesCreated: propertiesCreated || 0,
          contractsCreated,
          leadsWon,
          conversionRate,
          appointmentsCompleted: appointmentsCompleted || 0,
        }),
      }
    })
  )

  // Sort by score
  collaboratorStats.sort((a, b) => b.score - a.score)

  // Calculate team totals
  const teamTotals = {
    propertiesCreated: collaboratorStats.reduce((sum, c) => sum + c.metrics.propertiesCreated, 0),
    contractsCreated: collaboratorStats.reduce((sum, c) => sum + c.metrics.contractsCreated, 0),
    contractsActive: collaboratorStats.reduce((sum, c) => sum + c.metrics.contractsActive, 0),
    totalContractValue: collaboratorStats.reduce((sum, c) => sum + c.metrics.totalContractValue, 0),
    leadsAssigned: collaboratorStats.reduce((sum, c) => sum + c.metrics.leadsAssigned, 0),
    leadsWon: collaboratorStats.reduce((sum, c) => sum + c.metrics.leadsWon, 0),
    appointments: collaboratorStats.reduce((sum, c) => sum + c.metrics.appointments, 0),
    avgConversionRate: collaboratorStats.length > 0
      ? collaboratorStats.reduce((sum, c) => sum + c.metrics.conversionRate, 0) / collaboratorStats.length
      : 0,
  }

  return NextResponse.json({
    collaborators: collaboratorStats,
    teamTotals,
  })
}

function calculateScore(metrics: {
  propertiesCreated: number
  contractsCreated: number
  leadsWon: number
  conversionRate: number
  appointmentsCompleted: number
}) {
  // Weighted score calculation
  return (
    metrics.propertiesCreated * 5 +
    metrics.contractsCreated * 20 +
    metrics.leadsWon * 15 +
    metrics.conversionRate * 2 +
    metrics.appointmentsCompleted * 3
  )
}
