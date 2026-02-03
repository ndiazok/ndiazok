import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET: Obtener pagos registrados
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cuentaId = searchParams.get("cuenta_id")
  const contratoId = searchParams.get("contrato_id")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  let query = supabaseAdmin
    .from("movimientos")
    .select(`
      *,
      contrato:contratos(
        id,
        propiedad:propiedades(id, direccion, ciudad)
      ),
      cuenta:cuentas_corrientes(
        id,
        titular_id,
        titular:profiles(id, full_name, email)
      ),
      movimiento_relacionado:movimientos!movimiento_relacionado_id(
        id, concepto, descripcion, monto, periodo_mes, periodo_anio
      )
    `)
    .eq("tipo", "credito")
    .in("concepto", ["pago_alquiler", "pago_parcial", "deposito", "otro_ingreso"])
    .order("created_at", { ascending: false })

  if (cuentaId) {
    query = query.eq("cuenta_id", cuentaId)
  }
  if (contratoId) {
    query = query.eq("contrato_id", contratoId)
  }
  if (desde) {
    query = query.gte("created_at", desde)
  }
  if (hasta) {
    query = query.lte("created_at", hasta)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST: Registrar un pago
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      cuenta_id,
      contrato_id,
      recibo_id, // movimiento de débito al que se aplica
      monto,
      concepto,
      descripcion,
      metodo_pago,
      referencia_pago,
    } = body

    if (!cuenta_id || !monto) {
      return NextResponse.json({ error: "cuenta_id y monto son requeridos" }, { status: 400 })
    }

    // Si hay recibo_id, verificar que existe y obtener info
    let reciboInfo = null
    if (recibo_id) {
      const { data: recibo, error: reciboError } = await supabaseAdmin
        .from("movimientos")
        .select("*")
        .eq("id", recibo_id)
        .single()

      if (reciboError || !recibo) {
        return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 })
      }

      reciboInfo = recibo
    }

    // Crear el movimiento de pago
    const { data: pago, error: pagoError } = await supabaseAdmin
      .from("movimientos")
      .insert({
        cuenta_id,
        contrato_id: contrato_id || reciboInfo?.contrato_id,
        tipo: "credito",
        concepto: concepto || "pago_alquiler",
        descripcion:
          descripcion ||
          `Pago recibido${metodo_pago ? ` (${metodo_pago})` : ""}${referencia_pago ? ` - Ref: ${referencia_pago}` : ""}`,
        monto,
        periodo_mes: reciboInfo?.periodo_mes,
        periodo_anio: reciboInfo?.periodo_anio,
        estado: "confirmado",
        movimiento_relacionado_id: recibo_id,
      })
      .select()
      .single()

    if (pagoError) {
      return NextResponse.json({ error: pagoError.message }, { status: 500 })
    }

    // Si el pago está relacionado a un recibo, actualizar estado del recibo
    if (recibo_id && reciboInfo) {
      // Obtener todos los pagos relacionados a este recibo
      const { data: pagosRecibo } = await supabaseAdmin
        .from("movimientos")
        .select("monto")
        .eq("movimiento_relacionado_id", recibo_id)
        .eq("tipo", "credito")
        .eq("estado", "confirmado")

      const totalPagado = (pagosRecibo || []).reduce((sum, p) => sum + p.monto, 0)

      let nuevoEstado = "pendiente"
      if (totalPagado >= reciboInfo.monto) {
        nuevoEstado = "pagado"
      } else if (totalPagado > 0) {
        nuevoEstado = "parcial"
      }

      await supabaseAdmin.from("movimientos").update({ estado: nuevoEstado }).eq("id", recibo_id)
    }

    // Actualizar saldo de la cuenta corriente
    const { data: cuenta } = await supabaseAdmin
      .from("cuentas_corrientes")
      .select("saldo_actual")
      .eq("id", cuenta_id)
      .single()

    if (cuenta) {
      await supabaseAdmin
        .from("cuentas_corrientes")
        .update({
          saldo_actual: (cuenta.saldo_actual || 0) + monto,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cuenta_id)
    }

    return NextResponse.json(pago)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
