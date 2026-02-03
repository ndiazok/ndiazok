"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  full_name: string
  email: string
}

interface Participant {
  id?: string
  personId: string
  role: string
  person?: {
    id: string
    full_name: string
    email: string
  }
}

interface Contrato {
  id: string
  fecha_inicio: string
  fecha_fin: string
  monto_base: number
  moneda: string
  indice_ajuste: string | null
  periodicidad_ajuste: number
  dia_vencimiento: number
  deposito_monto: number
  deposito_moneda: string
  garantia_tipo: string | null
  garantia_detalle: string | null
  honorarios_porcentaje: number
  estado: string
  notas_internas: string | null
  propiedad_id: string
  participantes: Array<{
    id: string
    party_role: string
    person: { id: string; full_name: string; email: string } | null
  }>
}

export function EditContratoForm() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [contrato, setContrato] = useState<Contrato | null>(null)

  // Form state
  const [participants, setParticipants] = useState<Participant[]>([])
  const [monto, setMonto] = useState("")
  const [moneda, setMoneda] = useState("ARS")
  const [indiceAjuste, setIndiceAjuste] = useState("ICL")
  const [periodicidadAjuste, setPeriodicidadAjuste] = useState("4")
  const [diaVencimiento, setDiaVencimiento] = useState("10")
  const [deposito, setDeposito] = useState("")
  const [honorarios, setHonorarios] = useState("5")
  const [garantiaTipo, setGarantiaTipo] = useState("")
  const [garantiaDetalle, setGarantiaDetalle] = useState("")
  const [notas, setNotas] = useState("")
  const [estado, setEstado] = useState("borrador")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contract
        const contratoRes = await fetch(`/api/admin/contracts/${id}`)
        if (!contratoRes.ok) throw new Error("Contrato no encontrado")
        const contratoData = await contratoRes.json()
        setContrato(contratoData)

        // Set form values
        setMonto(contratoData.monto_base?.toString() || "")
        setMoneda(contratoData.moneda || "ARS")
        setIndiceAjuste(contratoData.indice_ajuste || "ICL")
        setPeriodicidadAjuste(contratoData.periodicidad_ajuste?.toString() || "4")
        setDiaVencimiento(contratoData.dia_vencimiento?.toString() || "10")
        setDeposito(contratoData.deposito_monto?.toString() || "")
        setHonorarios(contratoData.honorarios_porcentaje?.toString() || "5")
        setGarantiaTipo(contratoData.garantia_tipo || "")
        setGarantiaDetalle(contratoData.garantia_detalle || "")
        setNotas(contratoData.notas_internas || "")
        setEstado(contratoData.estado || "borrador")

        // Map participants (excluding propietarios which come from property_owners)
        const mappedParticipants = (contratoData.participantes || [])
          .filter((p: any) => p.party_role !== "PROPIETARIO")
          .map((p: any) => ({
            id: p.id,
            personId: p.person?.id || "",
            role: mapRoleFromDB(p.party_role),
            person: p.person,
          }))
        setParticipants(mappedParticipants)

        // Fetch clients
        const clientsRes = await fetch("/api/admin/clients")
        const clientsData = await clientsRes.json()
        setClients(Array.isArray(clientsData) ? clientsData : [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  const mapRoleFromDB = (dbRole: string): string => {
    const roleMap: Record<string, string> = {
      INQUILINO: "inquilino",
      GARANTE: "garante",
      APODERADO: "apoderado",
    }
    return roleMap[dbRole] || dbRole.toLowerCase()
  }

  const addParticipant = () => {
    setParticipants([...participants, { personId: "", role: "inquilino" }])
  }

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    const updated = [...participants]
    updated[index] = { ...updated[index], [field]: value }
    setParticipants(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto_base: Number.parseFloat(monto),
          moneda,
          indice_ajuste: indiceAjuste,
          periodicidad_ajuste: Number.parseInt(periodicidadAjuste),
          dia_vencimiento: Number.parseInt(diaVencimiento),
          deposito_monto: Number.parseFloat(deposito) || 0,
          deposito_moneda: moneda,
          garantia_tipo: garantiaTipo || null,
          garantia_detalle: garantiaDetalle || null,
          honorarios_porcentaje: Number.parseFloat(honorarios),
          notas_internas: notas || null,
          estado,
          participants: participants
            .filter((p) => p.personId)
            .map((p) => ({
              personId: p.personId,
              role: p.role,
            })),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al actualizar el contrato")
      }

      router.push(`/dashboard/contratos/${id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (error && !contrato) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contratos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Error</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/contratos/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Editar Contrato</h1>
          <p className="text-muted-foreground">Modifica los datos del contrato</p>
        </div>
      </div>

      {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Participantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participantes
            </CardTitle>
            <CardDescription>Inquilinos y garantes del contrato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {participants.map((participant, index) => (
              <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                <div className="flex-1">
                  <Label>Persona</Label>
                  <Select value={participant.personId} onValueChange={(v) => updateParticipant(index, "personId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar persona" />
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
                <div className="w-40">
                  <Label>Rol</Label>
                  <Select value={participant.role} onValueChange={(v) => updateParticipant(index, "role", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inquilino">Inquilino</SelectItem>
                      <SelectItem value="co_inquilino">Co-inquilino</SelectItem>
                      <SelectItem value="garante">Garante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeParticipant(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addParticipant} className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Participante
            </Button>
          </CardContent>
        </Card>

        {/* Datos financieros */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Financieros</CardTitle>
            <CardDescription>Montos y configuración de pagos</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="monto">Monto base *</Label>
              <Input id="monto" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="moneda">Moneda</Label>
              <Select value={moneda} onValueChange={setMoneda}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="diaVencimiento">Día de vencimiento</Label>
              <Input
                id="diaVencimiento"
                type="number"
                min="1"
                max="28"
                value={diaVencimiento}
                onChange={(e) => setDiaVencimiento(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="deposito">Depósito</Label>
              <Input id="deposito" type="number" value={deposito} onChange={(e) => setDeposito(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="honorarios">Honorarios (%)</Label>
              <Input
                id="honorarios"
                type="number"
                step="0.5"
                value={honorarios}
                onChange={(e) => setHonorarios(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ajustes */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Ajustes</CardTitle>
            <CardDescription>Índice y periodicidad de ajuste del alquiler</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="indiceAjuste">Índice de ajuste</Label>
              <Select value={indiceAjuste} onValueChange={setIndiceAjuste}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ICL">ICL (Índice de Contratos de Locación)</SelectItem>
                  <SelectItem value="IPC">IPC (Índice de Precios al Consumidor)</SelectItem>
                  <SelectItem value="fijo">Monto fijo</SelectItem>
                  <SelectItem value="otro">Otro / Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="periodicidadAjuste">Periodicidad (meses)</Label>
              <Input
                id="periodicidadAjuste"
                type="number"
                min="1"
                value={periodicidadAjuste}
                onChange={(e) => setPeriodicidadAjuste(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Garantía */}
        <Card>
          <CardHeader>
            <CardTitle>Garantía</CardTitle>
            <CardDescription>Información sobre la garantía del contrato</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="garantiaTipo">Tipo de garantía</Label>
              <Select value={garantiaTipo} onValueChange={setGarantiaTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="propiedad">Garantía propietaria</SelectItem>
                  <SelectItem value="seguro_caucion">Seguro de caución</SelectItem>
                  <SelectItem value="recibo_sueldo">Recibo de sueldo</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="garantiaDetalle">Detalle de garantía</Label>
              <Input
                id="garantiaDetalle"
                value={garantiaDetalle}
                onChange={(e) => setGarantiaDetalle(e.target.value)}
                placeholder="Descripción o referencia"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Internas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas internas sobre el contrato..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link href={`/dashboard/contratos/${id}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
