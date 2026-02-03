"use client"

import React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { MessageSquare } from "lucide-react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Users, Plus, Filter, Search, Phone, Mail, 
  Flame, Thermometer, Snowflake, Calendar, Building,
  MoreHorizontal, Eye, Pencil, Trash2, UserPlus
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  interes: string
  temperatura: string
  estado: string
  fuente: string
  propiedad?: { id: string; direccion: string; ciudad: string }
  asignado?: { id: string; full_name: string }
  proxima_accion?: string
  fecha_proxima_accion?: string
  created_at: string
  ultima_actividad?: string
}

const estadoColors: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  contactado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  calificado: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  propuesta: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  negociacion: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  ganado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-900",
  perdido: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const temperaturaIcons: Record<string, React.ReactNode> = {
  frio: <Snowflake className="h-4 w-4 text-blue-500" />,
  tibio: <Thermometer className="h-4 w-4 text-yellow-500" />,
  caliente: <Flame className="h-4 w-4 text-red-500" />,
}

const Loading = () => null

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")
  const [temperaturaFilter, setTemperaturaFilter] = useState<string>("todos")
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false)
  const [newLead, setNewLead] = useState({
    nombre: "",
    email: "",
    telefono: "",
    interes: "alquiler",
    temperatura: "tibio",
    fuente: "web",
    notas: ""
  })
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchLeads()
  }, [estadoFilter, temperaturaFilter])

  const fetchLeads = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (estadoFilter !== "todos") params.set("estado", estadoFilter)
    if (temperaturaFilter !== "todos") params.set("temperatura", temperaturaFilter)

    const res = await fetch(`/api/admin/leads?${params}`)
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const handleCreateLead = async () => {
    const res = await fetch("/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLead)
    })

    if (res.ok) {
      setIsNewLeadOpen(false)
      setNewLead({ nombre: "", email: "", telefono: "", interes: "alquiler", temperatura: "tibio", fuente: "web", notas: "" })
      fetchLeads()
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (!confirm("¿Eliminar este lead?")) return
    await fetch(`/api/admin/leads/${id}`, { method: "DELETE" })
    fetchLeads()
  }

  const filteredLeads = leads.filter(lead => 
    lead.nombre.toLowerCase().includes(search.toLowerCase()) ||
    lead.email.toLowerCase().includes(search.toLowerCase()) ||
    lead.telefono?.includes(search)
  )

  // Estadísticas
  const stats = {
    total: leads.length,
    nuevos: leads.filter(l => l.estado === "nuevo").length,
    calientes: leads.filter(l => l.temperatura === "caliente").length,
    ganados: leads.filter(l => l.estado === "ganado").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">Gestión de leads y oportunidades</p>
        </div>
        <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Lead</DialogTitle>
              <DialogDescription>Registrar un nuevo prospecto</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nombre completo</Label>
                <Input 
                  value={newLead.nombre}
                  onChange={(e) => setNewLead({ ...newLead, nombre: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="juan@email.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Teléfono</Label>
                  <Input 
                    value={newLead.telefono}
                    onChange={(e) => setNewLead({ ...newLead, telefono: e.target.value })}
                    placeholder="+54 351 123-4567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Interés</Label>
                  <Select value={newLead.interes} onValueChange={(v) => setNewLead({ ...newLead, interes: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alquiler">Alquiler</SelectItem>
                      <SelectItem value="compra">Compra</SelectItem>
                      <SelectItem value="venta">Venta</SelectItem>
                      <SelectItem value="tasacion">Tasación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Temperatura</Label>
                  <Select value={newLead.temperatura} onValueChange={(v) => setNewLead({ ...newLead, temperatura: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frio">Frío</SelectItem>
                      <SelectItem value="tibio">Tibio</SelectItem>
                      <SelectItem value="caliente">Caliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Fuente</Label>
                  <Select value={newLead.fuente} onValueChange={(v) => setNewLead({ ...newLead, fuente: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web</SelectItem>
                      <SelectItem value="referido">Referido</SelectItem>
                      <SelectItem value="redes">Redes sociales</SelectItem>
                      <SelectItem value="portal">Portal inmobiliario</SelectItem>
                      <SelectItem value="telefono">Teléfono</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notas</Label>
                <Textarea 
                  value={newLead.notas}
                  onChange={(e) => setNewLead({ ...newLead, notas: e.target.value })}
                  placeholder="Información adicional..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewLeadOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateLead} disabled={!newLead.nombre || !newLead.email}>
                Crear Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nuevos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calientes</CardTitle>
            <Flame className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.calientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganados</CardTitle>
            <Building className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ganados}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="nuevo">Nuevo</SelectItem>
            <SelectItem value="contactado">Contactado</SelectItem>
            <SelectItem value="calificado">Calificado</SelectItem>
            <SelectItem value="propuesta">Propuesta</SelectItem>
            <SelectItem value="negociacion">Negociación</SelectItem>
            <SelectItem value="ganado">Ganado</SelectItem>
            <SelectItem value="perdido">Perdido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={temperaturaFilter} onValueChange={setTemperaturaFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Temperatura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="frio">Frío</SelectItem>
            <SelectItem value="tibio">Tibio</SelectItem>
            <SelectItem value="caliente">Caliente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Lead</th>
                  <th className="text-left p-4 font-medium">Contacto</th>
                  <th className="text-left p-4 font-medium">Interés</th>
                  <th className="text-left p-4 font-medium">Temp.</th>
                  <th className="text-left p-4 font-medium">Estado</th>
                  <th className="text-left p-4 font-medium">Próxima acción</th>
                  <th className="text-left p-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Cargando...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No hay leads
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <div className="font-medium">{lead.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {lead.fuente} · {new Date(lead.created_at).toLocaleDateString("es-AR")}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                        {lead.telefono && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.telefono}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">
                          {lead.interes}
                        </Badge>
                        {lead.propiedad && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {lead.propiedad.direccion}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {temperaturaIcons[lead.temperatura]}
                          <span className="text-sm capitalize">{lead.temperatura}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={estadoColors[lead.estado]}>
                          {lead.estado}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {lead.proxima_accion ? (
                          <div>
                            <div className="text-sm">{lead.proxima_accion}</div>
                            {lead.fecha_proxima_accion && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(lead.fecha_proxima_accion).toLocaleDateString("es-AR")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/crm/${lead.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                              </Link>
                            </DropdownMenuItem>
                            {lead.telefono && (
                              <DropdownMenuItem asChild>
                                <a 
                                  href={`https://wa.me/${lead.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
                                    `Hola ${lead.nombre.split(" ")[0]}! Soy de Sigma Inmobiliaria. ${
                                      lead.interes === "alquiler" 
                                        ? "Te contacto por tu consulta sobre alquiler" 
                                        : lead.interes === "compra"
                                        ? "Te contacto por tu interés en comprar una propiedad"
                                        : lead.interes === "venta"
                                        ? "Te contacto por tu consulta sobre vender tu propiedad"
                                        : "Te contacto por tu consulta"
                                    }${lead.propiedad ? ` de ${lead.propiedad.direccion}` : ""}. ¿Cómo puedo ayudarte?`
                                  )}`} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600"
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  WhatsApp
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/crm/${lead.id}/editar`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { Loading }
