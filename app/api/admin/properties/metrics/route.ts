import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const alert = searchParams.get("alert")

  // Get properties with their metrics
  let query = supabase
    .from("vista_property_metrics")
    .select("*")

  if (alert) {
    query = query.not("alerta", "is", null)
    if (alert !== "all") {
      query = query.eq("alerta", alert)
    }
  }

  const { data, error } = await query.order("dias_en_mercado", { ascending: false })

  if (error) {
    // If view doesn't exist, calculate metrics manually
    const { data: properties, error: propError } = await supabase
      .from("propiedades")
      .select(`
        id,
        direccion,
        ciudad,
        tipo,
        en_venta,
        en_alquiler,
        publicar_web,
        precio_venta,
        precio_alquiler,
        created_at
      `)
      .or("en_venta.eq.true,en_alquiler.eq.true")
      .eq("publicar_web", true)

    if (propError) {
      return NextResponse.json({ error: propError.message }, { status: 500 })
    }

    // Get events for each property
    const metricsPromises = (properties || []).map(async (prop) => {
      const { data: events } = await supabase
        .from("property_events")
        .select("event_type")
        .eq("property_id", prop.id)

      const diasEnMercado = Math.floor(
        (Date.now() - new Date(prop.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      const visitas = events?.filter(e => e.event_type === "visita_web").length || 0
      const consultas = events?.filter(e => e.event_type === "consulta").length || 0
      const showings = events?.filter(e => e.event_type === "visita_presencial").length || 0
      const reservas = events?.filter(e => e.event_type === "reserva").length || 0

      let alerta = null
      if (diasEnMercado > 90 && reservas === 0) alerta = "estancada"
      else if (diasEnMercado > 30 && visitas < 5) alerta = "sin_visitas"
      else if (showings > 5 && reservas === 0) alerta = "sin_cierre"

      return {
        ...prop,
        dias_en_mercado: diasEnMercado,
        visitas_web: visitas,
        consultas,
        visitas_presenciales: showings,
        reservas,
        conversion_consulta: visitas > 0 ? ((consultas / visitas) * 100).toFixed(1) : 0,
        conversion_visita: consultas > 0 ? ((showings / consultas) * 100).toFixed(1) : 0,
        conversion_reserva: showings > 0 ? ((reservas / showings) * 100).toFixed(1) : 0,
        alerta,
      }
    })

    const metrics = await Promise.all(metricsPromises)
    
    // Filter by alert if specified
    const filtered = alert 
      ? metrics.filter(m => alert === "all" ? m.alerta !== null : m.alerta === alert)
      : metrics

    return NextResponse.json(filtered.sort((a, b) => b.dias_en_mercado - a.dias_en_mercado))
  }

  return NextResponse.json(data)
}
