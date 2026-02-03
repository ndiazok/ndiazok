"use client"

import React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  FileText,
  Flame,
  Clock,
  DollarSign,
  Wrench,
  Phone,
  ChevronRight,
  Zap,
  Target,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface Decision {
  tipo: string
  prioridad: "critica" | "alta" | "media" | "baja"
  titulo: string
  subtitulo: string
  accion: string
  link: string
  id?: string
  items?: number
}

interface ExecutiveData {
  fecha: string
  metricas: {
    tasaOcupacion: number
    contratosActivos: number
    tasaCobro: number
    ingresosMes: number
    cobranzasMes: number
    leadsNuevosHoy: number
    propiedadesTotal: number
    propiedadesOcupadas: number
  }
  decisiones: Decision[]
  alertas: {
    contratosVencidos: number
    recibosVencidos: number
    leadsCalientes: number
    reparacionesUrgentes: number
    leadsOlvidados: number
  }
}

const prioridadConfig = {
  critica: { color: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  alta: { color: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  media: { color: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  baja: { color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
}

const tipoIconos: Record<string, React.ElementType> = {
  contrato_vencimiento: FileText,
  morosidad: DollarSign,
  lead_caliente: Flame,
  reparacion_urgente: Wrench,
  liquidacion_pendiente: DollarSign,
  leads_olvidados: Clock,
}

export function ExecutiveView() {
  const [data, setData] = useState<ExecutiveData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard/executive")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error("Error fetching executive data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Actualizar hora cada minuto
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Error al cargar el dashboard ejecutivo
        </CardContent>
      </Card>
    )
  }

  const totalAlertas = 
    data.alertas.contratosVencidos + 
    data.alertas.recibosVencidos + 
    data.alertas.leadsCalientes + 
    data.alertas.reparacionesUrgentes

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header con fecha y hora */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vista Ejecutiva</h2>
          <p className="text-muted-foreground">
            {currentTime.toLocaleDateString("es-AR", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
            {" • "}
            {currentTime.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {totalAlertas > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            <AlertTriangle className="mr-2 h-5 w-5" />
            {totalAlertas} alertas requieren atención
          </Badge>
        )}
      </div>

      {/* KPIs principales - Vista de 30 segundos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Ocupación</p>
                <p className="text-3xl font-bold">{data.metricas.tasaOcupacion}%</p>
              </div>
              <div className={`p-3 rounded-full ${data.metricas.tasaOcupacion >= 80 ? "bg-green-100" : "bg-yellow-100"}`}>
                <Building2 className={`h-6 w-6 ${data.metricas.tasaOcupacion >= 80 ? "text-green-600" : "text-yellow-600"}`} />
              </div>
            </div>
            <Progress value={data.metricas.tasaOcupacion} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {data.metricas.propiedadesOcupadas} de {data.metricas.propiedadesTotal} propiedades
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Cobro</p>
                <p className="text-3xl font-bold">{data.metricas.tasaCobro}%</p>
              </div>
              <div className={`p-3 rounded-full ${data.metricas.tasaCobro >= 90 ? "bg-green-100" : "bg-red-100"}`}>
                {data.metricas.tasaCobro >= 90 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
            <Progress value={data.metricas.tasaCobro} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(data.metricas.cobranzasMes)} cobrado este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contratos Activos</p>
                <p className="text-3xl font-bold">{data.metricas.contratosActivos}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {data.alertas.contratosVencidos > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {data.alertas.contratosVencidos} por vencer
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Hoy</p>
                <p className="text-3xl font-bold">{data.metricas.leadsNuevosHoy}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {data.alertas.leadsCalientes > 0 && (
                <Badge className="text-xs bg-orange-500">
                  <Flame className="mr-1 h-3 w-3" />
                  {data.alertas.leadsCalientes} calientes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decisiones del día */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Decisiones del Día
            </CardTitle>
            <Badge variant="outline">{data.decisiones.length} pendientes</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.decisiones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">Todo bajo control</p>
              <p className="text-sm">No hay decisiones urgentes pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.decisiones.map((decision, index) => {
                const config = prioridadConfig[decision.prioridad]
                const Icon = tipoIconos[decision.tipo] || AlertCircle

                return (
                  <Link
                    key={`${decision.tipo}-${decision.id || index}`}
                    href={decision.link}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${config.border} ${config.bg} hover:opacity-90 transition-opacity`}
                  >
                    <div className={`p-2 rounded-full ${config.color} bg-opacity-20`}>
                      <Icon className={`h-5 w-5 ${config.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${config.text}`}>{decision.titulo}</p>
                      <p className="text-sm text-muted-foreground truncate">{decision.subtitulo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="bg-transparent whitespace-nowrap">
                        {decision.accion}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de alertas por tipo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link href="/dashboard/contratos?estado=activo" className="block">
          <Card className={`hover:shadow-md transition-shadow ${data.alertas.contratosVencidos > 0 ? "border-red-200 bg-red-50/50" : ""}`}>
            <CardContent className="pt-4 text-center">
              <FileText className={`h-8 w-8 mx-auto mb-2 ${data.alertas.contratosVencidos > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              <p className="text-2xl font-bold">{data.alertas.contratosVencidos}</p>
              <p className="text-xs text-muted-foreground">Contratos por vencer</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/cobranzas" className="block">
          <Card className={`hover:shadow-md transition-shadow ${data.alertas.recibosVencidos > 0 ? "border-orange-200 bg-orange-50/50" : ""}`}>
            <CardContent className="pt-4 text-center">
              <DollarSign className={`h-8 w-8 mx-auto mb-2 ${data.alertas.recibosVencidos > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              <p className="text-2xl font-bold">{data.alertas.recibosVencidos}</p>
              <p className="text-xs text-muted-foreground">Recibos vencidos</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/crm?temperatura=caliente" className="block">
          <Card className={`hover:shadow-md transition-shadow ${data.alertas.leadsCalientes > 0 ? "border-yellow-200 bg-yellow-50/50" : ""}`}>
            <CardContent className="pt-4 text-center">
              <Flame className={`h-8 w-8 mx-auto mb-2 ${data.alertas.leadsCalientes > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
              <p className="text-2xl font-bold">{data.alertas.leadsCalientes}</p>
              <p className="text-xs text-muted-foreground">Leads calientes</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reparaciones?urgencia=urgente" className="block">
          <Card className={`hover:shadow-md transition-shadow ${data.alertas.reparacionesUrgentes > 0 ? "border-red-200 bg-red-50/50" : ""}`}>
            <CardContent className="pt-4 text-center">
              <Wrench className={`h-8 w-8 mx-auto mb-2 ${data.alertas.reparacionesUrgentes > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              <p className="text-2xl font-bold">{data.alertas.reparacionesUrgentes}</p>
              <p className="text-xs text-muted-foreground">Reparaciones urgentes</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/crm" className="block">
          <Card className={`hover:shadow-md transition-shadow ${data.alertas.leadsOlvidados > 0 ? "border-blue-200 bg-blue-50/50" : ""}`}>
            <CardContent className="pt-4 text-center">
              <Clock className={`h-8 w-8 mx-auto mb-2 ${data.alertas.leadsOlvidados > 0 ? "text-blue-500" : "text-muted-foreground"}`} />
              <p className="text-2xl font-bold">{data.alertas.leadsOlvidados}</p>
              <p className="text-xs text-muted-foreground">Leads olvidados</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
