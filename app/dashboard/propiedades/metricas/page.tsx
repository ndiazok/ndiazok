"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Eye, 
  MessageSquare, 
  Calendar, 
  BookCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Building2,
  Filter,
  ArrowUpRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PropertyMetric {
  id: string
  direccion: string
  ciudad: string
  tipo: string
  en_venta: boolean
  en_alquiler: boolean
  precio_venta: number | null
  precio_alquiler: number | null
  dias_en_mercado: number
  visitas_web: number
  consultas: number
  visitas_presenciales: number
  reservas: number
  conversion_consulta: number
  conversion_visita: number
  conversion_reserva: number
  alerta: string | null
}

export default function PropertyMetricsPage() {
  const [metrics, setMetrics] = useState<PropertyMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [alertFilter, setAlertFilter] = useState<string>("all")

  useEffect(() => {
    fetchMetrics()
  }, [alertFilter])

  async function fetchMetrics() {
    setLoading(true)
    try {
      const url = alertFilter !== "none" 
        ? `/api/admin/properties/metrics?alert=${alertFilter}`
        : "/api/admin/properties/metrics"
      const res = await fetch(url)
      const data = await res.json()
      setMetrics(data)
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  const alertCounts = {
    estancada: metrics.filter(m => m.alerta === "estancada").length,
    sin_visitas: metrics.filter(m => m.alerta === "sin_visitas").length,
    sin_cierre: metrics.filter(m => m.alerta === "sin_cierre").length,
  }

  const totals = {
    visitas: metrics.reduce((sum, m) => sum + m.visitas_web, 0),
    consultas: metrics.reduce((sum, m) => sum + m.consultas, 0),
    showings: metrics.reduce((sum, m) => sum + m.visitas_presenciales, 0),
    reservas: metrics.reduce((sum, m) => sum + m.reservas, 0),
  }

  const avgConversion = metrics.length > 0 ? {
    consulta: (metrics.reduce((sum, m) => sum + Number(m.conversion_consulta), 0) / metrics.length).toFixed(1),
    visita: (metrics.reduce((sum, m) => sum + Number(m.conversion_visita), 0) / metrics.length).toFixed(1),
    reserva: (metrics.reduce((sum, m) => sum + Number(m.conversion_reserva), 0) / metrics.length).toFixed(1),
  } : { consulta: 0, visita: 0, reserva: 0 }

  function getAlertBadge(alerta: string | null) {
    if (!alerta) return null
    const config: Record<string, { label: string; variant: "destructive" | "warning" | "secondary" }> = {
      estancada: { label: "Estancada", variant: "destructive" },
      sin_visitas: { label: "Sin visitas", variant: "warning" },
      sin_cierre: { label: "Sin cierre", variant: "secondary" },
    }
    const cfg = config[alerta]
    if (!cfg) return null
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Métricas de Propiedades</h1>
          <p className="text-muted-foreground">
            Funnel de conversión y alertas de propiedades publicadas
          </p>
        </div>
        <Link href="/dashboard/propiedades">
          <Button variant="outline">
            <Building2 className="mr-2 h-4 w-4" />
            Ver propiedades
          </Button>
        </Link>
      </div>

      {/* Funnel Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visitas Web
            </CardDescription>
            <CardTitle className="text-3xl">{totals.visitas}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">100% del funnel</div>
            <Progress value={100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Consultas
            </CardDescription>
            <CardTitle className="text-3xl">{totals.consultas}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {avgConversion.consulta}% conversión promedio
            </div>
            <Progress 
              value={totals.visitas > 0 ? (totals.consultas / totals.visitas) * 100 : 0} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Visitas Presenciales
            </CardDescription>
            <CardTitle className="text-3xl">{totals.showings}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {avgConversion.visita}% conversión promedio
            </div>
            <Progress 
              value={totals.consultas > 0 ? (totals.showings / totals.consultas) * 100 : 0} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookCheck className="h-4 w-4" />
              Reservas
            </CardDescription>
            <CardTitle className="text-3xl">{totals.reservas}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {avgConversion.reserva}% conversión promedio
            </div>
            <Progress 
              value={totals.showings > 0 ? (totals.reservas / totals.showings) * 100 : 0} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className={`cursor-pointer transition-colors ${alertFilter === "estancada" ? "ring-2 ring-destructive" : ""}`}
          onClick={() => setAlertFilter(alertFilter === "estancada" ? "all" : "estancada")}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Propiedades Estancadas
            </CardDescription>
            <CardTitle className="text-2xl">{alertCounts.estancada}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Más de 90 días sin reservas
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${alertFilter === "sin_visitas" ? "ring-2 ring-yellow-500" : ""}`}
          onClick={() => setAlertFilter(alertFilter === "sin_visitas" ? "all" : "sin_visitas")}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-yellow-600">
              <TrendingDown className="h-4 w-4" />
              Sin Visitas
            </CardDescription>
            <CardTitle className="text-2xl">{alertCounts.sin_visitas}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Más de 30 días con pocas visitas web
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${alertFilter === "sin_cierre" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setAlertFilter(alertFilter === "sin_cierre" ? "all" : "sin_cierre")}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sin Cierre
            </CardDescription>
            <CardTitle className="text-2xl">{alertCounts.sin_cierre}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Muchas visitas presenciales pero sin reservas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={alertFilter} onValueChange={setAlertFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por alerta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Todas las propiedades</SelectItem>
            <SelectItem value="all">Con alertas</SelectItem>
            <SelectItem value="estancada">Estancadas</SelectItem>
            <SelectItem value="sin_visitas">Sin visitas</SelectItem>
            <SelectItem value="sin_cierre">Sin cierre</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {metrics.length} propiedades
        </span>
      </div>

      {/* Properties Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propiedad</TableHead>
                <TableHead className="text-center">Días</TableHead>
                <TableHead className="text-center">Visitas</TableHead>
                <TableHead className="text-center">Consultas</TableHead>
                <TableHead className="text-center">Showings</TableHead>
                <TableHead className="text-center">Reservas</TableHead>
                <TableHead className="text-center">Conv.</TableHead>
                <TableHead>Alerta</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Cargando métricas...
                  </TableCell>
                </TableRow>
              ) : metrics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No hay propiedades publicadas
                  </TableCell>
                </TableRow>
              ) : (
                metrics.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{prop.direccion}</p>
                        <p className="text-sm text-muted-foreground">
                          {prop.ciudad} · {prop.tipo}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {prop.en_venta && (
                            <Badge variant="outline" className="text-xs">Venta</Badge>
                          )}
                          {prop.en_alquiler && (
                            <Badge variant="outline" className="text-xs">Alquiler</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {prop.dias_en_mercado}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{prop.visitas_web}</TableCell>
                    <TableCell className="text-center">{prop.consultas}</TableCell>
                    <TableCell className="text-center">{prop.visitas_presenciales}</TableCell>
                    <TableCell className="text-center font-medium">{prop.reservas}</TableCell>
                    <TableCell className="text-center">
                      <div className="text-xs space-y-0.5">
                        <div>{prop.conversion_consulta}%</div>
                        <div className="text-muted-foreground">{prop.conversion_visita}%</div>
                      </div>
                    </TableCell>
                    <TableCell>{getAlertBadge(prop.alerta)}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/propiedades/${prop.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
