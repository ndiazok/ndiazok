"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { TrendingUp, Building2, FileText, AlertTriangle } from "lucide-react"

interface ChartData {
  mes: string
  ingresos: number
  cobrado: number
  egresos: number
}

interface PropertyStats {
  total: number
  enAlquiler: number
  enVenta: number
  enAdministracion: number
  ocupadas: number
  disponibles: number
}

interface ContractStats {
  total: number
  borradores: number
  activos: number
  finalizados: number
  porVencer: number
}

interface MorosidadStats {
  totalPendiente: number
  cantidadPendiente: number
  vencidos: number
  montoVencido: number
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"]

export function FinancialCharts() {
  const [data, setData] = useState<{
    chartData: ChartData[]
    propertyStats: PropertyStats
    contractStats: ContractStats
    morosidadStats: MorosidadStats
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/finance/stats")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error("Error fetching chart data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[200px] bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const propertyPieData = [
    { name: "Ocupadas", value: data.propertyStats.ocupadas, color: "#10b981" },
    { name: "Disponibles", value: data.propertyStats.disponibles, color: "#f59e0b" },
  ].filter((d) => d.value > 0)

  const contractPieData = [
    { name: "Activos", value: data.contractStats.activos, color: "#10b981" },
    { name: "Borradores", value: data.contractStats.borradores, color: "#6366f1" },
    { name: "Finalizados", value: data.contractStats.finalizados, color: "#94a3b8" },
  ].filter((d) => d.value > 0)

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Ocupación</p>
                <p className="text-2xl font-bold">
                  {data.propertyStats.total > 0
                    ? Math.round((data.propertyStats.ocupadas / data.propertyStats.total) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 p-3">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.propertyStats.ocupadas} de {data.propertyStats.total} propiedades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contratos Activos</p>
                <p className="text-2xl font-bold">{data.contractStats.activos}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{data.contractStats.porVencer} próximos a vencer</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Morosidad</p>
                <p className="text-2xl font-bold">{formatCurrency(data.morosidadStats.montoVencido)}</p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{data.morosidadStats.vencidos} recibos vencidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Cobro</p>
                <p className="text-2xl font-bold">
                  {data.chartData.length > 0 && data.chartData[data.chartData.length - 1].ingresos > 0
                    ? Math.round(
                        (data.chartData[data.chartData.length - 1].cobrado /
                          data.chartData[data.chartData.length - 1].ingresos) *
                          100,
                      )
                    : 0}
                  %
                </p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Último mes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ingresos vs Cobrado (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  tickFormatter={formatCurrency}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString("es-AR")}`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="ingresos" name="Facturado" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cobrado" name="Cobrado" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Estado de Propiedades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={propertyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {propertyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {propertyPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Evolución de Cobranzas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                tickFormatter={formatCurrency}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString("es-AR")}`, ""]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ingresos"
                name="Facturado"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1" }}
              />
              <Line
                type="monotone"
                dataKey="cobrado"
                name="Cobrado"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981" }}
              />
              <Line
                type="monotone"
                dataKey="egresos"
                name="Liquidado"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
