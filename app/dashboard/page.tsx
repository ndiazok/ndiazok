"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  FileText,
  TrendingUp,
  AlertCircle,
  UserPlus,
  Loader2,
  AlertTriangle,
  Clock,
  Receipt,
  Banknote,
  ArrowRight,
  BarChart3,
  LayoutDashboard,
  Zap
} from "lucide-react"
import Link from "next/link"
import { FinancialCharts } from "@/components/dashboard/financial-charts"
import { ActivityTimeline } from "@/components/dashboard/activity-timeline"
import { ExecutiveView } from "@/components/dashboard/executive-view"

interface Stats {
  propiedades: number
  contratos: number
  clientes: number
  porCobrar: number
  porPagar: number
  movimientosPendientes: number
}

interface ContractAlert {
  id: string
  propiedad_direccion: string
  propiedad_ciudad: string
  fecha_fin: string
  dias_restantes: number
  nivel_alerta: string
  estado: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    propiedades: 0,
    contratos: 0,
    clientes: 0,
    porCobrar: 0,
    porPagar: 0,
    movimientosPendientes: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)
  const [contractAlerts, setContractAlerts] = useState<ContractAlert[]>([])
  const [financeData, setFinanceData] = useState<{
    recibos: { pendientes: number; vencidos: number; totalPorCobrar: number; detalle: any[] }
    liquidaciones: { borradores: number; confirmadas: number; totalPorPagar: number }
  } | null>(null)
  const [activeTab, setActiveTab] = useState("ejecutivo")

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      const [
        { count: propiedadesCount },
        { count: contratosCount },
        { count: clientesCount },
        { data: movimientosPendientes },
      ] = await Promise.all([
        supabase.from("propiedades").select("*", { count: "exact", head: true }),
        supabase.from("contratos").select("*", { count: "exact", head: true }).eq("estado", "activo"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).neq("role", "admin"),
        supabase.from("movimientos").select("monto, tipo").eq("estado", "pendiente").limit(100),
      ])

      try {
        const [alertsRes, financeRes] = await Promise.all([
          fetch("/api/admin/contracts/alerts"),
          fetch("/api/admin/finance/pending"),
        ])

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json()
          setContractAlerts(Array.isArray(alertsData) ? alertsData : [])
        }

        if (financeRes.ok) {
          const financeDataRes = await financeRes.json()
          setFinanceData(financeDataRes)
        }
      } catch (err) {
        // Silently handle errors
      }

      const porCobrar =
        movimientosPendientes?.filter((m) => m.tipo === "debito").reduce((acc, m) => acc + Number(m.monto), 0) || 0
      const porPagar =
        movimientosPendientes?.filter((m) => m.tipo === "credito").reduce((acc, m) => acc + Number(m.monto), 0) || 0

      setStats({
        propiedades: propiedadesCount || 0,
        contratos: contratosCount || 0,
        clientes: clientesCount || 0,
        porCobrar,
        porPagar,
        movimientosPendientes: movimientosPendientes?.length || 0,
      })
      setIsLoading(false)
    }

    fetchStats()
  }, [])

  const seedMockUsers = async () => {
    setIsSeeding(true)
    setSeedResult(null)
    try {
      const res = await fetch("/api/admin/seed-users", { method: "POST" })
      const data = await res.json()

      if (data.error) {
        setSeedResult(`Error: ${data.error}`)
        return
      }

      const created = data.results?.filter((r: any) => r.status === "created").length || 0
      const existing = data.results?.filter((r: any) => r.status === "already_exists").length || 0
      const errors = data.results?.filter((r: any) => r.status === "error") || []

      if (errors.length > 0) {
        setSeedResult(`${created} creados, ${existing} existían, ${errors.length} errores`)
      } else {
        setSeedResult(`${created} usuarios creados, ${existing} ya existían`)
      }

      setTimeout(() => window.location.reload(), 1000)
    } catch (err: any) {
      setSeedResult(`Error: ${err.message}`)
    } finally {
      setIsSeeding(false)
    }
  }

  const statsCards = [
    {
      title: "Propiedades",
      value: stats.propiedades,
      description: "En cartera",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      href: "/dashboard/propiedades",
    },
    {
      title: "Contratos Activos",
      value: stats.contratos,
      description: "En vigencia",
      icon: FileText,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      href: "/dashboard/contratos",
    },
    {
      title: "Por Cobrar",
      value: `$${(financeData?.recibos?.totalPorCobrar || 0).toLocaleString("es-AR")}`,
      description: `${(financeData?.recibos?.pendientes || 0) + (financeData?.recibos?.vencidos || 0)} recibos pendientes`,
      icon: Receipt,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      href: "/dashboard/cobranzas",
    },
    {
      title: "Por Liquidar",
      value: `$${(financeData?.liquidaciones?.totalPorPagar || 0).toLocaleString("es-AR")}`,
      description: `${(financeData?.liquidaciones?.borradores || 0) + (financeData?.liquidaciones?.confirmadas || 0)} liquidaciones`,
      icon: Banknote,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      href: "/dashboard/liquidaciones",
    },
  ]

  const getAlertStyle = (nivel: string) => {
    switch (nivel) {
      case "vencido":
        return { bg: "bg-red-50 border-red-200", text: "text-red-900", badge: "destructive" as const }
      case "urgente":
        return { bg: "bg-orange-50 border-orange-200", text: "text-orange-900", badge: "destructive" as const }
      case "proximo":
        return { bg: "bg-amber-50 border-amber-200", text: "text-amber-900", badge: "secondary" as const }
      case "atencion":
        return { bg: "bg-blue-50 border-blue-200", text: "text-blue-900", badge: "secondary" as const }
      default:
        return { bg: "bg-muted", text: "text-foreground", badge: "secondary" as const }
    }
  }

  const getAlertLabel = (nivel: string, dias: number) => {
    if (nivel === "vencido") return `Vencido hace ${Math.abs(dias)} días`
    if (nivel === "urgente") return `Vence en ${dias} días`
    if (nivel === "proximo") return `Vence en ${dias} días`
    return `${dias} días restantes`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general de tu gestión inmobiliaria</p>
        </div>
        <div className="flex items-center gap-2">
          {seedResult && <span className="text-sm text-muted-foreground">{seedResult}</span>}
          <Button variant="outline" size="sm" onClick={seedMockUsers} disabled={isSeeding}>
            {isSeeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Crear usuarios de prueba
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="ejecutivo" className="gap-2">
            <Zap className="h-4 w-4" />
            Ejecutivo
          </TabsTrigger>
          <TabsTrigger value="resumen" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="metricas" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="actividad" className="gap-2">
            <Clock className="h-4 w-4" />
            Actividad
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ejecutivo">
          <ExecutiveView />
        </TabsContent>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => (
              <Link key={stat.title} href={stat.href}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {financeData &&
            ((financeData.recibos?.vencidos || 0) > 0 || (financeData.liquidaciones?.confirmadas || 0) > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {(financeData.recibos?.vencidos || 0) > 0 && (
                  <Card className="border-red-200 bg-red-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-red-900 text-base">
                        <AlertTriangle className="h-4 w-4" />
                        Alquileres Vencidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {financeData.recibos?.detalle
                        ?.filter((r: any) => r.estado === "vencido")
                        .slice(0, 3)
                        .map((recibo: any) => (
                          <div key={recibo.id} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium text-red-900">{recibo.contrato?.propiedad?.direccion}</p>
                              <p className="text-xs text-red-700">{recibo.cuenta?.titular?.full_name}</p>
                            </div>
                            <span className="font-medium text-red-900">
                              ${Number(recibo.monto).toLocaleString("es-AR")}
                            </span>
                          </div>
                        ))}
                      <Link href="/dashboard/cobranzas?estado=vencido">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-red-700 hover:text-red-800 hover:bg-red-100"
                        >
                          Ver todos los vencidos
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {(financeData.liquidaciones?.confirmadas || 0) > 0 && (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-amber-900 text-base">
                        <Banknote className="h-4 w-4" />
                        Liquidaciones por Pagar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-amber-900">
                            ${(financeData.liquidaciones?.totalPorPagar || 0).toLocaleString("es-AR")}
                          </p>
                          <p className="text-xs text-amber-700">
                            {financeData.liquidaciones?.confirmadas} liquidaciones confirmadas
                          </p>
                        </div>
                        <Link href="/dashboard/liquidaciones?estado=confirmada">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
                          >
                            Ver liquidaciones
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

          {contractAlerts.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas de Contratos ({contractAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contractAlerts.slice(0, 5).map((alert) => {
                  const style = getAlertStyle(alert.nivel_alerta)
                  return (
                    <Link key={alert.id} href={`/dashboard/contratos/${alert.id}`}>
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg border ${style.bg} hover:opacity-80 transition-opacity cursor-pointer`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className={`h-4 w-4 ${style.text}`} />
                          <div>
                            <p className={`text-sm font-medium ${style.text}`}>
                              {alert.propiedad_direccion}, {alert.propiedad_ciudad}
                            </p>
                            <p className={`text-xs ${style.text} opacity-80`}>
                              Vencimiento: {new Date(alert.fecha_fin).toLocaleDateString("es-AR")}
                            </p>
                          </div>
                        </div>
                        <Badge variant={style.badge}>{getAlertLabel(alert.nivel_alerta, alert.dias_restantes)}</Badge>
                      </div>
                    </Link>
                  )
                })}
                {contractAlerts.length > 5 && (
                  <Link href="/dashboard/contratos?filter=alertas">
                    <Button variant="ghost" className="w-full text-amber-700">
                      Ver todos los contratos con alertas ({contractAlerts.length})
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link
                  href="/dashboard/cobranzas/recibos"
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Generar Recibos</p>
                    <p className="text-xs text-muted-foreground">Crear recibos del mes</p>
                  </div>
                </Link>
                <Link
                  href="/dashboard/cobranzas/pago"
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-lg bg-amber-500/10 p-2">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Registrar Pago</p>
                    <p className="text-xs text-muted-foreground">Cargar cobro de alquiler</p>
                  </div>
                </Link>
                <Link
                  href="/dashboard/liquidaciones/nueva"
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-lg bg-red-500/10 p-2">
                    <Banknote className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Nueva Liquidación</p>
                    <p className="text-xs text-muted-foreground">Liquidar a propietario</p>
                  </div>
                </Link>
                <Link
                  href="/dashboard/contratos/nuevo"
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Nuevo Contrato</p>
                    <p className="text-xs text-muted-foreground">Crear un contrato de alquiler</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estado General</CardTitle>
              </CardHeader>
              <CardContent>
                {(financeData?.recibos?.vencidos || 0) > 0 ||
                (financeData?.recibos?.pendientes || 0) > 0 ||
                contractAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {(financeData?.recibos?.pendientes || 0) > 0 && (
                      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <Receipt className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">
                            {financeData?.recibos?.pendientes} recibos pendientes de cobro
                          </p>
                          <p className="text-xs text-amber-700">
                            Total: ${(financeData?.recibos?.totalPorCobrar || 0).toLocaleString("es-AR")}
                          </p>
                        </div>
                      </div>
                    )}
                    {(financeData?.recibos?.vencidos || 0) > 0 && (
                      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            {financeData?.recibos?.vencidos} alquileres vencidos
                          </p>
                          <p className="text-xs text-red-700">Requieren seguimiento de cobranza</p>
                        </div>
                      </div>
                    )}
                    {contractAlerts.filter((a) => a.nivel_alerta === "vencido").length > 0 && (
                      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            {contractAlerts.filter((a) => a.nivel_alerta === "vencido").length} contratos vencidos
                          </p>
                          <p className="text-xs text-red-700">Requieren renovación o finalización</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-emerald-500/10 p-3 mb-3">
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium">Todo al día</p>
                    <p className="text-xs text-muted-foreground">No hay alertas pendientes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metricas">
          <FinancialCharts />
        </TabsContent>

        <TabsContent value="actividad">
          <ActivityTimeline />
        </TabsContent>
      </Tabs>
    </div>
  )
}
