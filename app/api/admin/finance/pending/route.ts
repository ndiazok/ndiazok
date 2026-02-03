import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET: Obtener resumen de pendientes (cobranzas y liquidaciones)
export async function GET() {
  // Recibos pendientes/vencidos
  const { data: recibosPendientes } = await supabaseAdmin
    .from("movimientos")
    .select(`
      *,
      contrato:contratos(
        id,
        propiedad:propiedades(id, direccion, ciudad)
      ),
      cuenta:cuentas_corrientes(
        titular:profiles(id, full_name, email, phone)
      )
    `)
    .eq("tipo", "debito")
    .eq("concepto", "alquiler")
    .in("estado", ["pendiente", "vencido", "parcial"])
    .order("periodo_anio", { ascending: false })
    .order("periodo_mes", { ascending: false })

  // Liquidaciones pendientes de pago
  const { data: liquidacionesPendientes } = await supabaseAdmin
    .from("liquidaciones")
    .select(`
      *,
      propietario:profiles!propietario_id(id, full_name, email, phone),
      propiedad:propiedades(id, direccion, ciudad)
    `)
    .in("estado", ["borrador", "confirmada"])
    .order("created_at", { ascending: false })

  // Calcular totales
  const totalPorCobrar = (recibosPendientes || []).reduce((sum, r) => sum + r.monto, 0)
  const totalPorPagar = (liquidacionesPendientes || []).reduce((sum, l) => sum + (l.saldo_neto || 0), 0)

  // Agrupar recibos vencidos por antigüedad
  const hoy = new Date()
  const recibosVencidos = (recibosPendientes || []).filter((r) => r.estado === "vencido")
  const vencidosPorAntigüedad = {
    hasta30dias: recibosVencidos.filter((r) => {
      const fecha = new Date(r.periodo_anio, r.periodo_mes - 1, 10)
      const dias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24))
      return dias <= 30
    }).length,
    de31a60dias: recibosVencidos.filter((r) => {
      const fecha = new Date(r.periodo_anio, r.periodo_mes - 1, 10)
      const dias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24))
      return dias > 30 && dias <= 60
    }).length,
    masde60dias: recibosVencidos.filter((r) => {
      const fecha = new Date(r.periodo_anio, r.periodo_mes - 1, 10)
      const dias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24))
      return dias > 60
    }).length,
  }

  return NextResponse.json({
    recibos: {
      pendientes: (recibosPendientes || []).filter((r) => r.estado === "pendiente").length,
      vencidos: recibosVencidos.length,
      parciales: (recibosPendientes || []).filter((r) => r.estado === "parcial").length,
      totalPorCobrar,
      vencidosPorAntigüedad,
      detalle: recibosPendientes,
    },
    liquidaciones: {
      borradores: (liquidacionesPendientes || []).filter((l) => l.estado === "borrador").length,
      confirmadas: (liquidacionesPendientes || []).filter((l) => l.estado === "confirmada").length,
      totalPorPagar,
      detalle: liquidacionesPendientes,
    },
  })
}
