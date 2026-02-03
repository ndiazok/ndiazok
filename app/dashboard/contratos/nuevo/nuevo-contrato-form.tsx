"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Client {
  id: string
  full_name: string
  email: string
}

interface Property {
  id: string
  direccion: string
  ciudad: string
  precio_alquiler?: number
  moneda_alquiler?: string
}

function NuevoContratoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propiedadIdParam = searchParams?.get("propiedad") || ""
  
  const [clients, setClients] = useState<Client[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Form state
  // New client dialog state
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [savingClient, setSavingClient] = useState(false)
  const [newClientData, setNewClientData] = useState({
    full_name: "",
    email: "",
    phone: "",
    dni: "",
    direccion: "",
  })

  const [formData, setFormData] = useState({
    inquilino_id: "",
    propiedad_id: propiedadIdParam,
    pipeline_status: "reserva" as "reserva" | "documentacion" | "firma" | "activo",
    fecha_inicio: new Date().toISOString().split("T")[0],
    fecha_fin: "",
    duracion_meses: 24,
    monto_base: "",
    moneda: "ARS",
    dia_vencimiento: 10,
    deposito_monto: "",
    deposito_moneda: "ARS",
    honorarios_porcentaje: "",
    indice_ajuste: "icl",
    periodicidad_ajuste: 12,
    periodicidad_pago: "mensual",
    estado: "borrador" as "borrador" | "pendiente_firma" | "activo" | "finalizado" | "rescindido",
    notas_internas: "",
    // Datos de seña (si aplica)
    seña_monto: "",
    seña_fecha: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsRes, propertiesRes] = await Promise.all([
          fetch("/api/admin/clients"),
          fetch("/api/admin/properties"),
        ])

        if (clientsRes.ok) {
          const data = await clientsRes.json()
          setClients(data?.data || (Array.isArray(data) ? data : []))
        }

        if (propertiesRes.ok) {
          const data = await propertiesRes.json()
          const propsList = Array.isArray(data) ? data : []
          setProperties(propsList)
          
          // Si viene una propiedad por parámetro, establecer el monto sugerido
          if (propiedadIdParam) {
            const prop = propsList.find((p: Property) => p.id === propiedadIdParam)
            if (prop?.precio_alquiler) {
              setFormData(prev => ({
                ...prev,
                monto_base: prop.precio_alquiler?.toString() || "",
                moneda: prop.moneda_alquiler || "ARS",
              }))
            }
          }
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [propiedadIdParam])

  // Calcular fecha fin automáticamente cuando cambia duración o fecha inicio
  useEffect(() => {
    if (formData.fecha_inicio && formData.duracion_meses > 0) {
      const startDate = new Date(formData.fecha_inicio)
      startDate.setMonth(startDate.getMonth() + formData.duracion_meses)
      setFormData(prev => ({
        ...prev,
        fecha_fin: startDate.toISOString().split("T")[0]
      }))
    }
  }, [formData.fecha_inicio, formData.duracion_meses])

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateClient = async () => {
    if (!newClientData.full_name || !newClientData.email) {
      setError("Nombre y email son requeridos")
      return
    }

    setSavingClient(true)
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newClientData.full_name,
          email: newClientData.email,
          phone: newClientData.phone || null,
          dni: newClientData.dni || null,
          direccion: newClientData.direccion || null,
          role: "inquilino",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newClient = data.data || data
        
        // Add to clients list and select it
        setClients(prev => [...prev, newClient])
        setFormData(prev => ({ ...prev, inquilino_id: newClient.id }))
        
        // Reset and close dialog
        setNewClientData({ full_name: "", email: "", phone: "", dni: "", direccion: "" })
        setShowNewClientDialog(false)
      } else {
        const data = await res.json()
        setError(data.error || "Error al crear cliente")
      }
    } catch (err) {
      setError("Error al crear cliente")
    } finally {
      setSavingClient(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!formData.inquilino_id || !formData.propiedad_id || !formData.monto_base) {
      setError("Completa todos los campos requeridos")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        inquilino_id: formData.inquilino_id,
        propiedad_id: formData.propiedad_id,
        tipo: formData.tipo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        duracion_meses: formData.duracion_meses,
        monto_base: parseFloat(formData.monto_base),
        moneda: formData.moneda,
        dia_vencimiento: formData.dia_vencimiento,
        deposito_monto: formData.deposito_monto ? parseFloat(formData.deposito_monto) : null,
        honorarios_porcentaje: formData.honorarios_porcentaje ? parseFloat(formData.honorarios_porcentaje) : null,
        indice_ajuste: formData.indice_ajuste,
        periodicidad_ajuste: formData.periodicidad_ajuste,
        estado: formData.estado,
        notas_internas: formData.notas_internas || null,
        seña_monto: formData.seña_monto ? parseFloat(formData.seña_monto) : null,
        seña_fecha: formData.seña_monto ? formData.seña_fecha : null,
      }

      const res = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push("/dashboard/contratos")
      } else {
        const data = await res.json()
        setError(data.error || "Error al crear contrato")
      }
    } catch (err) {
      setError("Error al crear contrato")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Contrato</h1>
          <p className="text-muted-foreground">Complete los datos del contrato de alquiler</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">Datos Generales</TabsTrigger>
            <TabsTrigger value="economico">Condiciones Económicas</TabsTrigger>
            <TabsTrigger value="sena">Seña / Reserva</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Partes del Contrato</CardTitle>
                <CardDescription>Seleccione el inquilino y la propiedad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Inquilino *</Label>
                    <Select 
                      value={formData.inquilino_id} 
                      onValueChange={(v) => handleChange("inquilino_id", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar inquilino" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.full_name || client.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="h-auto p-0 text-xs"
                      onClick={() => setShowNewClientDialog(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Crear nuevo cliente
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Propiedad *</Label>
                    <Select 
                      value={formData.propiedad_id} 
                      onValueChange={(v) => {
                        handleChange("propiedad_id", v)
                        const prop = properties.find(p => p.id === v)
                        if (prop?.precio_alquiler) {
                          handleChange("monto_base", prop.precio_alquiler.toString())
                          handleChange("moneda", prop.moneda_alquiler || "ARS")
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar propiedad" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.direccion}, {property.ciudad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de contrato</Label>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(v) => handleChange("tipo", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alquiler">Alquiler</SelectItem>
                        <SelectItem value="venta">Venta</SelectItem>
                        <SelectItem value="alquiler_temporario">Alquiler Temporario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select 
                      value={formData.estado} 
                      onValueChange={(v) => handleChange("estado", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="borrador">Borrador</SelectItem>
                        <SelectItem value="pendiente_firma">Pendiente de Firma</SelectItem>
                        <SelectItem value="activo">Activo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vigencia</CardTitle>
                <CardDescription>Fechas y duración del contrato</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de inicio *</Label>
                    <Input
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => handleChange("fecha_inicio", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duración (meses)</Label>
                    <Select 
                      value={formData.duracion_meses.toString()} 
                      onValueChange={(v) => handleChange("duracion_meses", parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 meses</SelectItem>
                        <SelectItem value="12">12 meses</SelectItem>
                        <SelectItem value="24">24 meses</SelectItem>
                        <SelectItem value="36">36 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de fin</Label>
                    <Input
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => handleChange("fecha_fin", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="economico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monto y Pagos</CardTitle>
                <CardDescription>Condiciones económicas del alquiler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Monto mensual *</Label>
                    <Input
                      type="number"
                      value={formData.monto_base}
                      onChange={(e) => handleChange("monto_base", e.target.value)}
                      placeholder="Ej: 150000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select 
                      value={formData.moneda} 
                      onValueChange={(v) => handleChange("moneda", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">ARS (Pesos)</SelectItem>
                        <SelectItem value="USD">USD (Dólares)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Día de vencimiento</Label>
                    <Select 
                      value={formData.dia_vencimiento.toString()} 
                      onValueChange={(v) => handleChange("dia_vencimiento", parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 5, 10, 15, 20, 25].map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            Día {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Depósito de garantía</Label>
                    <Input
                      type="number"
                      value={formData.deposito_monto}
                      onChange={(e) => handleChange("deposito_monto", e.target.value)}
                      placeholder="Ej: 300000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Comisión inmobiliaria</Label>
                    <Input
                      type="number"
                      value={formData.honorarios_porcentaje}
                      onChange={(e) => handleChange("honorarios_porcentaje", e.target.value)}
                      placeholder="Ej: 150000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ajustes</CardTitle>
                <CardDescription>Índice y período de actualización</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Índice de ajuste</Label>
                    <Select 
                      value={formData.indice_ajuste} 
                      onValueChange={(v) => handleChange("indice_ajuste", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="icl">ICL (Índice de Contratos de Locación)</SelectItem>
                        <SelectItem value="ipc">IPC (Índice de Precios al Consumidor)</SelectItem>
                        <SelectItem value="uva">UVA</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Período de ajuste</Label>
                    <Select 
                      value={formData.periodicidad_ajuste.toString()} 
                      onValueChange={(v) => handleChange("periodicidad_ajuste", parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Trimestral (3 meses)</SelectItem>
                        <SelectItem value="4">Cuatrimestral (4 meses)</SelectItem>
                        <SelectItem value="6">Semestral (6 meses)</SelectItem>
                        <SelectItem value="12">Anual (12 meses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sena" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seña / Reserva</CardTitle>
                <CardDescription>Registrar el pago de seña o reserva (opcional)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monto de seña</Label>
                    <Input
                      type="number"
                      value={formData.seña_monto}
                      onChange={(e) => handleChange("seña_monto", e.target.value)}
                      placeholder="Ej: 50000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de seña</Label>
                    <Input
                      type="date"
                      value={formData.seña_fecha}
                      onChange={(e) => handleChange("seña_fecha", e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label>Notas</Label>
                  <Textarea
value={formData.notas_internas}
                onChange={(e) => handleChange("notas_internas", e.target.value)}
                    placeholder="Notas adicionales sobre el contrato..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Contrato"
            )}
          </Button>
        </div>
      </form>

      {/* Dialog para crear nuevo cliente */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo inquilino
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input
                value={newClientData.full_name}
                onChange={(e) => setNewClientData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Ej: juan@email.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ej: 351-123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>DNI / CUIT</Label>
                <Input
                  value={newClientData.dni}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, dni: e.target.value }))}
                  placeholder="Ej: 12345678"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={newClientData.direccion}
                onChange={(e) => setNewClientData(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Ej: Av. Colón 1234"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowNewClientDialog(false)}
              disabled={savingClient}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateClient}
              disabled={savingClient || !newClientData.full_name || !newClientData.email}
            >
              {savingClient ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default NuevoContratoPage
