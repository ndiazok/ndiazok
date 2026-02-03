import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    // Get monthly income data (last 6 months)
    const { data: movimientos } = await supabaseAdmin
      .from("movimientos")
      .select("monto, tipo, created_at, estado")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at", { ascending: true })

    // Group by month
    const monthlyData: Record<string, { ingresos: number; egresos: number; cobrado: number }> = {}

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyData[key] = { ingresos: 0, egresos: 0, cobrado: 0 }
    }

    movimientos?.forEach((mov) => {
      const date = new Date(mov.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (monthlyData[key]) {
        const monto = Number(mov.monto)
        if (mov.tipo === "debito") {
          monthlyData[key].ingresos += monto
          if (mov.estado === "pagado") {
            monthlyData[key].cobrado += monto
          }
        } else {
          monthlyData[key].egresos += monto
        }
      }
    })

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const chartData = Object.entries(monthlyData).map(([key, data]) => {
      const [year, month] = key.split("-")
      return {
        mes: monthNames[Number.parseInt(month) - 1],
        ingresos: data.ingresos,
        cobrado: data.cobrado,
        egresos: data.egresos,
      }
    })

    // Get property stats
    const { data: propiedades } = await supabaseAdmin
      .from("propiedades")
      .select("estado, en_alquiler, en_venta, en_administracion")

    const propertyStats = {
      total: propiedades?.length || 0,
      enAlquiler: propiedades?.filter((p) => p.en_alquiler).length || 0,
      enVenta: propiedades?.filter((p) => p.en_venta).length || 0,
      enAdministracion: propiedades?.filter((p) => p.en_administracion).length || 0,
      ocupadas: propiedades?.filter((p) => p.estado === "ocupada").length || 0,
      disponibles: propiedades?.filter((p) => p.estado === "disponible").length || 0,
    }

    // Get contract stats by status
    const { data: contratos } = await supabaseAdmin.from("contratos").select("estado, fecha_fin")

    const contractStats = {
      total: contratos?.length || 0,
      borradores: contratos?.filter((c) => c.estado === "borrador").length || 0,
      activos: contratos?.filter((c) => c.estado === "activo").length || 0,
      finalizados: contratos?.filter((c) => c.estado === "finalizado").length || 0,
      porVencer:
        contratos?.filter((c) => {
          if (c.estado !== "activo") return false
          const diasRestantes = Math.ceil((new Date(c.fecha_fin).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          return diasRestantes > 0 && diasRestantes <= 60
        }).length || 0,
    }

    // Get morosidad stats
    const { data: recibosPendientes } = await supabaseAdmin
      .from("movimientos")
      .select("monto, estado")
      .eq("tipo", "debito")
      .in("estado", ["pendiente", "vencido"])

    const morosidadStats = {
      totalPendiente: recibosPendientes?.reduce((acc, r) => acc + Number(r.monto), 0) || 0,
      cantidadPendiente: recibosPendientes?.length || 0,
      vencidos: recibosPendientes?.filter((r) => r.estado === "vencido").length || 0,
      montoVencido:
        recibosPendientes?.filter((r) => r.estado === "vencido").reduce((acc, r) => acc + Number(r.monto), 0) || 0,
    }

    return NextResponse.json({
      chartData,
      propertyStats,
      contractStats,
      morosidadStats,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching finance stats:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
