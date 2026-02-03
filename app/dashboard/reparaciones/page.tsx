"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { 
  Wrench, Plus, Search, Filter, AlertTriangle, Clock, 
  CheckCircle, XCircle, ArrowRight, Building2, User
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

interface Reparacion {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  urgencia: string
  estado: string
  fecha_solicitud: string
  presupuesto_estimado: number | null
  costo_final: number | null
  moneda: string
  proveedor_nombre: string | null
  propiedad: {
    direccion: string
    ciudad: string
  }
  solicitante: {
    full_name: string
    email: string
  } | null
}

const CATEGORIAS = [
  { value: "plomeria", label: "Plomería" },
  { value: "electricidad", label: "Electricidad" },
  { value: "gas", label: "Gas" },
  { value: "cerrajeria", label: "Cerrajería" },
  { value: "pintura", label: "Pintura" },
  { value: "humedad", label: "Humedad" },
  { value: "electrodomesticos", label: "Electrodomésticos" },
  { value: "estructura", label: "Estructura" },
  { value: "otro", label: "Otro" },
]

const Loading = () => null

export default function ReparacionesPage() {
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [categoriaFilter, setCategoriaFilter] = useState("todas")
  const [urgenciaFilter, setUrgenciaFilter] = useState("todas")
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchReparaciones()
  }, [])

  const fetchReparaciones = async () => {
    const res = await fetch("/api/admin/repairs")
    if (res.ok) {
      const data = await res.json()
      setReparaciones(data)
    }
    setIsLoading(false)
  }

  const filteredReparaciones = reparaciones.filter((rep) => {
    const matchesSearch =
      rep.titulo.toLowerCase().includes(search.toLowerCase()) ||
      rep.propiedad.direccion.toLowerCase().includes(search.toLowerCase()) ||
      (rep.solicitante?.full_name || "").toLowerCase().includes(search.toLowerCase())
    
    const matchesEstado = estadoFilter === "todos" || rep.estado === estadoFilter
    const matchesCategoria = categoriaFilter === "todas" || rep.categoria === categoriaFilter
    const matchesUrgencia = urgenciaFilter === "todas" || rep.urgencia === urgenciaFilter

    return matchesSearch && matchesEstado && matchesCategoria && matchesUrgencia
  })

  const stats = {
    pendientes: reparaciones.filter((r) => r.estado === "pendiente").length,
    enProceso: reparaciones.filter((r) => r.estado === "en_proceso").length,
    completadas: reparaciones.filter((r) => r.estado === "completada").length,
    urgentes: reparaciones.filter((r) => r.urgencia === "urgente" && r.estado !== "completada").length,
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>
      case "aprobada":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Aprobada</Badge>
      case "en_proceso":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">En proceso</Badge>
      case "completada":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completada</Badge>
      case "rechazada":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazada</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getUrgenciaBadge = (urgencia: string) => {
    switch (urgencia) {
      case "baja":
        return <Badge variant="secondary" className="bg-slate-100">Baja</Badge>
      case "media":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Media</Badge>
      case "alta":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Alta</Badge>
      case "urgente":
        return <Badge variant="destructive">Urgente</Badge>
      default:
        return <Badge variant="secondary">{urgencia}</Badge>
    }
  }

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return "-"
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Suspense fallback={<Loading />}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Casos Técnicos</h1>
              <p className="text-muted-foreground">Gestión de reparaciones y mantenimiento</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/reparaciones/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Nueva reparación
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pendientes}</p>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Wrench className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.enProceso}</p>
                    <p className="text-sm text-muted-foreground">En proceso</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completadas}</p>
                    <p className="text-sm text-muted-foreground">Completadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.urgentes}</p>
                    <p className="text-sm text-muted-foreground">Urgentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, dirección o solicitante..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aprobada">Aprobada</SelectItem>
                    <SelectItem value="en_proceso">En proceso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="rechazada">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={urgenciaFilter} onValueChange={setUrgenciaFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Urgencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caso</TableHead>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Urgencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Presupuesto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReparaciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay casos técnicos que coincidan con los filtros</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReparaciones.map((rep) => (
                      <TableRow key={rep.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rep.titulo}</p>
                            {rep.solicitante && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {rep.solicitante.full_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{rep.propiedad.direccion}</p>
                              <p className="text-xs text-muted-foreground">{rep.propiedad.ciudad}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{rep.categoria}</span>
                        </TableCell>
                        <TableCell>{getUrgenciaBadge(rep.urgencia)}</TableCell>
                        <TableCell>{getEstadoBadge(rep.estado)}</TableCell>
                        <TableCell>
                          {rep.costo_final 
                            ? formatCurrency(rep.costo_final, rep.moneda)
                            : rep.presupuesto_estimado 
                              ? <span className="text-muted-foreground">{formatCurrency(rep.presupuesto_estimado, rep.moneda)}</span>
                              : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(rep.fecha_solicitud).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/reparaciones/${rep.id}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </Suspense>
  )
}
