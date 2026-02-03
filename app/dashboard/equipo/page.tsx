"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Building2,
  FileText,
  Target,
  TrendingUp,
  Calendar,
  Trophy,
  Award,
  Medal,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

interface CollaboratorStats {
  collaborators: Array<{
    id: string
    full_name: string
    email: string
    role: string
    metrics: {
      propertiesCreated: number
      contractsCreated: number
      contractsActive: number
      totalContractValue: number
      leadsAssigned: number
      leadsWon: number
      leadsLost: number
      leadsActive: number
      conversionRate: number
      appointments: number
      appointmentsCompleted: number
      repairs: number
      activityCount: number
    }
    score: number
  }>
  teamTotals: {
    propertiesCreated: number
    contractsCreated: number
    contractsActive: number
    totalContractValue: number
    leadsAssigned: number
    leadsWon: number
    appointments: number
    avgConversionRate: number
  }
}

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  agente: "bg-blue-100 text-blue-800",
  administrativo: "bg-green-100 text-green-800",
}

export default function TeamPerformancePage() {
  const [data, setData] = useState<CollaboratorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCollab, setSelectedCollab] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/admin/collaborators/stats")
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (json.collaborators.length > 0) {
          setSelectedCollab(json.collaborators[0].id)
        }
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

  const { collaborators, teamTotals } = data
  const selected = collaborators.find(c => c.id === selectedCollab)

  const rankIcons = [
    <Trophy key="1" className="h-6 w-6 text-amber-500" />,
    <Award key="2" className="h-6 w-6 text-gray-400" />,
    <Medal key="3" className="h-6 w-6 text-amber-700" />,
  ]

  const chartData = collaborators.map(c => ({
    name: c.full_name?.split(" ")[0] || "N/A",
    propiedades: c.metrics.propertiesCreated,
    contratos: c.metrics.contractsCreated,
    leads: c.metrics.leadsWon,
    citas: c.metrics.appointmentsCompleted,
  }))

  const radarData = selected ? [
    { metric: "Propiedades", value: selected.metrics.propertiesCreated, max: Math.max(...collaborators.map(c => c.metrics.propertiesCreated)) || 1 },
    { metric: "Contratos", value: selected.metrics.contractsCreated, max: Math.max(...collaborators.map(c => c.metrics.contractsCreated)) || 1 },
    { metric: "Leads", value: selected.metrics.leadsWon, max: Math.max(...collaborators.map(c => c.metrics.leadsWon)) || 1 },
    { metric: "Conversión", value: selected.metrics.conversionRate, max: 100 },
    { metric: "Citas", value: selected.metrics.appointmentsCompleted, max: Math.max(...collaborators.map(c => c.metrics.appointmentsCompleted)) || 1 },
  ].map(d => ({ ...d, normalized: (d.value / d.max) * 100 })) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance del Equipo</h1>
        <p className="text-muted-foreground">Métricas y rendimiento de colaboradores</p>
      </div>

      {/* Team Totals */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamTotals.propertiesCreated}</div>
            <p className="text-xs text-muted-foreground">Cargadas por el equipo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamTotals.contractsActive}</div>
            <p className="text-xs text-muted-foreground">{teamTotals.contractsCreated} creados en total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads Ganados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamTotals.leadsWon}</div>
            <p className="text-xs text-muted-foreground">de {teamTotals.leadsAssigned} asignados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversión Prom.</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamTotals.avgConversionRate.toFixed(1)}%</div>
            <Progress value={teamTotals.avgConversionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ranking">
        <TabsList>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="comparativa">Comparativa</TabsTrigger>
          <TabsTrigger value="detalle">Detalle Individual</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Ranking de Colaboradores
              </CardTitle>
              <CardDescription>Ordenado por puntuación de rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collaborators.map((collab, i) => (
                  <div 
                    key={collab.id} 
                    className={`flex items-center gap-4 p-4 rounded-lg border ${i < 3 ? "bg-muted/50" : ""}`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      {i < 3 ? rankIcons[i] : (
                        <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>
                      )}
                    </div>
                    <Avatar>
                      <AvatarFallback>
                        {collab.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{collab.full_name}</span>
                        <Badge className={roleColors[collab.role] || ""}>{collab.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{collab.email}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-6 text-center">
                      <div>
                        <p className="text-lg font-bold">{collab.metrics.propertiesCreated}</p>
                        <p className="text-xs text-muted-foreground">Propiedades</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{collab.metrics.contractsCreated}</p>
                        <p className="text-xs text-muted-foreground">Contratos</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{collab.metrics.leadsWon}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{collab.metrics.conversionRate.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">Conversión</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{collab.score}</p>
                      <p className="text-xs text-muted-foreground">puntos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativa">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Rendimiento</CardTitle>
              <CardDescription>Métricas por colaborador</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="propiedades" name="Propiedades" fill="#3b82f6" />
                    <Bar dataKey="contratos" name="Contratos" fill="#22c55e" />
                    <Bar dataKey="leads" name="Leads Ganados" fill="#f59e0b" />
                    <Bar dataKey="citas" name="Citas" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalle">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Seleccionar Colaborador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCollab === collab.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedCollab(collab.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={selectedCollab === collab.id ? "bg-primary-foreground text-primary" : ""}>
                          {collab.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{collab.full_name}</p>
                        <p className={`text-xs ${selectedCollab === collab.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {collab.role}
                        </p>
                      </div>
                      <span className="font-bold">{collab.score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selected && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {selected.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {selected.full_name}
                  </CardTitle>
                  <CardDescription>{selected.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar
                            name="Rendimiento"
                            dataKey="normalized"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.5}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Propiedades</p>
                          <p className="text-2xl font-bold">{selected.metrics.propertiesCreated}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Contratos</p>
                          <p className="text-2xl font-bold">{selected.metrics.contractsCreated}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Leads Ganados</p>
                          <p className="text-2xl font-bold text-green-600">{selected.metrics.leadsWon}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Conversión</p>
                          <p className="text-2xl font-bold">{selected.metrics.conversionRate.toFixed(1)}%</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Citas Completadas</p>
                          <p className="text-2xl font-bold">{selected.metrics.appointmentsCompleted}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Reparaciones</p>
                          <p className="text-2xl font-bold">{selected.metrics.repairs}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Puntuación Total</p>
                        <p className="text-4xl font-bold text-primary">{selected.score}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
