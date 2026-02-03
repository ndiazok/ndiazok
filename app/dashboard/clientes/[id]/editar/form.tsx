"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, User, FileText, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface Client {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  company_name: string | null
  tipo_persona: string | null
  dni: string | null
  cuit: string | null
  domicilio_legal: string | null
  localidad: string | null
  provincia: string | null
  codigo_postal: string | null
  nacionalidad: string | null
  estado_civil: string | null
  profesion: string | null
  fecha_nacimiento: string | null
  razon_social: string | null
  tipo_societario: string | null
  fecha_constitucion: string | null
  inscripcion_registral: string | null
  representante_legal_id: string | null
  datos_legales_completos: boolean
}

export function ClientEditForm({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    tipo_persona: "humana",
    // Persona humana
    dni: "",
    cuit: "",
    domicilio_legal: "",
    localidad: "",
    provincia: "",
    codigo_postal: "",
    nacionalidad: "Argentina",
    estado_civil: "",
    profesion: "",
    fecha_nacimiento: "",
    // Persona jurídica
    razon_social: "",
    tipo_societario: "",
    fecha_constitucion: "",
    inscripcion_registral: "",
  })

  useEffect(() => {
    fetchClient()
  }, [clientId])

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`)
      if (!res.ok) throw new Error("Error al cargar cliente")
      const data = await res.json()
      setClient(data)
      setFormData({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        company_name: data.company_name || "",
        tipo_persona: data.tipo_persona || "humana",
        dni: data.dni || "",
        cuit: data.cuit || "",
        domicilio_legal: data.domicilio_legal || "",
        localidad: data.localidad || "",
        provincia: data.provincia || "",
        codigo_postal: data.codigo_postal || "",
        nacionalidad: data.nacionalidad || "Argentina",
        estado_civil: data.estado_civil || "",
        profesion: data.profesion || "",
        fecha_nacimiento: data.fecha_nacimiento || "",
        razon_social: data.razon_social || "",
        tipo_societario: data.tipo_societario || "",
        fecha_constitucion: data.fecha_constitucion || "",
        inscripcion_registral: data.inscripcion_registral || "",
      })
    } catch (err) {
      setError("Error al cargar el cliente")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al guardar")
      }

      setSuccess("Cliente actualizado correctamente")
      setTimeout(() => router.push(`/dashboard/clientes/${clientId}`), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Calculate completeness
  const calculateCompleteness = () => {
    if (formData.tipo_persona === "humana") {
      const required = ["full_name", "dni", "cuit", "domicilio_legal", "localidad", "provincia", "estado_civil"]
      const filled = required.filter((f) => formData[f as keyof typeof formData])
      return Math.round((filled.length / required.length) * 100)
    } else {
      const required = [
        "razon_social",
        "cuit",
        "tipo_societario",
        "domicilio_legal",
        "localidad",
        "provincia",
        "inscripcion_registral",
      ]
      const filled = required.filter((f) => formData[f as keyof typeof formData])
      return Math.round((filled.length / required.length) * 100)
    }
  }

  if (isLoading) {
    return <div className="p-8">Cargando...</div>
  }

  if (!client) {
    return <div className="p-8">Cliente no encontrado</div>
  }

  const completeness = calculateCompleteness()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clientes/${clientId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Editar Cliente</h1>
          <p className="text-muted-foreground">Actualiza los datos del cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={completeness === 100 ? "default" : "secondary"}>{completeness}% completo</Badge>
        </div>
      </div>

      {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>}

      {success && <div className="bg-green-500/10 text-green-600 px-4 py-3 rounded-lg">{success}</div>}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basicos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basicos" className="gap-2">
              <User className="h-4 w-4" />
              Datos Básicos
            </TabsTrigger>
            <TabsTrigger value="legales" className="gap-2">
              <FileText className="h-4 w-4" />
              Datos Legales
            </TabsTrigger>
            <TabsTrigger value="domicilio" className="gap-2">
              <MapPin className="h-4 w-4" />
              Domicilio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basicos">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Datos de contacto del cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_persona">Tipo de Persona *</Label>
                    <Select value={formData.tipo_persona} onValueChange={(v) => updateField("tipo_persona", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="humana">Persona Humana</SelectItem>
                        <SelectItem value="juridica">Persona Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.tipo_persona === "humana" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nombre Completo *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => updateField("full_name", e.target.value)}
                        placeholder="Juan Carlos Pérez"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+54 351 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profesion">Profesión / Ocupación</Label>
                      <Input
                        id="profesion"
                        value={formData.profesion}
                        onChange={(e) => updateField("profesion", e.target.value)}
                        placeholder="Contador Público"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="razon_social">Razón Social *</Label>
                      <Input
                        id="razon_social"
                        value={formData.razon_social}
                        onChange={(e) => updateField("razon_social", e.target.value)}
                        placeholder="Empresa S.A."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo_societario">Tipo Societario *</Label>
                      <Select value={formData.tipo_societario} onValueChange={(v) => updateField("tipo_societario", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SA">Sociedad Anónima (S.A.)</SelectItem>
                          <SelectItem value="SRL">S.R.L.</SelectItem>
                          <SelectItem value="SAS">S.A.S.</SelectItem>
                          <SelectItem value="SCS">Sociedad en Comandita Simple</SelectItem>
                          <SelectItem value="SC">Sociedad Colectiva</SelectItem>
                          <SelectItem value="cooperativa">Cooperativa</SelectItem>
                          <SelectItem value="fundacion">Fundación</SelectItem>
                          <SelectItem value="asociacion">Asociación Civil</SelectItem>
                          <SelectItem value="consorcio">Consorcio de Propietarios</SelectItem>
                          <SelectItem value="fideicomiso">Fideicomiso</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Corporativo</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="contacto@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+54 351 123-4567"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legales">
            <Card>
              <CardHeader>
                <CardTitle>Datos Legales</CardTitle>
                <CardDescription>Información requerida para la generación de contratos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.tipo_persona === "humana" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dni">DNI *</Label>
                      <Input
                        id="dni"
                        value={formData.dni}
                        onChange={(e) => updateField("dni", e.target.value)}
                        placeholder="12.345.678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cuit">CUIT/CUIL *</Label>
                      <Input
                        id="cuit"
                        value={formData.cuit}
                        onChange={(e) => updateField("cuit", e.target.value)}
                        placeholder="20-12345678-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                      <Input
                        id="fecha_nacimiento"
                        type="date"
                        value={formData.fecha_nacimiento}
                        onChange={(e) => updateField("fecha_nacimiento", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nacionalidad">Nacionalidad</Label>
                      <Input
                        id="nacionalidad"
                        value={formData.nacionalidad}
                        onChange={(e) => updateField("nacionalidad", e.target.value)}
                        placeholder="Argentina"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado_civil">Estado Civil *</Label>
                      <Select value={formData.estado_civil} onValueChange={(v) => updateField("estado_civil", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soltero">Soltero/a</SelectItem>
                          <SelectItem value="casado">Casado/a</SelectItem>
                          <SelectItem value="divorciado">Divorciado/a</SelectItem>
                          <SelectItem value="viudo">Viudo/a</SelectItem>
                          <SelectItem value="union_convivencial">Unión Convivencial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cuit">CUIT *</Label>
                      <Input
                        id="cuit"
                        value={formData.cuit}
                        onChange={(e) => updateField("cuit", e.target.value)}
                        placeholder="30-12345678-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha_constitucion">Fecha de Constitución</Label>
                      <Input
                        id="fecha_constitucion"
                        type="date"
                        value={formData.fecha_constitucion}
                        onChange={(e) => updateField("fecha_constitucion", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="inscripcion_registral">Inscripción Registral *</Label>
                      <Textarea
                        id="inscripcion_registral"
                        value={formData.inscripcion_registral}
                        onChange={(e) => updateField("inscripcion_registral", e.target.value)}
                        placeholder="Inscripta en el Registro Público de Comercio bajo el número..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domicilio">
            <Card>
              <CardHeader>
                <CardTitle>Domicilio Legal</CardTitle>
                <CardDescription>Domicilio que figurará en los contratos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="domicilio_legal">Dirección *</Label>
                    <Input
                      id="domicilio_legal"
                      value={formData.domicilio_legal}
                      onChange={(e) => updateField("domicilio_legal", e.target.value)}
                      placeholder="Av. Colón 1234, Piso 5, Dpto. B"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localidad">Localidad *</Label>
                    <Input
                      id="localidad"
                      value={formData.localidad}
                      onChange={(e) => updateField("localidad", e.target.value)}
                      placeholder="Córdoba"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia *</Label>
                    <Select value={formData.provincia} onValueChange={(v) => updateField("provincia", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buenos Aires">Buenos Aires</SelectItem>
                        <SelectItem value="CABA">CABA</SelectItem>
                        <SelectItem value="Catamarca">Catamarca</SelectItem>
                        <SelectItem value="Chaco">Chaco</SelectItem>
                        <SelectItem value="Chubut">Chubut</SelectItem>
                        <SelectItem value="Córdoba">Córdoba</SelectItem>
                        <SelectItem value="Corrientes">Corrientes</SelectItem>
                        <SelectItem value="Entre Ríos">Entre Ríos</SelectItem>
                        <SelectItem value="Formosa">Formosa</SelectItem>
                        <SelectItem value="Jujuy">Jujuy</SelectItem>
                        <SelectItem value="La Pampa">La Pampa</SelectItem>
                        <SelectItem value="La Rioja">La Rioja</SelectItem>
                        <SelectItem value="Mendoza">Mendoza</SelectItem>
                        <SelectItem value="Misiones">Misiones</SelectItem>
                        <SelectItem value="Neuquén">Neuquén</SelectItem>
                        <SelectItem value="Río Negro">Río Negro</SelectItem>
                        <SelectItem value="Salta">Salta</SelectItem>
                        <SelectItem value="San Juan">San Juan</SelectItem>
                        <SelectItem value="San Luis">San Luis</SelectItem>
                        <SelectItem value="Santa Cruz">Santa Cruz</SelectItem>
                        <SelectItem value="Santa Fe">Santa Fe</SelectItem>
                        <SelectItem value="Santiago del Estero">Santiago del Estero</SelectItem>
                        <SelectItem value="Tierra del Fuego">Tierra del Fuego</SelectItem>
                        <SelectItem value="Tucumán">Tucumán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo_postal">Código Postal</Label>
                    <Input
                      id="codigo_postal"
                      value={formData.codigo_postal}
                      onChange={(e) => updateField("codigo_postal", e.target.value)}
                      placeholder="5000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Link href={`/dashboard/clientes/${clientId}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
