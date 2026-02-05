"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  Edit,
  MoreHorizontal,
  Users,
  FileText,
  ImageIcon,
  Wrench,
  MapPin,
  Home,
  DollarSign,
  Key,
  Globe,
  Plus,
  Trash2,
  Upload,
  File,
  Download,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  MessageSquare, // Added import for MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SortableImages } from "@/components/dashboard/sortable-images"

interface Property {
  id: string
  direccion: string
  ciudad: string
  provincia: string
  tipo: string
  estado: string
  ambientes: number
  dormitorios: number
  banos: number
  metros_cuadrados: number
  cochera: boolean
  notas_internas: string
  en_alquiler: boolean
  precio_alquiler: number
  moneda_alquiler: string
  en_venta: boolean
  precio_venta: number
  moneda_venta: string
  publicar_web: boolean
  en_administracion: boolean
  created_at: string
  property_owners: Array<{
    id: string
    person_id: string
    ownership_percentage: number
    is_primary: boolean
    person: { id: string; full_name: string; email: string; phone: string }
  }>
  images: Array<{
    id: string
    url: string
    titulo?: string
    descripcion?: string
    es_principal: boolean
    orden: number
  }>
  documents: Array<{
    id: string
    name: string
    document_type: string
    url: string
    file_type: string
    file_size: number
    notes: string
    created_at: string
  }>
  contracts: Array<{
    id: string
    fecha_inicio: string
    fecha_fin: string
    monto_base: number
    moneda: string
    estado: string
    contract_participants: Array<{
      party_role: string
      person: { id: string; full_name: string }
    }>
  }>
  repairs: Array<{
    id: string
    descripcion: string
    estado: string
    costo_estimado: number
    costo_final: number
    moneda: string
    created_at: string
    profesional: { id: string; full_name: string } | null
  }>
}

interface NewImage {
  file: File | null
  alt_text: string
  is_cover: boolean
}

