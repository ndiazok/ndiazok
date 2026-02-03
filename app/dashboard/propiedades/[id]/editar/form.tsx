"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface Client {
  id: string
  full_name: string
  email: string
}

interface Owner {
  person_id: string
  share_pct: number
  is_primary: boolean
}

export default function PropertyEditForm({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [clients, setClients] = useState<Client[]>([])

  // Property data
  const [direccion, setDireccion] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [provincia, setProvincia] = useState("")
  const [tipo, setTipo] = useState("departamento")
  const [estado, setEstado] = useState("disponible")
  const [ambientes, setAmbientes] = useState<number | "">("")
  const [dormitorios, setDormitorios] = useState<number | "">("")
  const [banos, setBanos] = useState<number | "">("")
  const [metrosCuadrados, setMetrosCuadrados] = useState<number | "">("")
  const [cochera, setCochera] = useState(false)
  const [notasInternas, setNotasInternas] = useState("")

  // Commercial
  const [enAlquiler, setEnAlquiler] = useState(false)
  const [precioAlquiler, setPrecioAlquiler] = useState<number | "">("")
  const [monedaAlquiler, setMonedaAlquiler] = useState("ARS")
  const [enVenta, setEnVenta] = useState(false)
  const [precioVenta, setPrecioVenta] = useState<number | "">("")
  const [monedaVenta, setMonedaVenta] = useState("USD")
  const [publicarWeb, setPublicarWeb] = useState(false)
  const [enAdministracion, setEnAdministracion] = useState(false)

  // Owners
  const [owners, setOwners] = useState<Owner[]>([])

  useEffect(() => {
    Promise.all([fetchProperty(), fetchClients()])
  }, [id])

  const fetchProperty = async () => {
    try {
      const res = await fetch(`/api/admin/properties/${id}`)
      if (!res.ok) throw new Error("Error al cargar propiedad")
      const data = await res.json()

      setDireccion(data.direccion || "")
      setCiudad(data.ciudad || "")
      setProvincia(data.provincia || "")
      setTipo(data.tipo || "departamento")
      setEstado(data.estado || "disponible")
      setAmbientes(data.ambientes || "")
      setDormitorios(data.dormitorios || "")
      setBanos(data.banos || "")
      setMetrosCuadrados(data.metros_cuadrados || "")
      setCochera(data.cochera || false)
      setNotasInternas(data.notas_internas || "")

      setEnAlquiler(data.en_alquiler || false)
      setPrecioAlquiler(data.precio_alquiler || "")
      setMonedaAlquiler(data.moneda_alquiler || "ARS")
      setEnVenta(data.en_venta || false)
      setPrecioVenta(data.precio_venta || "")
      setMonedaVenta(data.moneda_venta || "USD")
      setPublicarWeb(data.publicar_web || false)
      setEnAdministracion(data.en_administracion || false)

      if (data.property_owners?.length > 0) {
        setOwners(
          data.property_owners.map((o: any) => ({
            person_id: o.person_id,
            share_pct: o.share_pct,
            is_primary: o.is_primary,
          })),
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/admin/clients")
      if (!res.ok) throw new Error("Error al cargar clientes")
      const data = await res.json()
      setClients(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      console.error("Error fetching clients:", err)
    }
  }

  const addOwner = () => {
    setOwners([...owners, { person_id: "", share_pct: 100, is_primary: owners.length === 0 }])
  }

  const removeOwner = (index: number) => {
    const newOwners = owners.filter((_, i) => i !== index)
    if (newOwners.length > 0 && !newOwners.some((o) => o.is_primary)) {
      newOwners[0].is_primary = true
    }
    setOwners(newOwners)
  }

  const updateOwner = (index: number, field: keyof Owner, value: any) => {
    const newOwners = [...owners]
    newOwners[index] = { ...newOwners[index], [field]: value }

    if (field === "is_primary" && value === true) {
      newOwners.forEach((o, i) => {
        if (i !== index) o.is_primary = false
      })
    }

    setOwners(newOwners)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direccion,
          ciudad,
          provincia,
          tipo,
          estado,
          ambientes: ambientes || null,
          dormitorios: dormitorios || null,
          banos: banos || null,
          metros_cuadrados: metrosCuadrados || null,
          cochera,
          notas_internas: notasInternas || null,
          en_alquiler: enAlquiler,
          precio_alquiler: enAlquiler ? precioAlquiler || null : null,
          moneda_alquiler: enAlquiler ? monedaAlquiler : "ARS",
          en_venta: enVenta,
          precio_venta: enVenta ? precioVenta || null : null,
          moneda_venta: enVenta ? monedaVenta : "USD",
          publicar_web: publicarWeb,
          en_administracion: enAdministracion,
          owners: owners.filter((o) => o.person_id),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al guardar")
      }

      router.push(`/dashboard/propiedades/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Editar Propiedad</h1>
          <p className="text-muted-foreground">{direccion}</p>
        </div>
      </div>

      {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Dirección *</Label>
              <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ciudad *</Label>
                <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} required />
              </div>
              <div>
                <Label>Provincia *</Label>
                <Input value={provincia} onChange={(e) => setProvincia(e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Propietarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Propietarios</CardTitle>
            <CardDescription>Personas dueñas del inmueble</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {owners.map((owner, index) => (
              <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label>Propietario</Label>
                  <Select value={owner.person_id} onValueChange={(v) => updateOwner(index, "person_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
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
                <div className="w-24">
                  <Label>% Participación</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={owner.share_pct}
                    onChange={(e) => updateOwner(index, "share_pct", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={owner.is_primary} onCheckedChange={(v) => updateOwner(index, "is_primary", v)} />
                  <Label className="text-xs">Principal</Label>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOwner(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addOwner}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar propietario
            </Button>
          </CardContent>
        </Card>

        {/* Características */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Características</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="departamento">Departamento</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="ph">PH</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                    <SelectItem value="galpon">Galpón</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem>
                    <SelectItem value="cochera">Cochera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="ocupado">Ocupado</SelectItem>
                    <SelectItem value="reservado">Reservado</SelectItem>
                    <SelectItem value="en_refaccion">En refacción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Ambientes</Label>
                <Input
                  type="number"
                  min="0"
                  value={ambientes}
                  onChange={(e) => setAmbientes(e.target.value ? Number.parseInt(e.target.value) : "")}
                />
              </div>
              <div>
                <Label>Dormitorios</Label>
                <Input
                  type="number"
                  min="0"
                  value={dormitorios}
                  onChange={(e) => setDormitorios(e.target.value ? Number.parseInt(e.target.value) : "")}
                />
              </div>
              <div>
                <Label>Baños</Label>
                <Input
                  type="number"
                  min="0"
                  value={banos}
                  onChange={(e) => setBanos(e.target.value ? Number.parseInt(e.target.value) : "")}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch checked={cochera} onCheckedChange={setCochera} />
                <Label>Cochera</Label>
              </div>
            </div>
            <div>
              <Label>Superficie (m²)</Label>
              <Input
                type="number"
                min="0"
                value={metrosCuadrados}
                onChange={(e) => setMetrosCuadrados(e.target.value ? Number.parseInt(e.target.value) : "")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Comercialización */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comercialización</CardTitle>
            <CardDescription>Opciones de venta, alquiler y administración</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alquiler */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">En alquiler</Label>
                  <p className="text-sm text-muted-foreground">Esta propiedad está disponible para alquilar</p>
                </div>
                <Switch checked={enAlquiler} onCheckedChange={setEnAlquiler} />
              </div>
              {enAlquiler && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                  <div>
                    <Label>Precio de alquiler</Label>
                    <Input
                      type="number"
                      min="0"
                      value={precioAlquiler}
                      onChange={(e) => setPrecioAlquiler(e.target.value ? Number.parseFloat(e.target.value) : "")}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Moneda</Label>
                    <Select value={monedaAlquiler} onValueChange={setMonedaAlquiler}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                        <SelectItem value="USD">Dólares (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Venta */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">En venta</Label>
                  <p className="text-sm text-muted-foreground">Esta propiedad está disponible para vender</p>
                </div>
                <Switch checked={enVenta} onCheckedChange={setEnVenta} />
              </div>
              {enVenta && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                  <div>
                    <Label>Precio de venta</Label>
                    <Input
                      type="number"
                      min="0"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(e.target.value ? Number.parseFloat(e.target.value) : "")}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Moneda</Label>
                    <Select value={monedaVenta} onValueChange={setMonedaVenta}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                        <SelectItem value="USD">Dólares (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Publicar web */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Publicar en web</Label>
                <p className="text-sm text-muted-foreground">Mostrar en la página pública de propiedades</p>
              </div>
              <Switch checked={publicarWeb} onCheckedChange={setPublicarWeb} />
            </div>

            {/* En administración */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">En administración</Label>
                <p className="text-sm text-muted-foreground">Sigma administra esta propiedad</p>
              </div>
              <Switch checked={enAdministracion} onCheckedChange={setEnAdministracion} />
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas internas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notasInternas}
              onChange={(e) => setNotasInternas(e.target.value)}
              placeholder="Observaciones, detalles importantes..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
