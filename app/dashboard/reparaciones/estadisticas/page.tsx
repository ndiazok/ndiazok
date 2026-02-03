"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"

interface RepairStats {
  overview: {
    totalRepairs: number
    completedRepairs: number
    pendingRepairs: number
    inProgressRepairs: number
    urgentRepairs: number
    completionRate: number
  }
  sla: {
    avgCompletionDays: number
    complianceRate: number
    target: number
  }
  byCategory: Array<{ name: string; total: number; completed: number }>
  byUrgency: Record<string, number>
  byResponsibility: Record<string, number>
  providerRanking: Array<{
    name: string
    total: number
    completed: number
    avgCost: number
    completionRate: number
  }>
  costs: { total: number; budget: number; variance: number }
  monthlyTrend: Array<{ month: string; total: number; completed: number; cost: number }>
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export default function RepairStatsPage() {
  const [data, setData] = useState<RepairStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/admin/repairs/stats")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="h-20 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { overview, sla, byCategory, byUrgency, providerRanking, costs, monthlyTrend } = data

  const urgencyData = Object.entries(byUrgency).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/reparaciones"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Estadísticas de Reparaciones</h1>
          <p className="text-muted-foreground">KPIs, SLA y ranking de profesionales</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalRepairs}</div>
            <p className="text-xs text-muted-foreground">Casos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overview.completedRepairs}</div>
            <Progress value={overview.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overview.inProgressRepairs}</div>
            <p className="text-xs text-muted-foreground">{overview.pendingRepairs} pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overview.urgentRepairs}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costs.total.toLocaleString("es-AR")}</div>
            <p className={`text-xs ${costs.variance > 0 ? "text-red-500" : "text-green-500"}`}>
              {costs.variance > 0 ? "+" : ""}{costs.variance.toFixed(1)}% vs presupuesto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            SLA - Acuerdo de Nivel de Servicio
          </CardTitle>
          <CardDescription>Objetivo: resolver en {sla.target} días</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
              <p className="text-3xl font-bold">{sla.avgCompletionDays.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">días</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Cumplimiento SLA</p>
              <p className={`text-3xl font-bold ${sla.complianceRate >= 80 ? "text-green-600" : "text-amber-600"}`}>
                {sla.complianceRate.toFixed(0)}%
              </p>
              <Progress value={sla.complianceRate} className="mt-2" />
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Objetivo</p>
              <p className="text-3xl font-bold">{sla.target}</p>
              <p className="text-sm text-muted-foreground">días máximo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tendencia">
        <TabsList>
          <TabsTrigger value="tendencia">Tendencia</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoría</TabsTrigger>
          <TabsTrigger value="profesionales">Profesionales</TabsTrigger>
        </TabsList>

        <TabsContent value="tendencia">
          <Card>
            <CardHeader>
              <CardTitle>Evolución Mensual</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="total" name="Reportados" stroke="#3b82f6" />
                    <Line yAxisId="left" type="monotone" dataKey="completed" name="Completados" stroke="#22c55e" />
                    <Line yAxisId="right" type="monotone" dataKey="cost" name="Costo" stroke="#f59e0b" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Por Urgencia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={urgencyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {urgencyData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por Responsable de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.byResponsibility).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize">{key}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(value / overview.totalRepairs) * 100} className="w-32" />
                        <span className="text-sm font-medium w-8">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categorias">
          <Card>
            <CardHeader>
              <CardTitle>Reparaciones por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total" fill="#3b82f6" />
                    <Bar dataKey="completed" name="Completados" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profesionales">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ranking de Profesionales
              </CardTitle>
              <CardDescription>Ordenado por trabajos completados</CardDescription>
            </CardHeader>
            <CardContent>
              {providerRanking.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay datos de profesionales</p>
              ) : (
                <div className="space-y-4">
                  {providerRanking.map((provider, i) => (
                    <div key={provider.name} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-muted"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {provider.completed} de {provider.total} trabajos completados
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={provider.completionRate >= 80 ? "default" : "secondary"}>
                          {provider.completionRate.toFixed(0)}% efectividad
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Costo prom: ${provider.avgCost.toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
