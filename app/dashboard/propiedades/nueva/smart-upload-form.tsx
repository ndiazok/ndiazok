"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Upload,
  X,
  Sparkles,
  Check,
  AlertCircle,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Grid3X3,
} from "lucide-react"
import { generateCollagesClient } from "@/lib/client-collage"
import { isValidImageFile, processImagesForUpload } from "@/lib/image-utils"

interface SmartUploadFormProps {
  onBack: () => void
  onSwitchToManual?: (images: File[]) => void
}

interface UploadedImage {
  file: File
  preview: string
}

interface ExtractedData {
  tipo: string
  ambientes: number | null
  dormitorios: number | null
  banos: number | null
  metros_cuadrados: number | null
  cochera: boolean
  estado_general: string | null
  uso_sugerido: string | null
  descripcion: string
  caracteristicas_detectadas: string[]
  ambientes_detectados: string[]
}

interface CollageInfo {
  total_images: number
  collages_generated: number
  grids: { rows: number; cols: number; count: number }[]
}

interface Client {
  id: string
  full_name: string
}

interface Owner {
  person_id: string
  share_pct: number
  is_primary: boolean
}

const MAX_IMAGES = 45 // 5 collages of 9 images each
const MAX_IMAGE_SIZE_MB = 5

export default function SmartUploadForm({ onBack, onSwitchToManual }: SmartUploadFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<"upload" | "analyzing" | "review" | "error">("upload")
  const [analysisError, setAnalysisError] = useState("")
  const [images, setImages] = useState<UploadedImage[]>([])
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [collageInfo, setCollageInfo] = useState<CollageInfo | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [owners, setOwners] = useState<Owner[]>([{ person_id: "", share_pct: 100, is_primary: true }])

  const [formData, setFormData] = useState({
    direccion: "",
    ciudad: "",
    provincia: "",
    codigo_postal: "",
    tipo: "departamento",
    estado: "disponible",
    ambientes: "",
    dormitorios: "",
    banos: "",
    metros_cuadrados: "",
    cochera: false,
    descripcion: "",
    notas_internas: "",
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/admin/clients")
        if (res.ok) {
          const data = await res.json()
          setClients(Array.isArray(data) ? data : data.data || [])
        }
      } catch (err) {
        console.error("Error fetching clients:", err)
      }
    }
    fetchClients()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => isValidImageFile(f) && f.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024,
    )
    addImages(files)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        (f) => isValidImageFile(f) && f.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024,
      )
      addImages(files)
    }
  }

  const addImages = (files: File[]) => {
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES))
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  const analyzeImages = async () => {
    if (images.length === 0) {
      setError("Subí al menos una imagen para analizar")
      return
    }

    setStep("analyzing")
    setAnalysisProgress(0)
    setError("")

    try {
      // Step 1: Convert all images to JPEG
      setAnalysisProgress(5)
      const files = images.map((img) => img.file)
      
      const { converted, failed } = await processImagesForUpload(files, (current, total) => {
        setAnalysisProgress(5 + Math.round((current / total) * 15))
      })
      
      if (converted.length === 0) {
        throw new Error("No se pudo procesar ninguna imagen. Intentá con otros archivos.")
      }
      
      if (failed.length > 0) {
        console.warn("[v0] Some images failed to convert:", failed)
      }

      setAnalysisProgress(20)

      // Step 2: Generate collages from converted JPEG images
      // cellSize 512px with 9 images (3x3) = 1536x1536 final collage - optimal for OpenAI vision
      const { collages, gridInfo } = await generateCollagesClient({
        images: converted,
        maxPerCollage: 9,
        cellSize: 512,
        gap: 0,
        quality: 0.85,
      })
      
      console.log(`[v0] Generated ${collages.length} collages, sizes: ${collages.map(b => `${(b.size / 1024).toFixed(0)}KB`).join(", ")}`)

      setAnalysisProgress(35)

      // Send only collages to the server (already combined images)
      const formData = new FormData()
      collages.forEach((blob, i) => {
        formData.append(`collage_${i}`, blob, `collage_${i}.jpg`)
      })
      formData.append("grid_info", JSON.stringify(gridInfo))
      formData.append("total_images", images.length.toString())

      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => Math.min(prev + 5, 90))
      }, 500)

      console.log(`[v0] Sending to smart-analyze: ${collages.length} collages, ${images.length} total images`)
      
      const res = await fetch("/api/admin/properties/smart-analyze", {
        method: "POST",
        body: formData,
      })
      
      console.log(`[v0] Smart-analyze response status: ${res.status}`)

      clearInterval(progressInterval)
      setAnalysisProgress(100)

