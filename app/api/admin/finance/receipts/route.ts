import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET: Obtener recibos de alquiler pendientes o generados
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const contratoId = searchParams.get("contrato_id")
  const estado = searchParams.get("estado") // pendiente, pagado, parcial, vencido
  const mes = searchParams.get("mes")
  const anio = searchParams.get("anio")

  let query = supabaseAdmin
    .from("movimientos")
    .select(`
      *,
      contrato:contratos(
        id,
        monto_base,
        moneda,
        fecha_inicio,
        fecha_fin,
        indice_ajuste,
        periodicidad_ajuste,
        propiedad:propiedades(id, direccion, ciudad)
      ),
      cuenta:cuentas_corrientes(
        id,
        titular_id,
        titular:profiles(id, full_name, email)
      )
    `)
    .eq("tipo", "debito")
    .eq("concepto", "alquiler")
    .order("periodo_anio", { ascending: false })
    .order("periodo_mes", { ascending: false })

  if (contratoId) {
    query = query.eq("contrato_id", contratoId)
  }
  if (estado) {
    query = query.eq("estado", estado)
  }
  if (mes && anio) {
    query = query.eq("periodo_mes", Number.parseInt(mes)).eq("periodo_anio", Number.parseInt(anio))
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST: Generar recibos de alquiler para un período
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mes, anio, contrato_ids } = body

    if (!mes || !anio) {
      return NextResponse.json({ error: "Mes y año son requeridos" }, { status: 400 })
    }

    // Obtener contratos activos
    let query = supabaseAdmin
      .from("contratos")
      .select(`
        id,
        propiedad_id,
        monto_base,
        moneda,
        fecha_inicio,
        fecha_fin,
        indice_ajuste,
        periodicidad_ajuste,
        dia_vencimiento,
        ajustes_manuales,
        propiedad:propiedades(id, direccion, ciudad),
        participantes:contract_participants(
          person_id,
          party_role,
          persona:profiles(id, full_name, email)
        )
      `)
      .eq("estado", "activo")
      .lte("fecha_inicio", `${anio}-${String(mes).padStart(2, "0")}-01`)

    if (contrato_ids && contrato_ids.length > 0) {
      query = query.in("id", contrato_ids)
    }

    const { data: contratos, error: contratosError } = await query

    if (contratosError) {
      return NextResponse.json({ error: contratosError.message }, { status: 500 })
    }

    const recibosGenerados = []
    const errores = []

    for (const contrato of contratos || []) {
      // Verificar si ya existe recibo para este período
      const { data: existente } = await supabaseAdmin
        .from("movimientos")
        .select("id")
        .eq("contrato_id", contrato.id)
        .eq("periodo_mes", mes)
        .eq("periodo_anio", anio)
        .eq("concepto", "alquiler")
        .single()

      if (existente) {
        errores.push({
          contrato_id: contrato.id,
          error: "Ya existe recibo para este período",
        })
        continue
      }

      // Calcular monto con ajuste
      const montoAjustado = calcularMontoAjustado(contrato, mes, anio)

      // Obtener inquilino principal
      const inquilino = contrato.participantes?.find((p: any) => p.party_role === "INQUILINO")

      if (!inquilino) {
        errores.push({
          contrato_id: contrato.id,
          error: "Contrato sin inquilino asignado",
        })
        continue
      }

      // Obtener o crear cuenta corriente del inquilino
      let { data: cuenta } = await supabaseAdmin
        .from("cuentas_corrientes")
        .select("id")
        .eq("titular_id", inquilino.person_id)
        .eq("tipo_cuenta", "inquilino")
        .single()

      if (!cuenta) {
        const { data: nuevaCuenta, error: cuentaError } = await supabaseAdmin
          .from("cuentas_corrientes")
          .insert({
            titular_id: inquilino.person_id,
            tipo_cuenta: "inquilino",
            saldo_actual: 0,
            estado: "activa",
          })
          .select()
          .single()

        if (cuentaError) {
          errores.push({
            contrato_id: contrato.id,
            error: `Error creando cuenta: ${cuentaError.message}`,
          })
          continue
        }
        cuenta = nuevaCuenta
      }

      // Crear el movimiento (recibo)
      const fechaVencimiento = new Date(anio, mes - 1, contrato.dia_vencimiento || 10)
      const hoy = new Date()
      const estado = fechaVencimiento < hoy ? "vencido" : "pendiente"

      const { data: movimiento, error: movError } = await supabaseAdmin
        .from("movimientos")
        .insert({
          cuenta_id: cuenta.id,
          contrato_id: contrato.id,
          tipo: "debito",
          concepto: "alquiler",
          descripcion: `Alquiler ${nombreMes(mes)} ${anio} - ${contrato.propiedad?.direccion}`,
          monto: montoAjustado,
          periodo_mes: mes,
          periodo_anio: anio,
          estado: estado,
        })
        .select()
        .single()

      if (movError) {
        errores.push({
          contrato_id: contrato.id,
          error: movError.message,
        })
        continue
      }

      recibosGenerados.push({
        ...movimiento,
        contrato,
        inquilino: inquilino.persona,
      })
    }

    return NextResponse.json({
      generados: recibosGenerados.length,
      errores: errores.length,
      recibos: recibosGenerados,
      detalle_errores: errores,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function calcularMontoAjustado(contrato: any, mes: number, anio: number): number {
  const fechaInicio = new Date(contrato.fecha_inicio)
  const mesActual = new Date(anio, mes - 1, 1)

  // Verificar ajustes manuales
  if (contrato.ajustes_manuales && Array.isArray(contrato.ajustes_manuales)) {
    // Buscar el ajuste aplicable más reciente
    const ajustesOrdenados = contrato.ajustes_manuales
      .filter((a: any) => new Date(a.fecha) <= mesActual)
      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    if (ajustesOrdenados.length > 0) {
      const ajusteActual = ajustesOrdenados[0]
      if (ajusteActual.tipo === "monto") {
        return ajusteActual.valor
      }
      // Si es tipo índice, aplicar el porcentaje al monto base
      // Por ahora retornamos el monto base (TODO: integrar con índices reales)
    }
  }

  // Si no hay ajustes manuales, verificar si corresponde ajuste automático
  if (contrato.periodicidad_ajuste && contrato.periodicidad_ajuste > 0) {
    const mesesTranscurridos = (anio - fechaInicio.getFullYear()) * 12 + (mes - (fechaInicio.getMonth() + 1))

    // Verificar si estamos en un período de ajuste
    if (mesesTranscurridos > 0 && mesesTranscurridos % contrato.periodicidad_ajuste === 0) {
      // TODO: Obtener índice real de la tabla indices_ajuste
      // Por ahora retornamos monto base
    }
  }

  return contrato.monto_base
}

function nombreMes(mes: number): string {
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]
  return meses[mes - 1] || ""
}