function PropertyDetailContent({ id }: { id: string }) {
  const router = useRouter()
  
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showDocDialog, setShowDocDialog] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [newDoc, setNewDoc] = useState<{ file: File | null; name: string; document_type: string; notes: string }>({
    file: null,
    name: "",
    document_type: "contrato",
    notes: "",
  })
  const [newImage, setNewImage] = useState<NewImage>({
    file: null,
    alt_text: "",
    is_cover: false
  })
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  
  const micrositeUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/p/${id}` 
    : `/p/${id}`

  const copyMicrositeLink = async () => {
    await navigator.clipboard.writeText(micrositeUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const registerEvent = async (tipo: string) => {
    try {
      await fetch(`/api/admin/properties/${id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_type: tipo }),
      })
      alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada correctamente`)
    } catch (error) {
      console.error("Error registering event:", error)
    }
  }

  const fetchProperty = async () => {
    try {
      const res = await fetch(`/api/admin/properties/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar propiedad")
      setProperty(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const addImages = async () => {
    if (selectedFiles.length === 0) return
    setUploadingImage(true)
    setUploadProgress(0)
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append("file", file)
        formData.append("orden", i.toString())

        const res = await fetch(`/api/admin/properties/${id}/images`, {
          method: "POST",
          body: formData,
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Error al agregar imagen")
        }
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100))
      }
      
      setShowImageDialog(false)
      setSelectedFiles([])
      if (imageInputRef.current) imageInputRef.current.value = ""
      fetchProperty()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error")
    } finally {
      setUploadingImage(false)
      setUploadProgress(0)
    }
  }

  const setCoverImage = async (imageId: string) => {
    try {
      const res = await fetch(`/api/admin/properties/${id}/images/${imageId}/cover`, {
        method: "PUT",
      })
      if (!res.ok) throw new Error("Error al establecer portada")
      fetchProperty()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error")
    }
  }

  const deleteImage = async (imageId: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return
    try {
      const res = await fetch(`/api/admin/properties/${id}/images?imageId=${imageId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error al eliminar imagen")
      fetchProperty()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error")
    }
  }

  const addDocument = async () => {
    if (!newDoc.file || !newDoc.name) return
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append("file", newDoc.file)
      formData.append("name", newDoc.name)
      formData.append("document_type", newDoc.document_type)
      formData.append("notes", newDoc.notes)

      const res = await fetch(`/api/admin/properties/${id}/documents`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al agregar documento")
      }
      setShowDocDialog(false)
      setNewDoc({ file: null, name: "", document_type: "contrato", notes: "" })
      if (docInputRef.current) docInputRef.current.value = ""
      fetchProperty()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error")
    } finally {
      setUploadingDoc(false)
    }
  }

  const deleteDocument = async (docId: string) => {
    if (!confirm("¿Eliminar este documento?")) return
    try {
      const res = await fetch(`/api/admin/properties/${id}/documents?docId=${docId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error al eliminar documento")
      fetchProperty()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contrato: "Contrato",
      plano: "Plano",
      escritura: "Escritura",
      impuesto: "Impuesto",
      expensa: "Expensa",
      recibo: "Recibo",
      factura: "Factura",
      presupuesto: "Presupuesto",
      nota: "Nota",
      expediente: "Expediente",
      otro: "Otro",
    }
    return labels[type] || type
  }

  useEffect(() => {
    if (id) {
      fetchProperty()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error || "Propiedad no encontrada"}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }

  const coverImage = property.images?.find((img) => img.es_principal) || property.images?.[0]
  const activeContract = property.contracts?.find((c) => c.estado === "activo")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{property.direccion}</h1>
              <div className="flex gap-1.5">
                {property.en_venta && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    En Venta
                  </Badge>
                )}
                {property.en_alquiler && (
                  <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                    En Alquiler
                  </Badge>
                )}
                {property.en_administracion && (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    Administrada
                  </Badge>
                )}
                {!property.en_venta && !property.en_alquiler && (
                  <Badge variant="secondary">Sin comercializar</Badge>
                )}
              </div>
            </div>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {property.ciudad}, {property.provincia}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
{/* Botón para tomar seña / pipeline */}
  <Button 
    variant="default" 
    onClick={() => router.push(`/dashboard/contratos/nuevo?propiedad=${id}`)}
  >
    <Key className="mr-2 h-4 w-4" />
    Tomar Seña
  </Button>
<Button 
    variant="outline" 
    onClick={() => router.push(`/dashboard/propiedades/${id}/editar`)}
  >
    <Edit className="mr-2 h-4 w-4" />
    Editar
  </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/contratos/nuevo?propiedad=${id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Nuevo contrato
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => registerEvent("consulta")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Registrar consulta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => registerEvent("visita")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Registrar visita
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => registerEvent("reserva")}>
                <Key className="mr-2 h-4 w-4" />
                Registrar reserva
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {property.publicar_web && (
                <>
                  <DropdownMenuItem asChild>
                    <a href={micrositeUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver micrositio
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyMicrositeLink}>
                    {copiedLink ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copiedLink ? "Link copiado!" : "Copiar link"}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(micrositeUrl)}`} download={`qr-${property.direccion}.png`} target="_blank">
                      <QrCode className="mr-2 h-4 w-4" />
                      Descargar QR
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar propiedad
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover image and badges */}
          <Card>
            <CardContent className="p-0">
              {coverImage ? (
                <img
                  src={coverImage.url || "/placeholder.svg"}
                  alt={coverImage.alt_text || property.direccion}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-64 bg-muted flex items-center justify-center rounded-t-lg">
                  <Building2 className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <div className="p-4 flex flex-wrap gap-2">
                <Badge variant="outline">{property.tipo}</Badge>
                <Badge variant={property.estado === "disponible" ? "default" : "secondary"}>{property.estado}</Badge>
                {property.en_alquiler && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Key className="mr-1 h-3 w-3" />
                    Alquiler: {property.moneda_alquiler} {property.precio_alquiler?.toLocaleString()}
                  </Badge>
                )}
                {property.en_venta && (
                  <Badge className="bg-green-100 text-green-800">
                    <DollarSign className="mr-1 h-3 w-3" />
                    Venta: {property.moneda_venta} {property.precio_venta?.toLocaleString()}
                  </Badge>
                )}
                {property.publicar_web && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Globe className="mr-1 h-3 w-3" />
                    Publicada
                  </Badge>
                )}
                {property.en_administracion && (
                  <Badge className="bg-orange-100 text-orange-800">
                    <Building2 className="mr-1 h-3 w-3" />
                    En administración
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">
                <Home className="mr-2 h-4 w-4" />
                Info
              </TabsTrigger>
              <TabsTrigger value="fotos">
                <ImageIcon className="mr-2 h-4 w-4" />
                Fotos ({property.images?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="documentos">
                <FileText className="mr-2 h-4 w-4" />
                Docs ({property.documents?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="reparaciones">
                <Wrench className="mr-2 h-4 w-4" />
                Reparaciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Características</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ambientes</p>
                      <p className="font-medium">{property.ambientes || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dormitorios</p>
                      <p className="font-medium">{property.dormitorios || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Baños</p>
                      <p className="font-medium">{property.banos || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cochera</p>
                      <p className="font-medium">{property.cochera ? "Sí" : "No"}</p>
                    </div>
                    <div>
<p className="text-sm text-muted-foreground">Superficie</p>
  <p className="font-medium">
  {property.metros_cuadrados ? `${property.metros_cuadrados} m²` : "-"}
  </p>
  </div>
                  </div>
                </CardContent>
              </Card>

              {property.notas_internas && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notas internas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{property.notas_internas}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="fotos" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {property.images?.length || 0} {property.images?.length === 1 ? "foto" : "fotos"}
                </p>
                <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Subir foto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Subir fotos</DialogTitle>
                      <DialogDescription>Seleccioná una o más imágenes para subir</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Archivos de imagen *</Label>
                        <Input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*,.heic,.heif"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            setSelectedFiles(files)
                          }}
                        />
                        {selectedFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-medium">{selectedFiles.length} archivo(s) seleccionado(s)</p>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {selectedFiles.map((file, i) => (
                                <p key={i} className="text-xs text-muted-foreground">
                                  {file.name} ({formatFileSize(file.size)})
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {uploadingImage && uploadProgress > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Subiendo...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300" 
                              style={{ width: `${uploadProgress}%` }} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setShowImageDialog(false); setSelectedFiles([]) }} disabled={uploadingImage}>
                        Cancelar
                      </Button>
                      <Button onClick={addImages} disabled={selectedFiles.length === 0 || uploadingImage}>
                        {uploadingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo {uploadProgress}%
                          </>
                        ) : (
                          `Subir ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}`
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <SortableImages 
                images={property.images || []} 
                propertyId={id as string} 
                onUpdate={fetchProperty} 
              />
            </TabsContent>

            <TabsContent value="documentos" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {property.documents?.length || 0} {property.documents?.length === 1 ? "documento" : "documentos"}
                </p>
                <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Subir documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Subir documento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Archivo *</Label>
                        <Input
                          ref={docInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setNewDoc({ ...newDoc, file, name: newDoc.name || file.name.replace(/\.[^/.]+$/, "") })
                            }
                          }}
                        />
                        {newDoc.file && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {newDoc.file.name} ({formatFileSize(newDoc.file.size)})
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Nombre *</Label>
                        <Input
                          value={newDoc.name}
                          onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                          placeholder="Ej: Contrato de alquiler 2026"
                        />
                      </div>
                      <div>
                        <Label>Tipo de documento</Label>
                        <Select
                          value={newDoc.document_type}
                          onValueChange={(v) => setNewDoc({ ...newDoc, document_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contrato">Contrato</SelectItem>
                            <SelectItem value="plano">Plano</SelectItem>
                            <SelectItem value="escritura">Escritura</SelectItem>
                            <SelectItem value="impuesto">Impuesto/Tasa</SelectItem>
                            <SelectItem value="expensa">Expensa</SelectItem>
                            <SelectItem value="recibo">Recibo</SelectItem>
                            <SelectItem value="factura">Factura</SelectItem>
                            <SelectItem value="presupuesto">Presupuesto</SelectItem>
                            <SelectItem value="nota">Nota</SelectItem>
                            <SelectItem value="expediente">Expediente</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Notas</Label>
                        <Textarea
                          value={newDoc.notes}
                          onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
                          placeholder="Observaciones..."
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDocDialog(false)} disabled={uploadingDoc}>
                        Cancelar
                      </Button>
                      <Button onClick={addDocument} disabled={!newDoc.file || !newDoc.name || uploadingDoc}>
                        {uploadingDoc ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          "Subir"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {!property.documents?.length ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No hay documentos cargados</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {property.documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <File className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {getDocTypeLabel(doc.document_type)}
                              </Badge>
                              {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                              <span>{new Date(doc.created_at).toLocaleDateString("es-AR")}</span>
                            </div>
                            {doc.notes && <p className="text-sm text-muted-foreground mt-1">{doc.notes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteDocument(doc.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reparaciones" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Historial de reparaciones</p>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/reparaciones/nuevo?propiedad=${id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva reparación
                  </Link>
                </Button>
              </div>

              {!property.repairs?.length ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Wrench className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No hay reparaciones registradas</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {property.repairs.map((repair) => (
                    <Card key={repair.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{repair.descripcion}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Badge
                                variant={
                                  repair.estado === "completado"
                                    ? "default"
                                    : repair.estado === "en_progreso"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {repair.estado}
                              </Badge>
                              {repair.profesional && <span>Por: {repair.profesional.full_name}</span>}
                              <span>{new Date(repair.created_at).toLocaleDateString("es-AR")}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            {repair.costo_final ? (
                              <p className="font-medium">
                                {repair.moneda} {repair.costo_final.toLocaleString()}
                              </p>
                            ) : repair.costo_estimado ? (
                              <p className="text-muted-foreground">
                                Est: {repair.moneda} {repair.costo_estimado.toLocaleString()}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Propietarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Propietarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {property.property_owners?.length ? (
                <div className="space-y-3">
                  {property.property_owners.map((owner) => (
                    <div key={owner.id} className="flex items-center justify-between">
                      <div>
                        <Link href={`/dashboard/clientes/${owner.person_id}`} className="font-medium hover:underline">
                          {owner.person?.full_name || "Sin nombre"}
                        </Link>
                        {owner.is_primary && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Principal
                          </Badge>
                        )}
                        <p className="text-sm text-muted-foreground">{owner.ownership_percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Sin propietarios asignados</p>
              )}
            </CardContent>
          </Card>

          {/* Contrato activo */}
          {activeContract && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Contrato Activo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Período</span>
                    <span className="text-sm">
                      {new Date(activeContract.fecha_inicio).toLocaleDateString("es-AR")} -{" "}
                      {new Date(activeContract.fecha_fin).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monto</span>
                    <span className="text-sm font-medium">
                      {activeContract.moneda} {activeContract.monto_base.toLocaleString()}
                    </span>
                  </div>
                  {activeContract.contract_participants
                    ?.filter((p) => p.party_role === "INQUILINO")
                    .map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Inquilino</span>
                        <Link href={`/dashboard/clientes/${p.person?.id}`} className="text-sm hover:underline">
                          {p.person?.full_name}
                        </Link>
                      </div>
                    ))}
                  <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent" asChild>
                    <Link href={`/dashboard/contratos/${activeContract.id}`}>Ver contrato</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Creado</span>
                <span>{new Date(property.created_at).toLocaleDateString("es-AR")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{property.id.slice(0, 8)}...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function PropertyDetailClient({ id }: { id: string }) {
  return <PropertyDetailContent id={id} />
}
