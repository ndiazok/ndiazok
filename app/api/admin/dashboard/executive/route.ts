import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  
  // Fecha hace 7 días para leads olvidados
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  // Fecha hace 30 días para propietarios sin contacto
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  try {
    // 1. Decisiones urgentes del día
    const [
      { data: contratosVencidos },
      { data: recibosVencidos },
      { data: leadsCalientes },
      { data: reparacionesUrgentes },
      { data: liquidacionesPendientes },
    ] = await Promise.all([
      // Contratos vencidos o por vencer en 15 días
      supabase
        .from("vista_contratos_vigencia")
        .select("id, direccion, ciudad, fecha_fin, dias_hasta_vencimiento, nivel_alerta")
        .eq("estado", "activo")
        .or(`vencido.eq.true,dias_hasta_vencimiento.lte.15`)
        .order("dias_hasta_vencimiento", { ascending: true })
        .limit(5),
      
      // Recibos vencidos sin pagar
      supabase
        .from("movimientos")
        .select(`
          id, monto, periodo_mes, periodo_anio, created_at,
          contrato:contrato_id (
            propiedad:propiedad_id (direccion, ciudad)
          )
        `)
        .eq("tipo", "cargo_alquiler")
        .eq("estado", "pendiente")
        .lt("created_at", todayStr)
        .order("created_at", { ascending: true })
        .limit(5),
      
      // Leads calientes sin contactar hace más de 2 días
      supabase
        .from("leads")
        .select("id, nombre, telefono, email, temperatura, estado, updated_at, propiedad_id")
        .eq("temperatura", "caliente")
        .not("estado", "in", "(ganado,perdido)")
        .order("updated_at", { ascending: true })
        .limit(5),
      
      // Reparaciones urgentes pendientes
      supabase
        .from("reparaciones")
        .select(`
          id, titulo, urgencia, estado, created_at,
          propiedad:propiedad_id (direccion, ciudad)
        `)
        .eq("urgencia", "urgente")
        .in("estado", ["pendiente", "aprobada", "en_proceso"])
        .order("created_at", { ascending: true })
        .limit(5),
      
      // Liquidaciones confirmadas sin pagar
      supabase
        .from("liquidaciones")
        .select(`
          id, saldo_neto, periodo_desde, periodo_hasta,
          propietario:propietario_id (full_name)
        `)
        .eq("estado", "confirmada")
        .order("created_at", { ascending: true })
        .limit(5),
    ])

    // 2. Métricas clave del día
    const [
      { count: totalPropiedades },
      { count: propiedadesOcupadas },
      { count: contratosActivos },
      { count: leadsNuevosHoy },
      { data: ingresosMes },
      { data: cobranzasMes },
    ] = await Promise.all([
      supabase.from("propiedades").select("*", { count: "exact", head: true }),
      supabase.from("propiedades").select("*", { count: "exact", head: true }).eq("en_administracion", true),
      supabase.from("contratos").select("*", { count: "exact", head: true }).eq("estado", "activo"),
      supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", todayStr),
      supabase
        .from("movimientos")
        .select("monto")
        .eq("tipo", "cargo_alquiler")
        .gte("created_at", new Date(today.getFullYear(), today.getMonth(), 1).toISOString()),
      supabase
        .from("movimientos")
        .select("monto")
        .eq("tipo", "pago_alquiler")
        .eq("estado", "aplicado")
        .gte("created_at", new Date(today.getFullYear(), today.getMonth(), 1).toISOString()),
    ])

    // 3. Alertas de silencios
    const [
      { data: leadsOlvidados },
      { count: propietariosSinContacto },
    ] = await Promise.all([
      // Leads sin actividad hace más de 7 días
      supabase
        .from("leads")
        .select("id, nombre, telefono, updated_at, temperatura")
        .not("estado", "in", "(ganado,perdido)")
        .lt("updated_at", sevenDaysAgo.toISOString())
        .order("updated_at", { ascending: true })
        .limit(5),
      
      // Propietarios sin contacto (simplificado - por ahora cuenta sin activity_log reciente)
      supabase
        .from("property_owners")
        .select("*", { count: "exact", head: true })
        .eq("active", true),
    ])

    // Calcular métricas
    const totalIngresos = ingresosMes?.reduce((sum, m) => sum + Number(m.monto), 0) || 0
    const totalCobranzas = cobranzasMes?.reduce((sum, m) => sum + Number(m.monto), 0) || 0
    const tasaCobro = totalIngresos > 0 ? (totalCobranzas / totalIngresos) * 100 : 0
    const tasaOcupacion = totalPropiedades ? ((propiedadesOcupadas || 0) / totalPropiedades) * 100 : 0

    // Construir respuesta con decisiones priorizadas
    const decisiones = []

    // Prioridad 1: Contratos vencidos
    if (contratosVencidos && contratosVencidos.length > 0) {
      contratosVencidos.forEach(c => {
        decisiones.push({
          tipo: "contrato_vencimiento",
          prioridad: c.dias_hasta_vencimiento <= 0 ? "critica" : "alta",
          titulo: c.dias_hasta_vencimiento <= 0 
            ? `Contrato VENCIDO - ${c.direccion}`
            : `Contrato vence en ${c.dias_hasta_vencimiento} días`,
          subtitulo: `${c.ciudad}`,
          accion: "Renovar o finalizar",
          link: `/dashboard/contratos/${c.id}`,
          id: c.id,
        })
      })
    }

    // Prioridad 2: Recibos vencidos
    if (recibosVencidos && recibosVencidos.length > 0) {
      const totalVencido = recibosVencidos.reduce((sum, r) => sum + Number(r.monto), 0)
      decisiones.push({
        tipo: "morosidad",
        prioridad: "alta",
        titulo: `${recibosVencidos.length} recibos vencidos`,
        subtitulo: `Total: $${totalVencido.toLocaleString("es-AR")}`,
        accion: "Gestionar cobranza",
        link: "/dashboard/cobranzas?estado=vencido",
        items: recibosVencidos.length,
      })
    }

    // Prioridad 3: Leads calientes
    if (leadsCalientes && leadsCalientes.length > 0) {
      leadsCalientes.forEach(l => {
        decisiones.push({
          tipo: "lead_caliente",
          prioridad: "alta",
          titulo: `Lead caliente: ${l.nombre}`,
          subtitulo: l.telefono || l.email,
          accion: "Contactar hoy",
          link: `/dashboard/crm/${l.id}`,
          id: l.id,
        })
      })
    }

    // Prioridad 4: Reparaciones urgentes
    if (reparacionesUrgentes && reparacionesUrgentes.length > 0) {
      reparacionesUrgentes.forEach(r => {
        decisiones.push({
          tipo: "reparacion_urgente",
          prioridad: "media",
          titulo: `Reparación urgente: ${r.titulo}`,
          subtitulo: r.propiedad?.direccion || "",
          accion: "Gestionar",
          link: `/dashboard/reparaciones/${r.id}`,
          id: r.id,
        })
      })
    }

    // Prioridad 5: Liquidaciones pendientes de pago
    if (liquidacionesPendientes && liquidacionesPendientes.length > 0) {
      const totalLiq = liquidacionesPendientes.reduce((sum, l) => sum + Number(l.saldo_neto), 0)
      decisiones.push({
        tipo: "liquidacion_pendiente",
        prioridad: "media",
        titulo: `${liquidacionesPendientes.length} liquidaciones por pagar`,
        subtitulo: `Total: $${totalLiq.toLocaleString("es-AR")}`,
        accion: "Procesar pagos",
        link: "/dashboard/liquidaciones?estado=confirmada",
        items: liquidacionesPendientes.length,
      })
    }

    // Prioridad 6: Leads olvidados
    if (leadsOlvidados && leadsOlvidados.length > 0) {
      decisiones.push({
        tipo: "leads_olvidados",
        prioridad: "baja",
        titulo: `${leadsOlvidados.length} leads sin contactar (+7 días)`,
        subtitulo: "Requieren seguimiento",
        accion: "Revisar CRM",
        link: "/dashboard/crm?orden=antiguos",
        items: leadsOlvidados.length,
      })
    }

    return NextResponse.json({
      fecha: todayStr,
      metricas: {
        tasaOcupacion: Math.round(tasaOcupacion),
        contratosActivos: contratosActivos || 0,
        tasaCobro: Math.round(tasaCobro),
        ingresosMes: totalIngresos,
        cobranzasMes: totalCobranzas,
        leadsNuevosHoy: leadsNuevosHoy || 0,
        propiedadesTotal: totalPropiedades || 0,
        propiedadesOcupadas: propiedadesOcupadas || 0,
      },
      decisiones: decisiones.slice(0, 10), // Máximo 10 decisiones
      alertas: {
        contratosVencidos: contratosVencidos?.length || 0,
        recibosVencidos: recibosVencidos?.length || 0,
        leadsCalientes: leadsCalientes?.length || 0,
        reparacionesUrgentes: reparacionesUrgentes?.length || 0,
        leadsOlvidados: leadsOlvidados?.length || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error in executive dashboard:", error)
    return NextResponse.json({ error: "Error al cargar dashboard" }, { status: 500 })
  }
}
