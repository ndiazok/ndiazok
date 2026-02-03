"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Building2, Plus, Trash2, Upload, X, ImageIcon } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  full_name: string
  email: string
  role: string
}

interface Owner {
  person_id: string
  share_pct: number
  is_primary: boolean
}

interface UploadedImage {
  file: File
  preview: string
}

interface NuevaPropiedadFormProps {
  onBack?: () => void
  initialData?: any
  initialImages?: File[]
}

export default function NuevaPropiedadForm({ onBack, initialData, initialImages = [] }: NuevaPropiedadFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedOwnerId = searchParams.get("propietario")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [owners, setOwners] = useState<Owner[]>([
    { person_id: preselectedOwnerId || "", share_pct: 100, is_primary: true },
  ])
  const [images, setImages] = useState<UploadedImage[]>(() => 
    initialImages.map(file => ({ file, preview: URL.createObjectURL(file) }))
  )

  const [formData, setFormData] = useState({
    direccion: initialData?.direccion || "",
    ciudad: initialData?.ciudad || "",
    provincia: initialData?.provincia || "",
    codigo_postal: initialData?.codigo_postal || "",
    tipo: initialData?.tipo || "departamento",
    estado: initialData?.estado || "disponible",
    ambientes: initialData?.ambientes?.toString() || "",
    dormitorios: initialData?.dormitorios?.toString() || "",
    banos: initialData?.banos?.toString() || "",
    metros_cuadrados: initialData?.metros_cuadrados?.toString() || "",
    cochera: initialData?.cochera || false,
    descripcion: initialData?.descripcion || "",
    notas_internas: initialData?.notas_internas || "",
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/admin/clients")
        if (res.ok) {
          const data = await res.json()
          const clientsArray = Array.isArray(data) ? data : data.data || []
          setClients(clientsArray.filter((c: Client) => c.role === "propietario"))
        }
      } catch (err) {
        console.error("Error fetching clients:", err)
      }
    }
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const totalPct = owners.reduce((sum, o) => sum + o.share_pct, 0)
    if (totalPct !== 100) {
      setError(`Los porcentajes de propiedad deben sumar 100%. Actualmente suman ${totalPct}%`)
      setIsLoading(false)
      return
    }

    if (!owners.some((o) => o.person_id)) {
      setError("Debe asignar al menos un propietario")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ambientes: formData.ambientes ? Number.parseInt(formData.ambientes) : null,
          dormitorios: formData.dormitorios ? Number.parseInt(formData.dormitorios) : null,
          banos: formData.banos ? Number.parseInt(formData.banos) : null,
          metros_cuadrados: formData.metros_cuadrados ? Number.parseFloat(formData.metros_cuadrados) : null,
          owners: owners.filter((o) => o.person_id),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al crear la propiedad")
      }

      const property = await res.json()

      // Upload images if any
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const imgFormData = new FormData()
        imgFormData.append("file", img.file)
        imgFormData.append("orden", i.toString())

        await fetch(`/api/admin/properties/${property.id}/images`, {
          method: "POST",
          body: imgFormData,
        })
      }

      router.push(`/dashboard/propiedades/${property.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la propiedad")
    } finally {
      setIsLoading(false)
    }
  }

  const addOwner = () => {
    setOwners([...owners, { person_id: "", share_pct: 0, is_primary: false }])
  }

  const removeOwner = (index: number) => {
    if (owners.length > 1) {
      const newOwners = owners.filter((_, i) => i !== index)
      if (owners[index].is_primary && newOwners.length > 0) {
        newOwners[0].is_primary = true
      }
      setOwners(newOwners)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        f => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
      )
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      setImages(prev => [...prev, ...newImages].slice(0, 45))
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const updateOwner = (index: number, field: keyof Owner, value: string | number | boolean) => {
    const newOwners = [...owners]
    if (field === "is_primary" && value === true) {
      newOwners.forEach((o, i) => {
        o.is_primary = i === index
      })
    } else {
      ;(newOwners[index] as any)[field] = value
    }
    setOwners(newOwners)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/propiedades">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nueva Propiedad</h1>
          <p className="text-muted-foreground">Registra un nuevo inmueble en la cartera</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ubicación</CardTitle>
            <CardDescription>Dirección completa de la propiedad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                placeholder="Av. Corrientes 1234, Piso 5, Depto A"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input
                  id="ciudad"
                  placeholder="Buenos Aires"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia *</Label>
                <Input
                  id="provincia"
                  placeholder="CABA"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Input
                  id="codigo_postal"
                  placeholder="C1043"
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Propietarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Propietarios</CardTitle>
            <CardDescription>Asigna los propietarios y sus porcentajes de participación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {owners.map((owner, index) => (
              <div key={index} className="flex items-end gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex-1 space-y-2">
                  <Label>Propietario *</Label>
                  <Select value={owner.person_id} onValueChange={(v) => updateOwner(index, "person_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar propietario" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label>% Participación</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={owner.share_pct}
                    onChange={(e) => updateOwner(index, "share_pct", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox
                    id={`primary-${index}`}
                    checked={owner.is_primary}
                    onCheckedChange={(checked) => updateOwner(index, "is_primary", checked === true)}
                  />
                  <Label htmlFor={`primary-${index}`} className="text-sm">
                    Principal
                  </Label>
                </div>
                {owners.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOwner(index)} className="mb-1">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addOwner} className="w-full bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Copropietario
            </Button>
            <p className="text-xs text-muted-foreground">
              Total: {owners.reduce((sum, o) => sum + o.share_pct, 0)}% (debe sumar 100%)
            </p>
          </CardContent>
        </Card>

        {/* Características */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Características</CardTitle>
            <CardDescription>Tipo de propiedad y sus atributos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Propiedad *</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="departamento">Departamento</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="ph">PH</SelectItem>
                    <SelectItem value="local">Local Comercial</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                    <SelectItem value="cochera">Cochera</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem>
                    <SelectItem value="galpon">Galpón</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="alquilada">Alquilada</SelectItem>
                    <SelectItem value="en_venta">En Venta</SelectItem>
                    <SelectItem value="reservada">Reservada</SelectItem>
                    <SelectItem value="mantenimiento">En Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="ambientes">Ambientes</Label>
                <Input
                  id="ambientes"
                  type="number"
                  min="0"
                  placeholder="3"
                  value={formData.ambientes}
                  onChange={(e) => setFormData({ ...formData, ambientes: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dormitorios">Dormitorios</Label>
                <Input
                  id="dormitorios"
                  type="number"
                  min="0"
                  placeholder="2"
                  value={formData.dormitorios}
                  onChange={(e) => setFormData({ ...formData, dormitorios: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banos">Baños</Label>
                <Input
                  id="banos"
                  type="number"
                  min="0"
                  placeholder="1"
                  value={formData.banos}
                  onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metros_cuadrados">m² Totales</Label>
                <Input
                  id="metros_cuadrados"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="75"
                  value={formData.metros_cuadrados}
                  onChange={(e) => setFormData({ ...formData, metros_cuadrados: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="cochera"
                checked={formData.cochera}
                onCheckedChange={(checked) => setFormData({ ...formData, cochera: checked === true })}
              />
              <Label htmlFor="cochera">Incluye cochera</Label>
            </div>
          </CardContent>
        </Card>

        {/* Descripción */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (visible para clientes)</Label>
              <Textarea
                id="descripcion"
                placeholder="Hermoso departamento luminoso con vista al parque..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas_internas">Notas Internas (solo administración)</Label>
              <Textarea
                id="notas_internas"
                placeholder="Observaciones internas sobre la propiedad..."
                value={formData.notas_internas}
                onChange={(e) => setFormData({ ...formData, notas_internas: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Imágenes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Imágenes {images.length > 0 && `(${images.length})`}
            </CardTitle>
            <CardDescription>Agregá fotos de la propiedad (opcional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("image-input-manual")?.click()}
            >
              <input
                id="image-input-manual"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Arrastrá las imágenes o <span className="text-primary font-medium">hacé clic para seleccionar</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG o WEBP. Máximo 5MB por imagen.</p>
            </div>

            {images.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{images.length} imagen(es)</p>
                  <Button variant="ghost" size="sm" onClick={() => setImages([])}>
                    Limpiar todo
                  </Button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={img.preview || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                      <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1 rounded">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/propiedades">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-4 w-4" />
                Crear Propiedad
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
