"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Building2, User, Calendar, DollarSign, Wrench,
  Camera, FileText, Clock, CheckCircle, XCircle, Upload,
  Phone, Mail, AlertTriangle, Edit2, Save, Trash2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

interface Reparacion {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  urgencia: string
  estado: string
  fecha_solicitud: string
  fecha_aprobacion: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  presupuesto_estimado: number | null
  costo_final: number | null
  moneda: string
  proveedor_nombre: string | null
  proveedor_contacto: string | null
  responsable_pago: string | null
  porcentaje_inquilino: number | null
  notas: string | null
  factura_url: string | null
  fotos_antes: string[]
  fotos_despues: string[]
  propiedad: {
    id: string
    direccion: string
    ciudad: string
  }
  solicitante: {
    id: string
    full_name: string
    email: string
    phone: string
  } | null
}

export default function ReparacionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [reparacion, setReparacion] = useState<Reparacion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingBefore, setUploadingBefore] = useState(false)
  const [uploadingAfter, setUploadingAfter] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    estado: "",
    proveedor_nombre: "",
    proveedor_contacto: "",
    presupuesto_estimado: "",
    costo_final: "",
    moneda: "ARS",
    responsable_pago: "propietario",
    porcentaje_inquilino: "0",
    notas: "",
    factura_url: "",
  })

  useEffect(() => {
    fetchReparacion()
  }, [id])

  const fetchReparacion = async () => {
    const res = await fetch(`/api/admin/repairs/${id}`)
    if (res.ok) {
      const data = await res.json()
      setReparacion(data)
      setEditForm({
        estado: data.estado || "pendiente",
        proveedor_nombre: data.proveedor_nombre || "",
        proveedor_contacto: data.proveedor_contacto || "",
        presupuesto_estimado: data.presupuesto_estimado?.toString() || "",
        costo_final: data.costo_final?.toString() || "",
        moneda: data.moneda || "ARS",
        responsable_pago: data.responsable_pago || "propietario",
        porcentaje_inquilino: data.porcentaje_inquilino?.toString() || "0",
        notas: data.notas || "",
        factura_url: data.factura_url || "",
      })
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const res = await fetch(`/api/admin/repairs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        presupuesto_estimado: editForm.presupuesto_estimado ? parseFloat(editForm.presupuesto_estimado) : null,
        costo_final: editForm.costo_final ? parseFloat(editForm.costo_final) : null,
        porcentaje_inquilino: editForm.porcentaje_inquilino ? parseFloat(editForm.porcentaje_inquilino) : 0,
      }),
    })
    if (res.ok) {
      await fetchReparacion()
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/admin/repairs/${id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/dashboard/reparaciones")
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "antes" | "despues") => {
    const files = e.target.files
    if (!files || files.length === 0) return

    type === "antes" ? setUploadingBefore(true) : setUploadingAfter(true)

    const formData = new FormData()
    formData.append("file", files[0])
    formData.append("type", type)

    const res = await fetch(`/api/admin/repairs/${id}/photos`, {
      method: "POST",
      body: formData,
    })

    if (res.ok) {
      await fetchReparacion()
    }

    type === "antes" ? setUploadingBefore(false) : setUploadingAfter(false)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!reparacion) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Reparación no encontrada</p>
        <Button variant="outline" className="mt-4 bg-transparent" asChild>
          <Link href="/dashboard/reparaciones">Volver</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/reparaciones">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{reparacion.titulo}</h1>
              {getUrgenciaBadge(reparacion.urgencia)}
              {getEstadoBadge(reparacion.estado)}
            </div>
            <p className="text-muted-foreground capitalize">{reparacion.categoria}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </>
          ) : (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive bg-transparent">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar reparación</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente este caso técnico.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción del problema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{reparacion.descripcion}</p>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Fotos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="antes">
                <TabsList className="mb-4">
                  <TabsTrigger value="antes">Antes ({reparacion.fotos_antes?.length || 0})</TabsTrigger>
                  <TabsTrigger value="despues">Después ({reparacion.fotos_despues?.length || 0})</TabsTrigger>
                </TabsList>
                <TabsContent value="antes">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {reparacion.fotos_antes?.map((foto, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={foto || "/placeholder.svg"} alt={`Antes ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, "antes")}
                        disabled={uploadingBefore}
                      />
                      {uploadingBefore ? (
                        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Subir foto</span>
                        </>
                      )}
                    </label>
                  </div>
                </TabsContent>
                <TabsContent value="despues">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {reparacion.fotos_despues?.map((foto, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={foto || "/placeholder.svg"} alt={`Después ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, "despues")}
                        disabled={uploadingAfter}
                      />
                      {uploadingAfter ? (
                        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Subir foto</span>
                        </>
                      )}
                    </label>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Edit Form */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gestión del caso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={editForm.estado} onValueChange={(v) => setEditForm({ ...editForm, estado: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="aprobada">Aprobada</SelectItem>
                        <SelectItem value="en_proceso">En proceso</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="rechazada">Rechazada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select value={editForm.moneda} onValueChange={(v) => setEditForm({ ...editForm, moneda: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Proveedor / Profesional</Label>
                    <Input
                      value={editForm.proveedor_nombre}
                      onChange={(e) => setEditForm({ ...editForm, proveedor_nombre: e.target.value })}
                      placeholder="Nombre del proveedor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contacto</Label>
                    <Input
                      value={editForm.proveedor_contacto}
                      onChange={(e) => setEditForm({ ...editForm, proveedor_contacto: e.target.value })}
                      placeholder="Teléfono o email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Presupuesto estimado</Label>
                    <Input
                      type="number"
                      value={editForm.presupuesto_estimado}
                      onChange={(e) => setEditForm({ ...editForm, presupuesto_estimado: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo final</Label>
                    <Input
                      type="number"
                      value={editForm.costo_final}
                      onChange={(e) => setEditForm({ ...editForm, costo_final: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Responsable del pago</Label>
                    <Select value={editForm.responsable_pago} onValueChange={(v) => setEditForm({ ...editForm, responsable_pago: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="propietario">Propietario</SelectItem>
                        <SelectItem value="inquilino">Inquilino</SelectItem>
                        <SelectItem value="compartido">Compartido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editForm.responsable_pago === "compartido" && (
                    <div className="space-y-2">
                      <Label>% Inquilino</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.porcentaje_inquilino}
                        onChange={(e) => setEditForm({ ...editForm, porcentaje_inquilino: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>URL de factura</Label>
                  <Input
                    value={editForm.factura_url}
                    onChange={(e) => setEditForm({ ...editForm, factura_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas internas</Label>
                  <Textarea
                    value={editForm.notas}
                    onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                    placeholder="Notas adicionales..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Propiedad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{reparacion.propiedad.direccion}</p>
              <p className="text-sm text-muted-foreground">{reparacion.propiedad.ciudad}</p>
              <Button variant="link" className="px-0 h-auto mt-2" asChild>
                <Link href={`/dashboard/propiedades/${reparacion.propiedad.id}`}>
                  Ver propiedad
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Requester Info */}
          {reparacion.solicitante && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">{reparacion.solicitante.full_name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {reparacion.solicitante.email}
                </div>
                {reparacion.solicitante.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {reparacion.solicitante.phone}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Solicitado</span>
                  <span>{new Date(reparacion.fecha_solicitud).toLocaleDateString("es-AR")}</span>
                </div>
                {reparacion.fecha_aprobacion && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aprobado</span>
                    <span>{new Date(reparacion.fecha_aprobacion).toLocaleDateString("es-AR")}</span>
                  </div>
                )}
                {reparacion.fecha_inicio && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Iniciado</span>
                    <span>{new Date(reparacion.fecha_inicio).toLocaleDateString("es-AR")}</span>
                  </div>
                )}
                {reparacion.fecha_fin && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Finalizado</span>
                    <span>{new Date(reparacion.fecha_fin).toLocaleDateString("es-AR")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Costos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Presupuesto</span>
                  <span>{formatCurrency(reparacion.presupuesto_estimado, reparacion.moneda)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Costo final</span>
                  <span>{formatCurrency(reparacion.costo_final, reparacion.moneda)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Responsable</span>
                  <span className="capitalize">{reparacion.responsable_pago || "Propietario"}</span>
                </div>
                {reparacion.responsable_pago === "compartido" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">% Inquilino</span>
                    <span>{reparacion.porcentaje_inquilino || 0}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Provider */}
          {reparacion.proveedor_nombre && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Proveedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{reparacion.proveedor_nombre}</p>
                {reparacion.proveedor_contacto && (
                  <p className="text-sm text-muted-foreground">{reparacion.proveedor_contacto}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {reparacion.notas && !isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reparacion.notas}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
