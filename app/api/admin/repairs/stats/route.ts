import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  // Get all repairs with their data
  const { data: repairs } = await supabase
    .from("reparaciones")
    .select("*")
    .order("created_at", { ascending: false })

  if (!repairs) {
    return NextResponse.json({ error: "Error fetching repairs" }, { status: 500 })
  }

  // Calculate overall metrics
  const totalRepairs = repairs.length
  const completedRepairs = repairs.filter(r => r.estado === "completado").length
  const pendingRepairs = repairs.filter(r => r.estado === "pendiente").length
  const inProgressRepairs = repairs.filter(r => r.estado === "en_proceso").length
  const urgentRepairs = repairs.filter(r => r.urgencia === "urgente" && r.estado !== "completado").length

  // Calculate SLA metrics (target: 48h for diagnosis, 7 days for completion)
  const completedWithDates = repairs.filter(r => 
    r.estado === "completado" && r.created_at && r.updated_at
  )
  
  const avgCompletionTime = completedWithDates.length > 0
    ? completedWithDates.reduce((sum, r) => {
        const created = new Date(r.created_at)
        const completed = new Date(r.updated_at)
        return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      }, 0) / completedWithDates.length
    : 0

  // SLA compliance (completed within 7 days)
  const slaCompliant = completedWithDates.filter(r => {
    const created = new Date(r.created_at)
    const completed = new Date(r.updated_at)
    const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    return days <= 7
  }).length
  const slaComplianceRate = completedWithDates.length > 0 
    ? (slaCompliant / completedWithDates.length) * 100 
    : 100

  // By category
  const byCategory: Record<string, { total: number; completed: number; avgTime: number }> = {}
  repairs.forEach(r => {
    if (!byCategory[r.categoria]) {
      byCategory[r.categoria] = { total: 0, completed: 0, avgTime: 0 }
    }
    byCategory[r.categoria].total++
    if (r.estado === "completado") {
      byCategory[r.categoria].completed++
    }
  })

  // By urgency
  const byUrgency = {
    baja: repairs.filter(r => r.urgencia === "baja").length,
    media: repairs.filter(r => r.urgencia === "media").length,
    alta: repairs.filter(r => r.urgencia === "alta").length,
    urgente: repairs.filter(r => r.urgencia === "urgente").length,
  }

  // Professional/Provider ranking
  const providerStats: Record<string, { 
    name: string
    total: number
    completed: number
    avgCost: number
    totalCost: number
  }> = {}

  repairs.forEach(r => {
    if (r.proveedor) {
      if (!providerStats[r.proveedor]) {
        providerStats[r.proveedor] = {
          name: r.proveedor,
          total: 0,
          completed: 0,
          avgCost: 0,
          totalCost: 0,
        }
      }
      providerStats[r.proveedor].total++
      if (r.estado === "completado") {
        providerStats[r.proveedor].completed++
        providerStats[r.proveedor].totalCost += r.costo_final || 0
      }
    }
  })

  const providerRanking = Object.values(providerStats)
    .map(p => ({
      ...p,
      avgCost: p.completed > 0 ? p.totalCost / p.completed : 0,
      completionRate: p.total > 0 ? (p.completed / p.total) * 100 : 0,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 10)

  // Cost analysis
  const totalCost = repairs.reduce((sum, r) => sum + (r.costo_final || 0), 0)
  const totalBudget = repairs.reduce((sum, r) => sum + (r.presupuesto || 0), 0)
  const costVariance = totalBudget > 0 ? ((totalCost - totalBudget) / totalBudget) * 100 : 0

  // By payment responsibility
  const byResponsibility = {
    propietario: repairs.filter(r => r.responsable_pago === "propietario").length,
    inquilino: repairs.filter(r => r.responsable_pago === "inquilino").length,
    inmobiliaria: repairs.filter(r => r.responsable_pago === "inmobiliaria").length,
  }

  // Monthly trend (last 6 months)
  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    
    const monthRepairs = repairs.filter(r => {
      const created = new Date(r.created_at)
      return created >= monthStart && created <= monthEnd
    })

    monthlyTrend.push({
      month: date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
      total: monthRepairs.length,
      completed: monthRepairs.filter(r => r.estado === "completado").length,
      cost: monthRepairs.reduce((sum, r) => sum + (r.costo_final || 0), 0),
    })
  }

  return NextResponse.json({
    overview: {
      totalRepairs,
      completedRepairs,
      pendingRepairs,
      inProgressRepairs,
      urgentRepairs,
      completionRate: totalRepairs > 0 ? (completedRepairs / totalRepairs) * 100 : 0,
    },
    sla: {
      avgCompletionDays: avgCompletionTime,
      complianceRate: slaComplianceRate,
      target: 7,
    },
    byCategory: Object.entries(byCategory).map(([name, data]) => ({ name, ...data })),
    byUrgency,
    byResponsibility,
    providerRanking,
    costs: {
      total: totalCost,
      budget: totalBudget,
      variance: costVariance,
    },
    monthlyTrend,
  })
}
