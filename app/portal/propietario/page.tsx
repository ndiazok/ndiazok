"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Building2, FileText, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface DashboardStats {
  propiedades: number
  contratosActivos: number
  liquidacionesPendientes: number
  ingresosMes: number
}

interface Alerta {
  tipo: string
  mensaje: string
  link: string
}

export default function PropietarioDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    propiedades: 0,
    contratosActivos: 0,
    liquidacionesPendientes: 0,
    ingresosMes: 0,
  })
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch properties where user is owner
      const { data: propiedades, count: propiedadesCount } = await supabase
        .from("property_owners")
        .select("property_id", { count: "exact" })
        .eq("person_id", user.id)

      // Fetch active contracts for user's properties
      const propertyIds = propiedades?.map((p) => p.property_id) || []

      let contratosActivos = 0
      if (propertyIds.length > 0) {
        const { count } = await supabase
          .from("contratos")
          .select("id", { count: "exact", head: true })
          .in("propiedad_id", propertyIds)
          .eq("estado", "activo")
        contratosActivos = count || 0
      }

      // Fetch pending liquidations
      const { count: liquidacionesPendientes } = await supabase
        .from("liquidaciones")
        .select("id", { count: "exact", head: true })
        .eq("propietario_id", user.id)
        .in("estado", ["pendiente", "generada"])

      // Build alerts
      const alertasTemp: Alerta[] = []

      // Check for contracts about to expire
      if (propertyIds.length > 0) {
        const { data: contratosVencer } = await supabase
          .from("vista_contratos_vigencia")
          .select("id, direccion, dias_hasta_vencimiento")
          .in("propiedad_id", propertyIds)
          .eq("estado", "activo")
          .lte("dias_hasta_vencimiento", 60)
          .gt("dias_hasta_vencimiento", 0)
          .limit(3)

        contratosVencer?.forEach((c) => {
          alertasTemp.push({
            tipo: "warning",
            mensaje: `Contrato de ${c.direccion} vence en ${c.dias_hasta_vencimiento} días`,
            link: `/portal/propietario/contratos/${c.id}`,
          })
        })
      }

      // Check for pending liquidations
      if (liquidacionesPendientes && liquidacionesPendientes > 0) {
        alertasTemp.push({
          tipo: "info",
          mensaje: `Tenés ${liquidacionesPendientes} liquidación(es) pendiente(s) de cobro`,
          link: "/portal/propietario/liquidaciones",
        })
      }

      setStats({
        propiedades: propiedadesCount || 0,
        contratosActivos,
        liquidacionesPendientes: liquidacionesPendientes || 0,
        ingresosMes: 0, // TODO: Calculate from movements
      })
      setAlertas(alertasTemp)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Portal Propietario</h1>
        <p className="text-muted-foreground">Resumen de tus propiedades y contratos</p>
      </div>

      {/* Alerts */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((alerta, i) => (
            <Link key={i} href={alerta.link}>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  alerta.tipo === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{alerta.mensaje}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.propiedades}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contratos Activos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contratosActivos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Liquidaciones Pendientes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.liquidacionesPendientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.ingresosMes.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/portal/propietario/propiedades">
          <Card className="hover:border-foreground transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base">Mis Propiedades</CardTitle>
              <CardDescription>Ver todas tus propiedades y su estado actual</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/portal/propietario/contratos">
          <Card className="hover:border-foreground transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base">Contratos</CardTitle>
              <CardDescription>Consultar contratos vigentes e historial</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/portal/propietario/liquidaciones">
          <Card className="hover:border-foreground transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base">Liquidaciones</CardTitle>
              <CardDescription>Ver liquidaciones y estado de cobros</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
