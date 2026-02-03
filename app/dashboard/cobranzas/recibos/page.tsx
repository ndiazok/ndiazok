"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Receipt, Building, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Contrato {
  id: string
  monto_base: number
  moneda: string
  propiedad: {
    id: string
    direccion: string
    ciudad: string
  }
  participantes: Array<{
    party_role: string
    persona: {
      id: string
      full_name: string
    }
  }>
}

export default function GenerarRecibosPage() {
  const router = useRouter()
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [selectedContratos, setSelectedContratos] = useState<string[]>([])
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchContratos = async () => {
      const res = await fetch("/api/admin/contracts")
      if (res.ok) {
        const data = await res.json()
        // Filtrar solo contratos activos
        setContratos(data.filter((c: any) => c.estado === "activo"))
      }
      setIsLoading(false)
    }

    fetchContratos()
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContratos(contratos.map((c) => c.id))
    } else {
      setSelectedContratos([])
    }
  }

  const handleSelectContrato = (contratoId: string, checked: boolean) => {
    if (checked) {
      setSelectedContratos([...selectedContratos, contratoId])
    } else {
      setSelectedContratos(selectedContratos.filter((id) => id !== contratoId))
    }
  }

  const handleGenerar = async () => {
    setIsGenerating(true)
    setError("")
    setResultado(null)

    try {
      const res = await fetch("/api/admin/finance/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mes,
          anio,
          contrato_ids: selectedContratos.length > 0 ? selectedContratos : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al generar recibos")
      }

      setResultado(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (amount: number, currency = "ARS") => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/cobranzas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Generar Recibos</h1>
            <p className="text-muted-foreground">Cargando contratos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/cobranzas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Generar Recibos</h1>
          <p className="text-muted-foreground">Crea recibos de alquiler para el período seleccionado</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {resultado && (
        <Alert
          className={resultado.generados > 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}
        >
          <CheckCircle className={`h-4 w-4 ${resultado.generados > 0 ? "text-emerald-600" : "text-amber-600"}`} />
          <AlertDescription>
            <strong>{resultado.generados} recibos generados</strong>
            {resultado.errores > 0 && (
              <span className="text-amber-700"> · {resultado.errores} contratos con errores</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Selector de período */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Período</CardTitle>
            <CardDescription>Selecciona mes y año para generar los recibos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select value={mes.toString()} onValueChange={(v) => setMes(Number.parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((nombre, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Select value={anio.toString()} onValueChange={(v) => setAnio(Number.parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full mt-4" onClick={handleGenerar} disabled={isGenerating || contratos.length === 0}>
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Generar {selectedContratos.length > 0 ? selectedContratos.length : contratos.length} Recibos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de contratos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Contratos Activos</CardTitle>
                <CardDescription>
                  {contratos.length} contratos · Selecciona específicos o genera para todos
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedContratos.length === contratos.length && contratos.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Seleccionar todos
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {contratos.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {contratos.map((contrato) => {
                  const inquilino = contrato.participantes?.find((p) => p.party_role === "INQUILINO")
                  return (
                    <div
                      key={contrato.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedContratos.includes(contrato.id)}
                        onCheckedChange={(checked) => handleSelectContrato(contrato.id, checked as boolean)}
                      />
                      <div className="rounded-lg bg-muted p-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contrato.propiedad?.direccion}</p>
                        <p className="text-sm text-muted-foreground">
                          {inquilino?.persona?.full_name || "Sin inquilino"} · {contrato.propiedad?.ciudad}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(contrato.monto_base, contrato.moneda)}</p>
                        <p className="text-xs text-muted-foreground">{contrato.moneda}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No hay contratos activos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resultado detallado */}
      {resultado && resultado.detalle_errores?.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-base text-amber-700">Errores al generar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resultado.detalle_errores.map((err: any, idx: number) => (
                <div key={idx} className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                  Contrato {err.contrato_id?.slice(0, 8)}...: {err.error}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
