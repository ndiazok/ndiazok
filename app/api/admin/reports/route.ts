import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const tipo = searchParams.get("tipo") || "cobranzas"
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  const propiedadId = searchParams.get("propiedad_id")
  const propietarioId = searchParams.get("propietario_id")

  try {
    let data: any[] = []
    let titulo = ""
    let columnas: string[] = []

    switch (tipo) {
      case "cobranzas": {
        titulo = "Reporte de Cobranzas"
        columnas = ["Fecha", "Propiedad", "Inquilino", "Período", "Monto", "Estado", "Fecha Pago"]
        
        let query = supabase
          .from("rent_receipts")
          .select(`
            *,
            contrato:contratos(
              propiedad:propiedades(direccion, ciudad),
              participantes:contract_participants(
                persona:profiles(full_name),
                party_role
              )
            )
          `)
          .order("fecha_emision", { ascending: false })

        if (desde) query = query.gte("periodo_inicio", desde)
        if (hasta) query = query.lte("periodo_fin", hasta)
        if (propiedadId) query = query.eq("contrato.propiedad_id", propiedadId)

        const { data: recibos, error } = await query
        if (error) throw error

        data = (recibos || []).map((r: any) => {
          const inquilino = r.contrato?.participantes?.find((p: any) => p.party_role === "INQUILINO")
          return {
            fecha: new Date(r.fecha_emision).toLocaleDateString("es-AR"),
            propiedad: r.contrato?.propiedad?.direccion || "-",
            inquilino: inquilino?.persona?.full_name || "-",
            periodo: `${new Date(r.periodo_inicio).toLocaleDateString("es-AR")} - ${new Date(r.periodo_fin).toLocaleDateString("es-AR")}`,
            monto: r.monto_total,
            moneda: r.moneda,
            estado: r.estado,
            fecha_pago: r.fecha_pago ? new Date(r.fecha_pago).toLocaleDateString("es-AR") : "-"
          }
        })
        break
      }

      case "liquidaciones": {
        titulo = "Reporte de Liquidaciones"
        columnas = ["Fecha", "Propietario", "Propiedad", "Período", "Ingresos", "Deducciones", "Neto", "Estado"]

        let query = supabase
          .from("owner_settlements")
          .select(`
            *,
            propietario:profiles!owner_settlements_propietario_id_fkey(full_name),
            propiedad:propiedades(direccion)
          `)
          .order("created_at", { ascending: false })

        if (desde) query = query.gte("periodo_inicio", desde)
        if (hasta) query = query.lte("periodo_fin", hasta)
        if (propietarioId) query = query.eq("propietario_id", propietarioId)

        const { data: liquidaciones, error } = await query
        if (error) throw error

        data = (liquidaciones || []).map((l: any) => ({
          fecha: new Date(l.created_at).toLocaleDateString("es-AR"),
          propietario: l.propietario?.full_name || "-",
          propiedad: l.propiedad?.direccion || "Todas",
          periodo: `${new Date(l.periodo_inicio).toLocaleDateString("es-AR")} - ${new Date(l.periodo_fin).toLocaleDateString("es-AR")}`,
          ingresos: l.total_ingresos,
          deducciones: l.total_deducciones,
          neto: l.monto_neto,
          moneda: l.moneda,
          estado: l.estado
        }))
        break
      }

      case "ocupacion": {
        titulo = "Reporte de Ocupación"
        columnas = ["Propiedad", "Ciudad", "Tipo", "Estado", "Propietario", "Inquilino", "Contrato Hasta"]

        const { data: propiedades, error } = await supabase
          .from("propiedades")
          .select(`
            *,
            propietarios:property_owners(
              persona:profiles(full_name),
              ownership_percentage
            ),
            contratos(
              id,
              estado,
              fecha_fin,
              participantes:contract_participants(
                persona:profiles(full_name),
                party_role
              )
            )
          `)
          .eq("en_administracion", true)
          .order("direccion")

        if (error) throw error

        data = (propiedades || []).map((p: any) => {
          const contratoActivo = p.contratos?.find((c: any) => c.estado === "activo")
          const inquilino = contratoActivo?.participantes?.find((par: any) => par.party_role === "INQUILINO")
          const propietario = p.propietarios?.[0]?.persona?.full_name

          return {
            propiedad: p.direccion,
            ciudad: p.ciudad,
            tipo: p.tipo,
            estado: contratoActivo ? "Ocupada" : "Disponible",
            propietario: propietario || "-",
            inquilino: inquilino?.persona?.full_name || "-",
            contrato_hasta: contratoActivo?.fecha_fin ? new Date(contratoActivo.fecha_fin).toLocaleDateString("es-AR") : "-"
          }
        })
        break
      }

      case "rentabilidad": {
        titulo = "Reporte de Rentabilidad"
        columnas = ["Propietario", "Propiedades", "Ingresos", "Deducciones", "Neto", "Ocupación %"]

        const { data: propietarios, error } = await supabase
          .from("property_owners")
          .select(`
            persona:profiles(id, full_name),
            propiedad:propiedades(id, direccion)
          `)

        if (error) throw error

        // Agrupar por propietario
        const propietariosMap = new Map()
        for (const po of propietarios || []) {
          const id = po.persona?.id
          if (!id) continue
          if (!propietariosMap.has(id)) {
            propietariosMap.set(id, {
              id,
              nombre: po.persona.full_name,
              propiedades: []
            })
          }
          if (po.propiedad) {
            propietariosMap.get(id).propiedades.push(po.propiedad)
          }
        }

        // Obtener liquidaciones del período
        let liquidacionesQuery = supabase
          .from("owner_settlements")
          .select("propietario_id, total_ingresos, total_deducciones, monto_neto")
          .eq("estado", "pagada")

        if (desde) liquidacionesQuery = liquidacionesQuery.gte("periodo_inicio", desde)
        if (hasta) liquidacionesQuery = liquidacionesQuery.lte("periodo_fin", hasta)

        const { data: liquidaciones } = await liquidacionesQuery

        data = Array.from(propietariosMap.values()).map((prop: any) => {
          const liqsProp = (liquidaciones || []).filter((l: any) => l.propietario_id === prop.id)
          const ingresos = liqsProp.reduce((sum: number, l: any) => sum + (l.total_ingresos || 0), 0)
          const deducciones = liqsProp.reduce((sum: number, l: any) => sum + (l.total_deducciones || 0), 0)
          const neto = liqsProp.reduce((sum: number, l: any) => sum + (l.monto_neto || 0), 0)

          return {
            propietario: prop.nombre,
            propiedades: prop.propiedades.length,
            ingresos,
            deducciones,
            neto,
            ocupacion: "N/A"
          }
        })
        break
      }

      case "contratos": {
        titulo = "Reporte de Contratos"
        columnas = ["Propiedad", "Inquilino", "Inicio", "Fin", "Monto", "Estado", "Días Restantes"]

        let query = supabase
          .from("contratos")
          .select(`
            *,
            propiedad:propiedades(direccion, ciudad),
            participantes:contract_participants(
              persona:profiles(full_name),
              party_role
            )
          `)
          .order("fecha_fin", { ascending: true })

        const { data: contratos, error } = await query
        if (error) throw error

        data = (contratos || []).map((c: any) => {
          const inquilino = c.participantes?.find((p: any) => p.party_role === "INQUILINO")
          const hoy = new Date()
          const fin = new Date(c.fecha_fin)
          const diasRestantes = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

          return {
            propiedad: c.propiedad?.direccion || "-",
            ciudad: c.propiedad?.ciudad || "-",
            inquilino: inquilino?.persona?.full_name || "-",
            inicio: new Date(c.fecha_inicio).toLocaleDateString("es-AR"),
            fin: new Date(c.fecha_fin).toLocaleDateString("es-AR"),
            monto: c.monto_alquiler,
            moneda: c.moneda,
            estado: c.estado,
            dias_restantes: diasRestantes
          }
        })
        break
      }

      default:
        return NextResponse.json({ error: "Tipo de reporte inválido" }, { status: 400 })
    }

    // Calcular totales si aplica
    let totales: any = null
    if (tipo === "cobranzas") {
      const pendiente = data.filter(d => d.estado === "pendiente").reduce((s, d) => s + d.monto, 0)
      const cobrado = data.filter(d => d.estado === "pagado").reduce((s, d) => s + d.monto, 0)
      totales = { pendiente, cobrado, total: pendiente + cobrado }
    } else if (tipo === "liquidaciones") {
      const totalNeto = data.reduce((s, d) => s + d.neto, 0)
      totales = { totalNeto }
    }

    return NextResponse.json({
      titulo,
      columnas,
      data,
      totales,
      generado: new Date().toISOString(),
      filtros: { desde, hasta, propiedadId, propietarioId }
    })

  } catch (error: any) {
    console.error("[v0] Error generating report:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
