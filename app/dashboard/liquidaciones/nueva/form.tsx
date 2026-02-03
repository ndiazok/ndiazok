"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, FileText, AlertCircle, User, Building, Calendar } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Propietario {
  id: string
  full_name: string
  email: string
}

interface Propiedad {
  id: string
  direccion: string
  ciudad: string
}

export function LiquidacionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propietarioIdParam = searchParams.get("propietario")

  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [resultado, setResultado] = useState<any>(null)

  const [formData, setFormData] = useState({
    propietario_id: propietarioIdParam || "defaultPropietarioId",
    propiedad_id: "", // Vacío = todas las propiedades
    periodo_desde: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split("T")[0],
    periodo_hasta: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split("T")[0],
    notas: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      // Obtener propietarios (clientes con rol propietario)
      const clientsRes = await fetch("/api/admin/clients")
      if (clientsRes.ok) {
        const clients = await clientsRes.json()
        // Filtrar por roles de propietario
        const props = clients.filter(
          (c: any) => c.roles?.includes("propietario") || c.role === "propietario" || !c.role,
        )
        setPropietarios(clients) // Por ahora todos, después filtrar
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchPropiedades = async () => {
      if (!formData.propietario_id) {
        setPropiedades([])
        return
      }

      // Obtener propiedades del propietario
      const propsRes = await fetch("/api/admin/properties")
      if (propsRes.ok) {
        const allProps = await propsRes.json()
        // Filtrar propiedades donde este usuario es propietario
        const userProps = allProps.filter((p: any) =>
          p.property_owners?.some((o: any) => o.person_id === formData.propietario_id),
        )
        setPropiedades(userProps)
      }
    }

    fetchPropiedades()
  }, [formData.propietario_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.propietario_id) {
      setError("Selecciona un propietario")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const res = await fetch("/api/admin/finance/liquidations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propietario_id: formData.propietario_id,
          propiedad_id: formData.propiedad_id || null,
          periodo_desde: formData.periodo_desde,
          periodo_hasta: formData.periodo_hasta,
          notas: formData.notas,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al generar liquidación")
      }

      setResultado(data)
      // Redirigir a la liquidación generada
      router.push(`/dashboard/liquidaciones/${data.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/liquidaciones">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nueva Liquidación</h1>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/liquidaciones">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nueva Liquidación</h1>
          <p className="text-muted-foreground">Genera una liquidación para un propietario</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Selección de propietario y propiedad */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Propietario
              </CardTitle>
              <CardDescription>Selecciona el propietario a liquidar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="propietario">Propietario *</Label>
                <Select
                  value={formData.propietario_id}
                  onValueChange={(v) => setFormData({ ...formData, propietario_id: v, propiedad_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un propietario" />
                  </SelectTrigger>
                  <SelectContent>
                    {propietarios.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name} ({p.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.propietario_id && (
                <div className="space-y-2">
                  <Label htmlFor="propiedad">Propiedad (opcional)</Label>
                  <Select
                    value={formData.propiedad_id}
                    onValueChange={(v) => setFormData({ ...formData, propiedad_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las propiedades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las propiedades</SelectItem>
                      {propiedades.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.direccion}, {p.ciudad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Deja en blanco para liquidar todas las propiedades del propietario
                  </p>
                </div>
              )}

              {propiedades.length > 0 && (
                <div className="pt-2">
                  <Label className="text-muted-foreground text-xs">Propiedades encontradas</Label>
                  <div className="mt-2 space-y-2">
                    {propiedades.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {p.direccion}, {p.ciudad}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Período y opciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </CardTitle>
              <CardDescription>Define el período a liquidar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desde">Desde *</Label>
                  <Input
                    id="desde"
                    type="date"
                    value={formData.periodo_desde}
                    onChange={(e) => setFormData({ ...formData, periodo_desde: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hasta">Hasta *</Label>
                  <Input
                    id="hasta"
                    type="date"
                    value={formData.periodo_hasta}
                    onChange={(e) => setFormData({ ...formData, periodo_hasta: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas (opcional)</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Observaciones para esta liquidación..."
                  rows={3}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">La liquidación incluirá:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>+ Alquileres cobrados en el período</li>
                  <li>- Honorarios de administración</li>
                  <li>- Reparaciones a cargo del propietario</li>
                  <li>- Otros gastos del período</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1 bg-transparent" asChild>
                  <Link href="/dashboard/liquidaciones">Cancelar</Link>
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving || !formData.propietario_id}>
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generar Liquidación
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
