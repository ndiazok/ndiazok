"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  Calendar,
  Loader2,
  Camera,
  Trash2,
  Check,
} from "lucide-react"

interface InspectionData {
  token: string
  tipo_firmante: string
  inspection: {
    id: string
    tipo: string
    fecha_programada: string
    fecha_realizacion: string | null
    observaciones_generales: string | null
    notas_finales: string | null
    propiedad: {
      id: string
      direccion: string
      ciudad: string
      tipo: string
    }
    items: Array<{
      id: string
      categoria: string
      item_nombre: string
      estado: string
      observacion: string | null
      fotos: any[]
    }>
  }
}

const estadoItemConfig: Record<string, { label: string; color: string; icon: any }> = {
  bueno: { label: "Bueno", color: "text-green-600", icon: CheckCircle },
  regular: { label: "Regular", color: "text-yellow-600", icon: AlertCircle },
  malo: { label: "Malo", color: "text-red-600", icon: XCircle },
  pendiente: { label: "Pendiente", color: "text-gray-400", icon: AlertCircle },
}

export default function SignInspectionPage() {
  const params = useParams()
  const token = params.token as string
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<InspectionData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    nombre_firmante: "",
    dni_firmante: "",
    observaciones: "",
  })

  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null)

  useEffect(() => {
    fetchInspection()
  }, [token])

  const fetchInspection = async () => {
    try {
      const res = await fetch(`/api/public/inspection/${token}`)
      if (res.ok) {
        const data = await res.json()
        setData(data)
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Error al cargar la inspección")
      }
    } catch (err) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Canvas signature functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const getSignatureBase64 = (): string | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    // Check if canvas has any drawing
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const hasDrawing = pixelData.some((pixel, index) => index % 4 === 3 && pixel !== 0)

    if (!hasDrawing) return null

    return canvas.toDataURL("image/png")
  }

  const handleCapturePhoto = () => {
    // Create file input for camera
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "environment"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setEvidencePhoto(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const firma_base64 = getSignatureBase64()
    if (!firma_base64) {
      alert("Por favor, dibuje su firma en el recuadro")
      return
    }

    if (!formData.nombre_firmante) {
      alert("Por favor, ingrese su nombre completo")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/inspection/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_firmante: formData.nombre_firmante,
          dni_firmante: formData.dni_firmante,
          firma_base64,
          foto_evidencia_url: evidencePhoto,
          observaciones: formData.observaciones,
        }),
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Error al registrar la firma")
      }
    } catch (err) {
      alert("Error de conexión")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando inspección...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <div>
                <h2 className="text-xl font-semibold">Error</h2>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div>
                <h2 className="text-xl font-semibold">Firma Registrada</h2>
                <p className="text-muted-foreground">
                  Su firma ha sido registrada exitosamente. Puede cerrar esta página.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { inspection, tipo_firmante } = data
  const groupedItems = inspection.items.reduce(
    (acc, item) => {
      if (!acc[item.categoria]) acc[item.categoria] = []
      acc[item.categoria].push(item)
      return acc
    },
    {} as Record<string, typeof inspection.items>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Firma de Inspección</CardTitle>
            <CardDescription>
              Revisá el acta de inspección y firmá como{" "}
              <Badge variant="outline">{tipo_firmante === "propietario" ? "Propietario" : "Inquilino"}</Badge>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Property Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de la Propiedad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span>
                {inspection.propiedad.direccion}, {inspection.propiedad.ciudad}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Inspección de{" "}
                {inspection.tipo === "entrada"
                  ? "entrada"
                  : inspection.tipo === "salida"
                    ? "salida"
                    : "control"}{" "}
                -{" "}
                {new Date(inspection.fecha_realizacion || inspection.fecha_programada).toLocaleDateString(
                  "es-AR"
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Inspection Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalle de la Inspección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(groupedItems).map(([categoria, items]) => (
              <div key={categoria}>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">{categoria}</h4>
                <div className="space-y-2">
                  {items.map((item) => {
                    const estadoInfo = estadoItemConfig[item.estado] || estadoItemConfig.pendiente
                    const Icon = estadoInfo.icon
                    return (
                      <div key={item.id} className="flex items-start justify-between p-2 bg-muted/50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.item_nombre}</p>
                          {item.observacion && (
                            <p className="text-xs text-muted-foreground">{item.observacion}</p>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 ${estadoInfo.color}`}>
                          <Icon className="h-4 w-4" />
                          <span className="text-xs">{estadoInfo.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {inspection.observaciones_generales && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Observaciones Generales</h4>
                  <p className="text-sm">{inspection.observaciones_generales}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Signature Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Firma del Acta</CardTitle>
            <CardDescription>
              Complete sus datos y firme en el recuadro para confirmar la inspección
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre Completo *</Label>
                  <Input
                    value={formData.nombre_firmante}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nombre_firmante: e.target.value }))}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>DNI</Label>
                  <Input
                    value={formData.dni_firmante}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dni_firmante: e.target.value }))}
                    placeholder="Ej: 12345678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones (opcional)</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Agregue cualquier observación o disconformidad..."
                  rows={3}
                />
              </div>

              {/* Evidence Photo */}
              <div className="space-y-2">
                <Label>Foto de Evidencia (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={handleCapturePhoto}>
                    <Camera className="h-4 w-4 mr-2" />
                    Tomar Foto
                  </Button>
                  {evidencePhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEvidencePhoto(null)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                {evidencePhoto && (
                  <img
                    src={evidencePhoto || "/placeholder.svg"}
                    alt="Evidencia"
                    className="w-32 h-32 object-cover rounded border"
                  />
                )}
              </div>

              {/* Signature Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Firma *</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>
                    Limpiar
                  </Button>
                </div>
                <div className="border rounded-lg p-2 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="w-full border border-dashed border-gray-300 rounded cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Dibuje su firma en el recuadro
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar y Firmar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
