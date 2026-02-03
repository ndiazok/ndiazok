import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Get owner profile
  const { data: owner } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("id", id)
    .single()

  if (!owner) {
    return NextResponse.json({ error: "Propietario no encontrado" }, { status: 404 })
  }

  // Get all properties where this person is an owner
  const { data: ownerships } = await supabase
    .from("property_owners")
    .select(`
      ownership_percentage,
      propiedad:propiedades(
        id, direccion, ciudad, tipo,
        en_alquiler, precio_alquiler, moneda_alquiler,
        en_venta, precio_venta, moneda_venta,
        en_administracion
      )
    `)
    .eq("person_id", id)

  const properties = ownerships?.map(o => ({
    ...o.propiedad,
    ownership_percentage: o.ownership_percentage
  })) || []

  // Get all active contracts for these properties
  const propertyIds = properties.map(p => p.id)
  
  const { data: contracts } = await supabase
    .from("contratos")
    .select("id, propiedad_id, monto_alquiler, moneda, estado, fecha_inicio, fecha_fin")
    .in("propiedad_id", propertyIds.length > 0 ? propertyIds : ["none"])
    .eq("estado", "activo")

  // Get receipts for these contracts
  const contractIds = contracts?.map(c => c.id) || []
  
  const { data: receipts } = await supabase
    .from("movimientos")
    .select("id, monto, estado, fecha_vencimiento, contrato_id")
    .in("contrato_id", contractIds.length > 0 ? contractIds : ["none"])
    .eq("tipo", "alquiler")

  // Get liquidations for this owner
  const { data: liquidations } = await supabase
    .from("liquidaciones")
    .select("id, monto_total, honorarios, deducciones, monto_neto, estado, periodo_inicio, periodo_fin")
    .eq("propietario_id", id)
    .order("created_at", { ascending: false })
    .limit(12)

  // Calculate metrics
  const totalProperties = properties.length
  const propertiesInRent = properties.filter(p => p.en_alquiler).length
  const propertiesRented = contracts?.length || 0
  const occupancyRate = propertiesInRent > 0 ? (propertiesRented / propertiesInRent) * 100 : 0

  const totalReceipts = receipts?.length || 0
  const paidReceipts = receipts?.filter(r => r.estado === "pagado").length || 0
  const collectionRate = totalReceipts > 0 ? (paidReceipts / totalReceipts) * 100 : 0

  const totalIncome = liquidations?.reduce((sum, l) => sum + (l.monto_total || 0), 0) || 0
  const totalFees = liquidations?.reduce((sum, l) => sum + (l.honorarios || 0), 0) || 0
  const totalDeductions = liquidations?.reduce((sum, l) => sum + (l.deducciones || 0), 0) || 0
  const netIncome = liquidations?.reduce((sum, l) => sum + (l.monto_neto || 0), 0) || 0

  // Calculate monthly income (last 12 months)
  const monthlyIncome = liquidations?.map(l => ({
    periodo: `${l.periodo_inicio} - ${l.periodo_fin}`,
    bruto: l.monto_total,
    neto: l.monto_neto,
    honorarios: l.honorarios,
    deducciones: l.deducciones,
    estado: l.estado
  })) || []

  // Pending liquidations
  const pendingLiquidations = liquidations?.filter(l => l.estado === "pendiente") || []

  // Generate AI recommendations
  const recommendations = []
  
  if (occupancyRate < 80) {
    recommendations.push({
      type: "warning",
      title: "Vacancia alta",
      description: `Tasa de ocupación del ${occupancyRate.toFixed(0)}%. Considerar ajuste de precios o mejoras en propiedades vacantes.`
    })
  }

  if (collectionRate < 90) {
    recommendations.push({
      type: "alert",
      title: "Cobranza mejorable", 
      description: `Tasa de cobro del ${collectionRate.toFixed(0)}%. Revisar inquilinos con pagos pendientes.`
    })
  }

  const vacantProperties = properties.filter(p => 
    p.en_alquiler && !contracts?.some(c => c.propiedad_id === p.id)
  )
  
  if (vacantProperties.length > 0) {
    recommendations.push({
      type: "info",
      title: `${vacantProperties.length} propiedad(es) sin alquilar`,
      description: `Propiedades disponibles: ${vacantProperties.map(p => p.direccion).join(", ")}`
    })
  }

  if (pendingLiquidations.length > 0) {
    const totalPending = pendingLiquidations.reduce((sum, l) => sum + (l.monto_neto || 0), 0)
    recommendations.push({
      type: "success",
      title: "Liquidaciones pendientes de pago",
      description: `Tiene $${totalPending.toLocaleString("es-AR")} pendientes de cobrar.`
    })
  }

  return NextResponse.json({
    owner,
    properties,
    metrics: {
      totalProperties,
      propertiesInRent,
      propertiesRented,
      occupancyRate,
      collectionRate,
      totalIncome,
      totalFees,
      totalDeductions,
      netIncome,
    },
    monthlyIncome,
    pendingLiquidations,
    recommendations,
    contracts: contracts || [],
  })
}