if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error("[v0] Smart-analyze error:", data)
        throw new Error(data.error || `Error al analizar las imágenes (HTTP ${res.status})`)
      }
      
      const data = await res.json()
      console.log("[v0] Analysis result:", data.extracted)
      setExtractedData(data.extracted)
      setCollageInfo(data.collage_info)

      setFormData((prev) => ({
        ...prev,
        tipo: data.extracted.tipo || prev.tipo,
        ambientes: data.extracted.ambientes?.toString() || prev.ambientes,
        dormitorios: data.extracted.dormitorios?.toString() || prev.dormitorios,
        banos: data.extracted.banos?.toString() || prev.banos,
        metros_cuadrados: data.extracted.metros_cuadrados?.toString() || prev.metros_cuadrados,
        cochera: data.extracted.cochera || false,
        descripcion: data.extracted.descripcion || prev.descripcion,
      }))

      setStep("review")
    } catch (err) {
      console.error("[v0] Smart upload error:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al analizar las imágenes"
      setAnalysisError(errorMessage)
      setStep("error")
    }
  }

  const handleContinueManual = () => {
    if (onSwitchToManual) {
      onSwitchToManual(images.map(img => img.file))
    } else {
      // Fallback: go to review step with empty extracted data
      setExtractedData(null)
      setStep("review")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validar que hay al menos un propietario seleccionado
    const validOwners = owners.filter((o) => o.person_id)
    if (validOwners.length === 0) {
      setError("Debes seleccionar al menos un propietario para la propiedad")
      setIsLoading(false)
      return
    }

    const totalPct = validOwners.reduce((sum, o) => sum + o.share_pct, 0)
    if (totalPct !== 100) {
      setError(`Los porcentajes de propiedad deben sumar 100%. Actualmente suman ${totalPct}%`)
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

      // Upload all images
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

  const getCollagePreview = () => {
    const count = images.length
    if (count === 0) return null
    const collages = Math.ceil(count / 9)
    return { collages, imagesPerCollage: Math.min(count, 9) }
  }

  // Step 1: Upload Images
  if (step === "upload") {
    const collagePreview = getCollagePreview()

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              Smart Upload
              <Sparkles className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-muted-foreground">Subí las fotos y la IA analizará la propiedad</p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paso 1: Subir Imágenes</CardTitle>
            <CardDescription>
              Arrastrá las fotos de la propiedad. Incluí fotos de diferentes ambientes para un mejor análisis. Las
              imágenes se agruparán en collages para optimizar el análisis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("image-input")?.click()}
            >
              <input
                id="image-input"
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Arrastrá las imágenes aquí o{" "}
                <span className="text-primary font-medium">hacé clic para seleccionar</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WEBP, HEIC (iPhone). Máximo {MAX_IMAGE_SIZE_MB}MB por imagen. Hasta {MAX_IMAGES} imágenes.
              </p>
            </div>

            {images.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{images.length} imagen(es) seleccionada(s)</p>
                    {collagePreview && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Grid3X3 className="h-3 w-3" />
                        Se generará(n) {collagePreview.collages} collage(s) para el análisis
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setImages([])}>
                    Limpiar todo
                  </Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
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

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <Button onClick={analyzeImages} disabled={images.length === 0}>
            <Sparkles className="mr-2 h-4 w-4" />
            Analizar con IA
          </Button>
        </div>
      </div>
    )
  }

  // Step 2: Analyzing
  if (step === "analyzing") {
    const collagePreview = getCollagePreview()

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analizando imágenes...</h1>
            <p className="text-muted-foreground">La IA está procesando las fotos de la propiedad</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="max-w-md mx-auto space-y-6">
              <Progress value={analysisProgress} className="h-2" />
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  {analysisProgress < 20 && "Generando collages..."}
                  {analysisProgress >= 20 && analysisProgress < 50 && "Analizando imágenes..."}
                  {analysisProgress >= 50 && analysisProgress < 80 && "Detectando ambientes y características..."}
                  {analysisProgress >= 80 && "Finalizando análisis..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {images.length} imágenes en {collagePreview?.collages || 1} collage(s)
                </p>
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                {images.slice(0, 9).map((img, i) => (
                  <div key={i} className="w-12 h-12 rounded overflow-hidden border">
                    <img src={img.preview || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {images.length > 9 && (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    +{images.length - 9}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error step - offer to continue with manual upload
  if (step === "error") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">No se pudo analizar las imágenes</h1>
            <p className="text-muted-foreground">Hubo un problema con el análisis automático</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="max-w-md mx-auto space-y-6 text-center">
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive">{analysisError}</p>
              </div>
              
              <p className="text-muted-foreground">
                Podés continuar con la carga manual usando las imágenes que ya subiste, 
                o volver a intentar el análisis automático.
              </p>

              <div className="flex justify-center gap-2 flex-wrap">
                {images.slice(0, 9).map((img, i) => (
                  <div key={i} className="w-12 h-12 rounded overflow-hidden border">
                    <img src={img.preview || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {images.length > 9 && (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    +{images.length - 9}
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {images.length} imagen(es) lista(s) para usar
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setStep("upload")}>
            Volver a intentar
          </Button>
          <Button onClick={handleContinueManual}>
            Continuar con carga manual
          </Button>
        </div>
      </div>
    )
  }

  // Step 3: Review & Edit
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setStep("upload")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            Revisar y Completar
            <Check className="h-5 w-5 text-green-500" />
          </h1>
          <p className="text-muted-foreground">Verificá los datos detectados y completá la información faltante</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* AI Detection Summary */}
      {extractedData && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Análisis de IA
              {collageInfo && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  ({collageInfo.total_images} imágenes en {collageInfo.collages_generated} collage(s))
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              {extractedData.estado_general && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Estado: {extractedData.estado_general.replace("_", " ")}
                </span>
              )}
              {extractedData.uso_sugerido && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  Uso: {extractedData.uso_sugerido}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {extractedData.ambientes_detectados?.map((ambiente, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {ambiente}
                </span>
              ))}
              {extractedData.caracteristicas_detectadas?.map((caract, i) => (
                <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">
                  {caract}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Imágenes ({images.length})
            </CardTitle>
            <CardDescription>Todas las imágenes se guardarán con la propiedad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded overflow-hidden border">
                  <img src={img.preview || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 left-0 right-0 text-xs bg-black/50 text-white text-center">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ubicación</CardTitle>
            <CardDescription>Completá la dirección de la propiedad</CardDescription>
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
            <CardDescription>Asigná los propietarios de la propiedad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {owners.map((owner, index) => (
              <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label>Propietario {index + 1}</Label>
                  <Select value={owner.person_id} onValueChange={(v) => updateOwner(index, "person_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar propietario" />
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
                <div className="w-24 space-y-2">
                  <Label>%</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={owner.share_pct}
                    onChange={(e) => updateOwner(index, "share_pct", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`primary-${index}`}
                    checked={owner.is_primary}
                    onCheckedChange={(v) => updateOwner(index, "is_primary", v)}
                  />
                  <Label htmlFor={`primary-${index}`} className="text-xs">
                    Principal
                  </Label>
                </div>
                {owners.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOwner(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addOwner}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar copropietario
            </Button>
          </CardContent>
        </Card>

        {/* Características */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Características</CardTitle>
            <CardDescription>Revisá y ajustá los datos detectados por la IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de propiedad</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="departamento">Departamento</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="ph">PH</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                    <SelectItem value="cochera">Cochera</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem>
                    <SelectItem value="galpon">Galpón</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="alquilado">Alquilado</SelectItem>
                    <SelectItem value="vendido">Vendido</SelectItem>
                    <SelectItem value="reservado">Reservado</SelectItem>
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
                  value={formData.banos}
                  onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metros_cuadrados">m²</Label>
                <Input
                  id="metros_cuadrados"
                  type="number"
                  min="0"
                  value={formData.metros_cuadrados}
                  onChange={(e) => setFormData({ ...formData, metros_cuadrados: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="cochera"
                checked={formData.cochera}
                onCheckedChange={(v) => setFormData({ ...formData, cochera: v as boolean })}
              />
              <Label htmlFor="cochera">Tiene cochera</Label>
            </div>
          </CardContent>
        </Card>

        {/* Descripción */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descripción</CardTitle>
            <CardDescription>Descripción comercial generada por IA (podés editarla)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                id="descripcion"
                rows={4}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la propiedad..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas_internas">Notas internas (no se publican)</Label>
              <Textarea
                id="notas_internas"
                rows={2}
                value={formData.notas_internas}
                onChange={(e) => setFormData({ ...formData, notas_internas: e.target.value })}
                placeholder="Notas para uso interno..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => setStep("upload")}>
            Volver
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Crear Propiedad
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
