"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Phone, Mail, Calendar, Building, User,
  Flame, Thermometer, Snowflake, Plus, MessageSquare,
  PhoneCall, FileText, CheckCircle, Clock, Pencil
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  interes: string
  temperatura: string
  estado: string
  fuente: string
  propiedad?: { id: string; direccion: string; ciudad: string; tipo: string }
  asignado?: { id: string; full_name: string; email: string }
  presupuesto_min?: number
  presupuesto_max?: number
  preferencias?: Record<string, any>
  notas?: string
  proxima_accion?: string
  fecha_proxima_accion?: string
  created_at: string
  ultima_actividad?: string
  activities: Activity[]
}

interface Activity {
  id: string
  tipo: string
  descripcion: string
  metadata?: Record<string, any>
  created_at: string
}

const estadoColors: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-800",
  contactado: "bg-yellow-100 text-yellow-800",
  calificado: "bg-purple-100 text-purple-800",
  propuesta: "bg-orange-100 text-orange-800",
  negociacion: "bg-pink-100 text-pink-800",
  ganado: "bg-green-100 text-green-800",
  perdido: "bg-red-100 text-red-800",
}

const activityIcons: Record<string, React.ReactNode> = {
  creacion: <Plus className="h-4 w-4" />,
  llamada: <PhoneCall className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  reunion: <Calendar className="h-4 w-4" />,
  nota: <MessageSquare className="h-4 w-4" />,
  propuesta: <FileText className="h-4 w-4" />,
  cambio_estado: <CheckCircle className="h-4 w-4" />,
}

const temperaturaIcons: Record<string, React.ReactNode> = {
  frio: <Snowflake className="h-5 w-5 text-blue-500" />,
  tibio: <Thermometer className="h-5 w-5 text-yellow-500" />,
  caliente: <Flame className="h-5 w-5 text-red-500" />,
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [isActivityOpen, setIsActivityOpen] = useState(false)
  const [newActivity, setNewActivity] = useState({
    tipo: "nota",
    descripcion: ""
  })
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  
  useEffect(() => {
    if (params.id) {
      fetchLead()
    }
  }, [params.id])
  
  const fetchLead = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/leads/${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setLead(data)
      setNewStatus(data.estado)
    }
    setLoading(false)
  }
  
  const handleAddActivity = async () => {
    const res = await fetch(`/api/admin/leads/${params.id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newActivity)
    })
    
    if (res.ok) {
      setIsActivityOpen(false)
      setNewActivity({ tipo: "nota", descripcion: "" })
      fetchLead()
    }
  }
  
  const handleUpdateStatus = async () => {
    const res = await fetch(`/api/admin/leads/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, estado: newStatus })
    })
    
    if (res.ok) {
      setIsStatusOpen(false)
      fetchLead()
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }
  
  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Lead no encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/crm">Volver al CRM</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/crm">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.nombre}</h1>
              {temperaturaIcons[lead.temperatura]}
            </div>
            <p className="text-muted-foreground">
              Lead desde {new Date(lead.created_at).toLocaleDateString("es-AR")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
            <DialogTrigger asChild>
              <Badge className={`${estadoColors[lead.estado]} cursor-pointer text-sm px-3 py-1`}>
                {lead.estado}
              </Badge>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar estado</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="contactado">Contactado</SelectItem>
                    <SelectItem value="calificado">Calificado</SelectItem>
                    <SelectItem value="propuesta">Propuesta</SelectItem>
                    <SelectItem value="negociacion">Negociación</SelectItem>
                    <SelectItem value="ganado">Ganado</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsStatusOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpdateStatus}>Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/crm/${lead.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Info principal */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${lead.email}`} className="font-medium hover:underline">
                      {lead.email}
                    </a>
                  </div>
                </div>
                {lead.telefono && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <a href={`tel:${lead.telefono}`} className="font-medium hover:underline">
                        {lead.telefono}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              {lead.propiedad && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Interesado en</p>
                  <Link 
                    href={`/dashboard/propiedades/${lead.propiedad.id}`}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80"
                  >
                    <Building className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{lead.propiedad.direccion}</p>
                      <p className="text-sm text-muted-foreground">{lead.propiedad.ciudad}</p>
                    </div>
                  </Link>
                </div>
              )}
              
              {(lead.presupuesto_min || lead.presupuesto_max) && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Presupuesto</p>
                  <p className="font-medium">
                    {lead.presupuesto_min && `$${lead.presupuesto_min.toLocaleString()}`}
                    {lead.presupuesto_min && lead.presupuesto_max && " - "}
                    {lead.presupuesto_max && `$${lead.presupuesto_max.toLocaleString()}`}
                  </p>
                </div>
              )}
              
              {lead.notas && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Notas</p>
                  <p className="whitespace-pre-wrap">{lead.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Timeline de actividades */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Actividad</CardTitle>
              <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva actividad</DialogTitle>
                    <DialogDescription>Registrar una interacción con el lead</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Tipo</Label>
                      <Select value={newActivity.tipo} onValueChange={(v) => setNewActivity({ ...newActivity, tipo: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="llamada">Llamada</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="reunion">Reunión</SelectItem>
                          <SelectItem value="propuesta">Propuesta</SelectItem>
                          <SelectItem value="nota">Nota</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Descripción</Label>
                      <Textarea 
                        value={newActivity.descripcion}
                        onChange={(e) => setNewActivity({ ...newActivity, descripcion: e.target.value })}
                        placeholder="Detalle de la actividad..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsActivityOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAddActivity} disabled={!newActivity.descripcion}>
                      Guardar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {lead.activities.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No hay actividades registradas
                </p>
              ) : (
                <div className="space-y-4">
                  {lead.activities.map((activity, idx) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="p-2 bg-muted rounded-full">
                          {activityIcons[activity.tipo] || <MessageSquare className="h-4 w-4" />}
                        </div>
                        {idx < lead.activities.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">{activity.tipo.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString("es-AR")}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.descripcion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Interés</p>
                <p className="font-medium capitalize">{lead.interes}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fuente</p>
                <p className="font-medium capitalize">{lead.fuente}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temperatura</p>
                <div className="flex items-center gap-2">
                  {temperaturaIcons[lead.temperatura]}
                  <span className="font-medium capitalize">{lead.temperatura}</span>
                </div>
              </div>
              {lead.asignado && (
                <div>
                  <p className="text-sm text-muted-foreground">Asignado a</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{lead.asignado.full_name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {lead.proxima_accion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Próxima acción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{lead.proxima_accion}</p>
                {lead.fecha_proxima_accion && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(lead.fecha_proxima_accion).toLocaleDateString("es-AR")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <a href={`mailto:${lead.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar email
                </a>
              </Button>
              {lead.telefono && (
                <>
                  <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                    <a href={`tel:${lead.telefono}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Llamar
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-green-50 hover:bg-green-100 border-green-200 text-green-700" asChild>
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
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
