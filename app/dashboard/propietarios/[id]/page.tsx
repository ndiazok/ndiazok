"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Percent,
  Home,
  FileText,
  Phone,
  Mail,
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
  Legend,
} from "recharts"

interface OwnerMetrics {
  owner: { id: string; full_name: string; email: string; phone: string }
  properties: Array<{
    id: string
    direccion: string
    ciudad: string
    tipo: string
    en_alquiler: boolean
    precio_alquiler: number
    ownership_percentage: number
  }>
  metrics: {
    totalProperties: number
    propertiesInRent: number
    propertiesRented: number
    occupancyRate: number
    collectionRate: number
    totalIncome: number
    totalFees: number
    totalDeductions: number
    netIncome: number
  }
  monthlyIncome: Array<{
    periodo: string
    bruto: number
    neto: number
    honorarios: number
    deducciones: number
    estado: string
  }>
  pendingLiquidations: Array<{ id: string; monto_neto: number; estado: string }>
  recommendations: Array<{ type: string; title: string; description: string }>
  contracts: Array<{ id: string; propiedad_id: string; monto_alquiler: number }>
}

export default function OwnerDashboardPage() {
  const params = useParams()
  const [data, setData] = useState<OwnerMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/admin/owners/${params.id}/metrics`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
      setLoading(false)
    }
    fetchData()
  }, [params.id])

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

  if (!data) {
    return <div>Propietario no encontrado</div>
  }

  const { owner, properties, metrics, monthlyIncome, recommendations, contracts } = data

  const recIcons: Record<string, React.ReactNode> = {
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    alert: <AlertTriangle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/clientes"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{owner.full_name}</h1>
          <p className="text-muted-foreground">Dashboard de propietario</p>
        </div>
        <div className="flex items-center gap-2">
          {owner.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${owner.phone}`}><Phone className="mr-2 h-4 w-4" />Llamar</a>
            </Button>
          )}
          {owner.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${owner.email}`}><Mail className="mr-2 h-4 w-4" />Email</a>
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProperties}</div>
            <p className="text-xs text-muted-foreground">{metrics.propertiesInRent} en alquiler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.occupancyRate.toFixed(0)}%</div>
            <Progress value={metrics.occupancyRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Cobro</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.collectionRate.toFixed(0)}%</div>
            <Progress value={metrics.collectionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.netIncome.toLocaleString("es-AR")}</div>
            <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recomendaciones
            </CardTitle>
            <CardDescription>Sugerencias basadas en el análisis de datos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  {recIcons[rec.type]}
                  <div>
                    <p className="font-medium">{rec.title}</p>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="propiedades">
        <TabsList>
          <TabsTrigger value="propiedades">Propiedades</TabsTrigger>
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="propiedades" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((prop) => {
              const contract = contracts.find(c => c.propiedad_id === prop.id)
              const isRented = !!contract

              return (
                <Card key={prop.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{prop.direccion}</CardTitle>
                      <Badge variant={isRented ? "default" : "secondary"}>
                        {isRented ? "Alquilada" : "Disponible"}
                      </Badge>
                    </div>
                    <CardDescription>{prop.ciudad} - {prop.tipo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Participación</span>
                        <span className="font-medium">{prop.ownership_percentage}%</span>
                      </div>
                      {prop.en_alquiler && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Precio alquiler</span>
                          <span className="font-medium">${prop.precio_alquiler?.toLocaleString("es-AR")}</span>
                        </div>
                      )}
                      {contract && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Renta actual</span>
                          <span className="font-medium text-green-600">${contract.monto_alquiler?.toLocaleString("es-AR")}</span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent" asChild>
                      <Link href={`/dashboard/propiedades/${prop.id}`}>Ver propiedad</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="ingresos">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Ingresos</CardTitle>
              <CardDescription>Últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyIncome.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyIncome}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString("es-AR")}`}
                      />
                      <Legend />
                      <Bar dataKey="bruto" name="Bruto" fill="#3b82f6" />
                      <Bar dataKey="neto" name="Neto" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay datos de ingresos</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Ingresos Brutos</p>
                  <p className="text-xl font-bold text-blue-600">${metrics.totalIncome.toLocaleString("es-AR")}</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Honorarios</p>
                  <p className="text-xl font-bold text-amber-600">-${metrics.totalFees.toLocaleString("es-AR")}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Deducciones</p>
                  <p className="text-xl font-bold text-red-600">-${metrics.totalDeductions.toLocaleString("es-AR")}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Neto</p>
                  <p className="text-xl font-bold text-green-600">${metrics.netIncome.toLocaleString("es-AR")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contratos">
          <Card>
            <CardHeader>
              <CardTitle>Contratos Activos</CardTitle>
              <CardDescription>{contracts.length} contrato(s) vigente(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay contratos activos</p>
              ) : (
                <div className="space-y-4">
                  {contracts.map((contract) => {
                    const prop = properties.find(p => p.id === contract.propiedad_id)
                    return (
                      <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{prop?.direccion || "Propiedad"}</p>
                          <p className="text-sm text-muted-foreground">{prop?.ciudad}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">${contract.monto_alquiler?.toLocaleString("es-AR")}/mes</p>
                          <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                            <Link href={`/dashboard/contratos/${contract.id}`}>Ver contrato</Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
