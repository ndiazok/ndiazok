"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  Send,
  ClipboardCheck,
  Calendar,
  Home,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"

interface Inspection {
  id: string
  tipo: "entrada" | "salida" | "periodica"
  estado: string
  fecha_programada: string
  hora_programada: string | null
  fecha_realizacion: string | null
  propiedad: {
    id: string
    direccion: string
    ciudad: string
    tipo: string
  }
  inspector: {
    id: string
    full_name: string
  } | null
  items: any[]
}

const estadoConfig: Record<string, { label: string; color: string; icon: any }> = {
  programada: { label: "Programada", color: "bg-blue-100 text-blue-700", icon: Calendar },
  en_progreso: { label: "En Progreso", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  completada: { label: "Completada", color: "bg-purple-100 text-purple-700", icon: ClipboardCheck },
  pendiente_firmas: { label: "Pendiente Firmas", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
  firmada: { label: "Firmada", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700", icon: AlertCircle },
}

const tipoLabels: Record<string, string> = {
  entrada: "Entrada",
  salida: "Salida",
  periodica: "Periódica",
}

export default function InspeccionesPage() {
  const router = useRouter()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<string>("all")
  const [filterEstado, setFilterEstado] = useState<string>("all")

  useEffect(() => {
    fetchInspections()
  }, [])

  const fetchInspections = async () => {
    try {
      const res = await fetch("/api/admin/inspections")
      if (res.ok) {
        const data = await res.json()
        setInspections(data)
      }
    } catch (error) {
      console.error("Error fetching inspections:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInspections = inspections.filter((insp) => {
    const matchesSearch =
      insp.propiedad?.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insp.propiedad?.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = filterTipo === "all" || insp.tipo === filterTipo
    const matchesEstado = filterEstado === "all" || insp.estado === filterEstado
    return matchesSearch && matchesTipo && matchesEstado
  })

  const stats = {
    total: inspections.length,
    programadas: inspections.filter((i) => i.estado === "programada").length,
    pendientesFirma: inspections.filter((i) => i.estado === "pendiente_firmas").length,
    completadas: inspections.filter((i) => i.estado === "firmada").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inspecciones</h1>
          <p className="text-muted-foreground">
            Gestiona las inspecciones de entrada, salida y periódicas
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/inspecciones/nueva")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Inspección
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Programadas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.programadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes Firma</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendientesFirma}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por dirección o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="periodica">Periódica</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="pendiente_firmas">Pendiente Firmas</SelectItem>
                <SelectItem value="firmada">Firmada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredInspections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No hay inspecciones</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterTipo !== "all" || filterEstado !== "all"
                  ? "No se encontraron inspecciones con los filtros aplicados"
                  : "Crea tu primera inspección para comenzar"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.map((inspection) => {
                  const estadoInfo = estadoConfig[inspection.estado] || estadoConfig.programada
                  const EstadoIcon = estadoInfo.icon
                  return (
                    <TableRow key={inspection.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{inspection.propiedad?.direccion}</p>
                            <p className="text-sm text-muted-foreground">
                              {inspection.propiedad?.ciudad}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tipoLabels[inspection.tipo]}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{new Date(inspection.fecha_programada).toLocaleDateString("es-AR")}</p>
                          {inspection.hora_programada && (
                            <p className="text-sm text-muted-foreground">
                              {inspection.hora_programada}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {inspection.inspector?.full_name || (
                          <span className="text-muted-foreground">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {inspection.items?.length || 0} items
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={estadoInfo.color}>
                          <EstadoIcon className="h-3 w-3 mr-1" />
                          {estadoInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/inspecciones/${inspection.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            {inspection.estado === "programada" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/inspecciones/${inspection.id}/realizar`)
                                }
                              >
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Realizar inspección
                              </DropdownMenuItem>
                            )}
                            {(inspection.estado === "completada" ||
                              inspection.estado === "pendiente_firmas") && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/inspecciones/${inspection.id}/firmas`)
                                }
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Enviar para firma
                              </DropdownMenuItem>
                            )}
                            {inspection.estado === "firmada" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/inspecciones/${inspection.id}/pdf`)
                                }
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Descargar PDF
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
