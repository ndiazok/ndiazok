"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Phone,
  Check,
  X,
  Building2,
} from "lucide-react"
import Link from "next/link"

interface Appointment {
  id: string
  tipo: string
  titulo: string
  descripcion: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  propiedad?: { id: string; direccion: string; ciudad: string }
  cliente?: { id: string; full_name: string; email: string; phone: string }
  asignado?: { id: string; full_name: string }
  notas: string
}

const tipoColors: Record<string, string> = {
  visita: "bg-blue-100 text-blue-800",
  reunion: "bg-purple-100 text-purple-800",
  entrega_llaves: "bg-green-100 text-green-800",
  firma: "bg-amber-100 text-amber-800",
  reparacion: "bg-orange-100 text-orange-800",
  tasacion: "bg-pink-100 text-pink-800",
  otro: "bg-gray-100 text-gray-800",
}

const estadoColors: Record<string, string> = {
  programado: "bg-blue-100 text-blue-800",
  confirmado: "bg-green-100 text-green-800",
  completado: "bg-gray-100 text-gray-800",
  cancelado: "bg-red-100 text-red-800",
  reprogramado: "bg-amber-100 text-amber-800",
}

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"dia" | "semana">("semana")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [properties, setProperties] = useState<Array<{ id: string; direccion: string; ciudad: string }>>([])
  const [clients, setClients] = useState<Array<{ id: string; full_name: string }>>([])

  const [newAppointment, setNewAppointment] = useState({
    tipo: "visita",
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    hora_inicio: "10:00",
    hora_fin: "11:00",
    propiedad_id: "",
    cliente_id: "",
    notas: "",
  })

  useEffect(() => {
    fetchAppointments()
    fetchProperties()
    fetchClients()
  }, [currentDate, viewMode])

  async function fetchAppointments() {
    setLoading(true)
    const params = new URLSearchParams()
    
    if (viewMode === "dia") {
      params.set("fecha", currentDate.toISOString().split("T")[0])
    } else {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      params.set("semana", startOfWeek.toISOString().split("T")[0])
    }

    const res = await fetch(`/api/admin/appointments?${params}`)
    if (res.ok) {
      const data = await res.json()
      setAppointments(data)
    }
    setLoading(false)
  }

  async function fetchProperties() {
    const res = await fetch("/api/admin/properties?limit=100")
    if (res.ok) {
      const data = await res.json()
      setProperties(data.data || data)
    }
  }

  async function fetchClients() {
    const res = await fetch("/api/admin/clients?limit=100")
    if (res.ok) {
      const data = await res.json()
      setClients(data.data || data)
    }
  }

  async function handleCreateAppointment() {
    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAppointment),
    })

    if (res.ok) {
      setIsDialogOpen(false)
      setNewAppointment({
        tipo: "visita",
        titulo: "",
        descripcion: "",
        fecha: new Date().toISOString().split("T")[0],
        hora_inicio: "10:00",
        hora_fin: "11:00",
        propiedad_id: "",
        cliente_id: "",
        notas: "",
      })
      fetchAppointments()
    }
  }

  async function handleUpdateStatus(id: string, estado: string) {
    await fetch(`/api/admin/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    })
    fetchAppointments()
  }

  function navigateDate(direction: number) {
    const newDate = new Date(currentDate)
    if (viewMode === "dia") {
      newDate.setDate(currentDate.getDate() + direction)
    } else {
      newDate.setDate(currentDate.getDate() + direction * 7)
    }
    setCurrentDate(newDate)
  }

  function getWeekDays() {
    const days = []
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  function getAppointmentsForDay(date: Date) {
    const dateStr = date.toISOString().split("T")[0]
    return appointments.filter(a => a.fecha === dateStr)
  }

  const weekDays = getWeekDays()
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Gestión de turnos y citas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Programar cita</DialogTitle>
              <DialogDescription>Complete los datos de la nueva cita</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newAppointment.tipo}
                    onValueChange={(v) => setNewAppointment({ ...newAppointment, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visita">Visita</SelectItem>
                      <SelectItem value="reunion">Reunión</SelectItem>
                      <SelectItem value="entrega_llaves">Entrega de llaves</SelectItem>
                      <SelectItem value="firma">Firma</SelectItem>
                      <SelectItem value="reparacion">Reparación</SelectItem>
                      <SelectItem value="tasacion">Tasación</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={newAppointment.fecha}
                    onChange={(e) => setNewAppointment({ ...newAppointment, fecha: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={newAppointment.titulo}
                  onChange={(e) => setNewAppointment({ ...newAppointment, titulo: e.target.value })}
                  placeholder="Ej: Visita departamento Centro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora inicio</Label>
                  <Input
                    type="time"
                    value={newAppointment.hora_inicio}
                    onChange={(e) => setNewAppointment({ ...newAppointment, hora_inicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora fin</Label>
                  <Input
                    type="time"
                    value={newAppointment.hora_fin}
                    onChange={(e) => setNewAppointment({ ...newAppointment, hora_fin: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Propiedad (opcional)</Label>
                <Select
                  value={newAppointment.propiedad_id}
                  onValueChange={(v) => setNewAppointment({ ...newAppointment, propiedad_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.direccion}, {p.ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cliente (opcional)</Label>
                <Select
                  value={newAppointment.cliente_id}
                  onValueChange={(v) => setNewAppointment({ ...newAppointment, cliente_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={newAppointment.notas}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAppointment}>
                  Programar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Hoy
              </Button>
              <span className="ml-4 text-lg font-medium">
                {viewMode === "dia"
                  ? currentDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                  : `${weekDays[0].toLocaleDateString("es-AR", { day: "numeric", month: "short" })} - ${weekDays[6].toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}`
                }
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "dia" ? "default" : "outline"}
                onClick={() => setViewMode("dia")}
                size="sm"
              >
                Día
              </Button>
              <Button
                variant={viewMode === "semana" ? "default" : "outline"}
                onClick={() => setViewMode("semana")}
                size="sm"
              >
                Semana
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {loading ? (
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-16 bg-muted rounded" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === "semana" ? (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayStr = day.toISOString().split("T")[0]
            const dayAppointments = getAppointmentsForDay(day)
            const isToday = dayStr === today

            return (
              <Card key={dayStr} className={isToday ? "ring-2 ring-primary" : ""}>
                <CardHeader className="pb-2 px-3 py-2">
                  <CardTitle className={`text-sm ${isToday ? "text-primary" : ""}`}>
                    {day.toLocaleDateString("es-AR", { weekday: "short" })}
                  </CardTitle>
                  <CardDescription className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                    {day.getDate()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-2 space-y-1 min-h-[200px]">
                  {dayAppointments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sin citas</p>
                  ) : (
                    dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 ${tipoColors[apt.tipo] || tipoColors.otro}`}
                        onClick={() => {/* open detail */}}
                      >
                        <div className="font-medium truncate">{apt.titulo || apt.tipo}</div>
                        <div className="flex items-center gap-1 text-xs opacity-75">
                          <Clock className="h-3 w-3" />
                          {apt.hora_inicio?.slice(0, 5)}
                        </div>
                        {apt.propiedad && (
                          <div className="flex items-center gap-1 text-xs opacity-75 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {apt.propiedad.direccion}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
            </CardTitle>
            <CardDescription>{appointments.length} citas programadas</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay citas para este día</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold">{apt.hora_inicio?.slice(0, 5)}</div>
                      <div className="text-xs text-muted-foreground">{apt.hora_fin?.slice(0, 5)}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={tipoColors[apt.tipo]}>{apt.tipo}</Badge>
                        <Badge variant="outline" className={estadoColors[apt.estado]}>{apt.estado}</Badge>
                      </div>
                      <h3 className="font-medium mt-1">{apt.titulo}</h3>
                      {apt.propiedad && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Building2 className="h-4 w-4" />
                          <Link href={`/dashboard/propiedades/${apt.propiedad.id}`} className="hover:underline">
                            {apt.propiedad.direccion}, {apt.propiedad.ciudad}
                          </Link>
                        </div>
                      )}
                      {apt.cliente && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {apt.cliente.full_name}
                          {apt.cliente.phone && (
                            <a href={`tel:${apt.cliente.phone}`} className="ml-2">
                              <Phone className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {apt.estado === "programado" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600"
                            onClick={() => handleUpdateStatus(apt.id, "confirmado")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleUpdateStatus(apt.id, "cancelado")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {apt.estado === "confirmado" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(apt.id, "completado")}
                        >
                          Completar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
