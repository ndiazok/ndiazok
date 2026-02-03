"use client"

import React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Wrench, Plus, Camera, X, Upload, Eye, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface Reparacion {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  urgencia: string
  estado: string
  fecha_solicitud: string
  fecha_inicio: string | null
  fecha_fin: string | null
  proveedor_nombre: string | null
  notas: string | null
  fotos_antes: string[]
  fotos_despues: string[]
}

export default function InquilinoReparaciones() {
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([])
  const [propiedadId, setPropiedadId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<Reparacion | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [categoria, setCategoria] = useState("")
  const [urgencia, setUrgencia] = useState("media")
  const [fotos, setFotos] = useState<File[]>([])
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Get user's active contract to find the property
    const { data: participaciones } = await supabase
      .from("contract_participants")
      .select("contract_id")
      .eq("person_id", user.id)
      .eq("party_role", "INQUILINO")

    if (participaciones && participaciones.length > 0) {
      const { data: contrato } = await supabase
        .from("contratos")
        .select("propiedad_id")
        .in("id", participaciones.map((p) => p.contract_id))
        .eq("estado", "activo")
        .single()

      if (contrato) {
        setPropiedadId(contrato.propiedad_id)

        // Get repairs for this property requested by this user
        const { data: reps } = await supabase
          .from("reparaciones")
          .select("*")
          .eq("propiedad_id", contrato.propiedad_id)
          .eq("solicitante_id", user.id)
          .order("fecha_solicitud", { ascending: false })

        if (reps) {
          setReparaciones(reps.map(r => ({
            ...r,
            fotos_antes: r.fotos_antes || [],
            fotos_despues: r.fotos_despues || [],
          })))
        }
      }
    }

    setIsLoading(false)
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + fotos.length > 5) {
      alert("Máximo 5 fotos permitidas")
      return
    }

    setFotos([...fotos, ...files])
    
    // Generate previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFoto = (index: number) => {
    setFotos(fotos.filter((_, i) => i !== index))
    setFotoPreviews(fotoPreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!titulo || !descripcion || !categoria || !propiedadId) return

    setIsSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // First create the repair
    const { data: repair, error } = await supabase.from("reparaciones").insert({
      propiedad_id: propiedadId,
      solicitante_id: user.id,
      titulo,
      descripcion,
      categoria,
      urgencia,
      estado: "pendiente",
      fecha_solicitud: new Date().toISOString(),
    }).select().single()

    if (error || !repair) {
      setIsSubmitting(false)
      return
    }

    // Upload photos if any
    if (fotos.length > 0) {
      const photoUrls: string[] = []
      
      for (const foto of fotos) {
        const formData = new FormData()
        formData.append("file", foto)
        formData.append("type", "antes")

        const res = await fetch(`/api/admin/repairs/${repair.id}/photos`, {
          method: "POST",
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          photoUrls.push(data.url)
        }
      }
    }

    setDialogOpen(false)
    setTitulo("")
    setDescripcion("")
    setCategoria("")
    setUrgencia("media")
    setFotos([])
    setFotoPreviews([])
    fetchData()

    setIsSubmitting(false)
  }

  const openDetail = (rep: Reparacion) => {
    setSelectedRepair(rep)
    setDetailOpen(true)
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

  const getProgress = (estado: string) => {
    switch (estado) {
      case "pendiente": return 25
      case "aprobada": return 50
      case "en_proceso": return 75
      case "completada": return 100
      case "rechazada": return 0
      default: return 0
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeRepairs = reparaciones.filter(r => !["completada", "rechazada"].includes(r.estado))
  const completedRepairs = reparaciones.filter(r => ["completada", "rechazada"].includes(r.estado))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reparaciones</h1>
          <p className="text-muted-foreground">Solicitá reparaciones para tu vivienda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Solicitar reparación</DialogTitle>
              <DialogDescription>Describí el problema y te contactaremos a la brevedad</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Ej: Pérdida de agua en baño"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plomeria">Plomería</SelectItem>
                      <SelectItem value="electricidad">Electricidad</SelectItem>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="cerrajeria">Cerrajería</SelectItem>
                      <SelectItem value="pintura">Pintura</SelectItem>
                      <SelectItem value="humedad">Humedad</SelectItem>
                      <SelectItem value="electrodomesticos">Electrodomésticos</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Urgencia</Label>
                  <Select value={urgencia} onValueChange={setUrgencia}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describí el problema con el mayor detalle posible..."
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fotos del problema (opcional, máx. 5)</Label>
                <div className="flex flex-wrap gap-2">
                  {fotoPreviews.map((preview, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                      <img src={preview || "/placeholder.svg"} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFoto(i)}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {fotos.length < 5 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFotoChange}
                        multiple
                      />
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Agregar</span>
                    </label>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !titulo || !descripcion || !categoria}
                className="w-full"
              >
                {isSubmitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{activeRepairs.length}</p>
            <p className="text-sm text-muted-foreground">En curso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{completedRepairs.filter(r => r.estado === "completada").length}</p>
            <p className="text-sm text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Wrench className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{reparaciones.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {reparaciones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No tenés solicitudes de reparación</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera solicitud
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="activas">
          <TabsList>
            <TabsTrigger value="activas">En curso ({activeRepairs.length})</TabsTrigger>
            <TabsTrigger value="historial">Historial ({completedRepairs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="activas" className="space-y-4 mt-4">
            {activeRepairs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay reparaciones en curso
                </CardContent>
              </Card>
            ) : (
              activeRepairs.map((rep) => (
                <Card key={rep.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(rep)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base">{rep.titulo}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(rep.fecha_solicitud).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "long",
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getUrgenciaBadge(rep.urgencia)}
                        {getEstadoBadge(rep.estado)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{rep.descripcion}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{rep.categoria}</span>
                        <span className="text-muted-foreground">{getProgress(rep.estado)}%</span>
                      </div>
                      <Progress value={getProgress(rep.estado)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="historial" className="space-y-4 mt-4">
            {completedRepairs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay reparaciones completadas
                </CardContent>
              </Card>
            ) : (
              completedRepairs.map((rep) => (
                <Card key={rep.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(rep)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{rep.titulo}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(rep.fecha_solicitud).toLocaleDateString("es-AR")}
                          {rep.fecha_fin && ` - ${new Date(rep.fecha_fin).toLocaleDateString("es-AR")}`}
                        </CardDescription>
                      </div>
                      {getEstadoBadge(rep.estado)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground capitalize">{rep.categoria}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedRepair && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-2">
                  <DialogTitle>{selectedRepair.titulo}</DialogTitle>
                  {getEstadoBadge(selectedRepair.estado)}
                </div>
                <DialogDescription>
                  Solicitado el {new Date(selectedRepair.fecha_solicitud).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Progreso</span>
                    <span>{getProgress(selectedRepair.estado)}%</span>
                  </div>
                  <Progress value={getProgress(selectedRepair.estado)} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Pendiente</span>
                    <span>Aprobada</span>
                    <span>En proceso</span>
                    <span>Completada</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoría</span>
                    <span className="capitalize">{selectedRepair.categoria}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Urgencia</span>
                    {getUrgenciaBadge(selectedRepair.urgencia)}
                  </div>
                  {selectedRepair.proveedor_nombre && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proveedor</span>
                      <span>{selectedRepair.proveedor_nombre}</span>
                    </div>
                  )}
                  {selectedRepair.fecha_inicio && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha inicio</span>
                      <span>{new Date(selectedRepair.fecha_inicio).toLocaleDateString("es-AR")}</span>
                    </div>
                  )}
                  {selectedRepair.fecha_fin && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha fin</span>
                      <span>{new Date(selectedRepair.fecha_fin).toLocaleDateString("es-AR")}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="pt-2">
                  <p className="text-sm font-medium mb-1">Descripción</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRepair.descripcion}</p>
                </div>

                {/* Notes from admin */}
                {selectedRepair.notas && (
                  <div className="pt-2 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Notas de la inmobiliaria</p>
                    <p className="text-sm text-muted-foreground">{selectedRepair.notas}</p>
                  </div>
                )}

                {/* Photos */}
                {(selectedRepair.fotos_antes.length > 0 || selectedRepair.fotos_despues.length > 0) && (
                  <div className="pt-2">
                    <Tabs defaultValue="antes">
                      <TabsList className="w-full">
                        <TabsTrigger value="antes" className="flex-1">Antes ({selectedRepair.fotos_antes.length})</TabsTrigger>
                        <TabsTrigger value="despues" className="flex-1">Después ({selectedRepair.fotos_despues.length})</TabsTrigger>
                      </TabsList>
                      <TabsContent value="antes" className="mt-2">
                        <div className="grid grid-cols-3 gap-2">
                          {selectedRepair.fotos_antes.map((foto, i) => (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img src={foto || "/placeholder.svg"} alt={`Antes ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="despues" className="mt-2">
                        <div className="grid grid-cols-3 gap-2">
                          {selectedRepair.fotos_despues.map((foto, i) => (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img src={foto || "/placeholder.svg"} alt={`Después ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
