import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET: Obtener liquidaciones
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const propietarioId = searchParams.get("propietario_id")
  const propiedadId = searchParams.get("propiedad_id")
  const estado = searchParams.get("estado")

  let query = supabaseAdmin
    .from("liquidaciones")
    .select(`
      *,
      propietario:profiles!propietario_id(id, full_name, email),
      propiedad:propiedades(id, direccion, ciudad),
      items:liquidacion_items(*)
    `)
    .order("created_at", { ascending: false })

  if (propietarioId) {
    query = query.eq("propietario_id", propietarioId)
  }
  if (propiedadId) {
    query = query.eq("propiedad_id", propiedadId)
  }
  if (estado) {
    query = query.eq("estado", estado)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST: Generar liquidación para propietario
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { propietario_id, propiedad_id, periodo_desde, periodo_hasta, notas } = body

    if (!propietario_id || !periodo_desde || !periodo_hasta) {
      return NextResponse.json(
        { error: "propietario_id, periodo_desde y periodo_hasta son requeridos" },
        { status: 400 },
      )
    }

    // Obtener propiedades del propietario
    let propiedadesQuery = supabaseAdmin
      .from("property_owners")
      .select(`
        property_id,
        ownership_percentage,
        propiedad:propiedades(
          id,
          direccion,
          ciudad,
          contratos:contratos(
            id,
            monto_base,
            moneda,
            honorarios_porcentaje,
            estado
          )
        )
      `)
      .eq("person_id", propietario_id)
      .eq("active", true)

    if (propiedad_id) {
      propiedadesQuery = propiedadesQuery.eq("property_id", propiedad_id)
    }

    const { data: propiedades, error: propError } = await propiedadesQuery

    if (propError) {
      return NextResponse.json({ error: propError.message }, { status: 500 })
    }

    if (!propiedades || propiedades.length === 0) {
      return NextResponse.json({ error: "No se encontraron propiedades para este propietario" }, { status: 404 })
    }

    // Calcular items de la liquidación
    const items: any[] = []
    let totalCreditos = 0
    let totalDebitos = 0

    for (const prop of propiedades) {
      const porcentaje = prop.ownership_percentage || 100

      // Obtener cobros del período (alquileres pagados)
      const { data: cobros } = await supabaseAdmin
        .from("movimientos")
        .select(`
          *,
          contrato:contratos(id, honorarios_porcentaje, propiedad_id)
        `)
        .eq("tipo", "credito")
        .eq("concepto", "pago_alquiler")
        .eq("estado", "confirmado")
        .gte("created_at", periodo_desde)
        .lte("created_at", periodo_hasta)

      // Filtrar cobros de esta propiedad
      const cobrosPropiedad = (cobros || []).filter((c) => c.contrato?.propiedad_id === prop.property_id)

      for (const cobro of cobrosPropiedad) {
        const montoProporcion = (cobro.monto * porcentaje) / 100

        // Agregar ingreso por alquiler
        items.push({
          tipo: "credito",
          concepto: "Alquiler cobrado",
          descripcion: `${cobro.descripcion} (${porcentaje}% participación)`,
          monto: montoProporcion,
          movimiento_id: cobro.id,
        })
        totalCreditos += montoProporcion

        // Calcular y descontar honorarios
        const honorariosPct = cobro.contrato?.honorarios_porcentaje || 5
        const montoHonorarios = (montoProporcion * honorariosPct) / 100

        items.push({
          tipo: "debito",
          concepto: "Honorarios administración",
          descripcion: `${honorariosPct}% sobre alquiler`,
          monto: montoHonorarios,
        })
        totalDebitos += montoHonorarios
      }

      // Obtener gastos/reparaciones del período
      const { data: reparaciones } = await supabaseAdmin
        .from("reparaciones")
        .select("*")
        .eq("propiedad_id", prop.property_id)
        .eq("estado", "finalizado")
        .eq("responsable_pago", "propietario")
        .gte("fecha_fin", periodo_desde)
        .lte("fecha_fin", periodo_hasta)

      for (const rep of reparaciones || []) {
        const montoProporcion = ((rep.costo_final || 0) * porcentaje) / 100
        items.push({
          tipo: "debito",
          concepto: "Reparación/Mantenimiento",
          descripcion: `${rep.titulo} - ${rep.descripcion?.substring(0, 50)}...`,
          monto: montoProporcion,
          reparacion_id: rep.id,
        })
        totalDebitos += montoProporcion
      }
    }

    const saldoNeto = totalCreditos - totalDebitos

    // Crear la liquidación
    const { data: liquidacion, error: liqError } = await supabaseAdmin
      .from("liquidaciones")
      .insert({
        propietario_id,
        propiedad_id: propiedad_id || null,
        periodo_desde,
        periodo_hasta,
        total_creditos: totalCreditos,
        total_debitos: totalDebitos,
        saldo_neto: saldoNeto,
        estado: "borrador",
        notas,
        tipo_agrupacion: propiedad_id ? "propiedad" : "propietario",
      })
      .select()
      .single()

    if (liqError) {
      return NextResponse.json({ error: liqError.message }, { status: 500 })
    }

    // Crear los items de la liquidación
    if (items.length > 0) {
      const itemsConLiqId = items.map((item) => ({
        ...item,
        liquidacion_id: liquidacion.id,
      }))

      const { error: itemsError } = await supabaseAdmin.from("liquidacion_items").insert(itemsConLiqId)

      if (itemsError) {
        // Rollback liquidación si falla
        await supabaseAdmin.from("liquidaciones").delete().eq("id", liquidacion.id)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }

    // Obtener liquidación completa con items
    const { data: liquidacionCompleta } = await supabaseAdmin
      .from("liquidaciones")
      .select(`
        *,
        propietario:profiles!propietario_id(id, full_name, email),
        propiedad:propiedades(id, direccion, ciudad),
        items:liquidacion_items(*)
      `)
      .eq("id", liquidacion.id)
      .single()

    return NextResponse.json(liquidacionCompleta)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT: Confirmar o pagar liquidación
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { liquidacion_id, accion, metodo_pago, comprobante_pago } = body

    if (!liquidacion_id || !accion) {
      return NextResponse.json({ error: "liquidacion_id y accion son requeridos" }, { status: 400 })
    }

    const updates: any = { updated_at: new Date().toISOString() }

    if (accion === "confirmar") {
      updates.estado = "confirmada"
    } else if (accion === "pagar") {
      updates.estado = "pagada"
      updates.fecha_pago = new Date().toISOString().split("T")[0]
      updates.metodo_pago = metodo_pago
      updates.comprobante_pago = comprobante_pago
    } else if (accion === "anular") {
      updates.estado = "anulada"
    }

    const { data, error } = await supabaseAdmin
      .from("liquidaciones")
      .update(updates)
      .eq("id", liquidacion_id)
      .select(`
        *,
        propietario:profiles!propietario_id(id, full_name, email),
        items:liquidacion_items(*)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
