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
import { ArrowLeft, CreditCard, AlertCircle, Receipt, Building } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Recibo {
  id: string
  monto: number
  periodo_mes: number
  periodo_anio: number
  estado: string
  descripcion: string
  contrato: {
    id: string
    propiedad: {
      direccion: string
      ciudad: string
    }
  }
  cuenta: {
    id: string
    titular: {
      full_name: string
      email: string
    }
  }
}

export function PaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reciboId = searchParams.get("recibo")

  const [recibosPendientes, setRecibosPendientes] = useState<Recibo[]>([])
  const [selectedRecibo, setSelectedRecibo] = useState<Recibo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    monto: "",
    metodo_pago: "transferencia",
    referencia_pago: "",
    descripcion: "",
  })

  useEffect(() => {
    const fetchRecibos = async () => {
      const res = await fetch("/api/admin/finance/pending")
      if (res.ok) {
        const data = await res.json()
        const recibos = data.recibos.detalle || []
        setRecibosPendientes(recibos)

        // Si viene un recibo preseleccionado
        if (reciboId) {
          const recibo = recibos.find((r: Recibo) => r.id === reciboId)
          if (recibo) {
            setSelectedRecibo(recibo)
            setFormData((prev) => ({ ...prev, monto: recibo.monto.toString() }))
          }
        }
      }
      setIsLoading(false)
    }

    fetchRecibos()
  }, [reciboId])

  const handleReciboSelect = (reciboId: string) => {
    const recibo = recibosPendientes.find((r) => r.id === reciboId)
    if (recibo) {
      setSelectedRecibo(recibo)
      setFormData((prev) => ({ ...prev, monto: recibo.monto.toString() }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecibo) {
      setError("Selecciona un recibo")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const res = await fetch("/api/admin/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuenta_id: selectedRecibo.cuenta.id,
          contrato_id: selectedRecibo.contrato.id,
          recibo_id: selectedRecibo.id,
          monto: Number.parseFloat(formData.monto),
          concepto: "pago_alquiler",
          metodo_pago: formData.metodo_pago,
          referencia_pago: formData.referencia_pago,
          descripcion: formData.descripcion,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al registrar pago")
      }

      router.push("/dashboard/cobranzas")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const nombreMes = (mes: number) => {
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
    return meses[mes - 1]
  }

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
            <h1 className="text-2xl font-semibold tracking-tight">Registrar Pago</h1>
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
          <Link href="/dashboard/cobranzas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registrar Pago</h1>
          <p className="text-muted-foreground">Registra el pago de un alquiler</p>
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
          {/* Selección de recibo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Recibo a Pagar
              </CardTitle>
              <CardDescription>Selecciona el recibo pendiente</CardDescription>
            </CardHeader>
            <CardContent>
              {recibosPendientes.length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {recibosPendientes.map((recibo) => (
                    <div
                      key={recibo.id}
                      onClick={() => handleReciboSelect(recibo.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRecibo?.id === recibo.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {nombreMes(recibo.periodo_mes)} {recibo.periodo_anio}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {recibo.contrato?.propiedad?.direccion}
                          </p>
                          <p className="text-xs text-muted-foreground">{recibo.cuenta?.titular?.full_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(recibo.monto)}</p>
                          <p className={`text-xs ${recibo.estado === "vencido" ? "text-red-600" : "text-amber-600"}`}>
                            {recibo.estado === "vencido" ? "Vencido" : "Pendiente"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No hay recibos pendientes</div>
              )}
            </CardContent>
          </Card>

          {/* Datos del pago */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Datos del Pago
              </CardTitle>
              <CardDescription>Información del pago recibido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monto">Monto *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  placeholder="0.00"
                  required
                />
                {selectedRecibo && Number.parseFloat(formData.monto) < selectedRecibo.monto && (
                  <p className="text-xs text-amber-600">
                    Pago parcial - Deuda restante:{" "}
                    {formatCurrency(selectedRecibo.monto - Number.parseFloat(formData.monto || "0"))}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo">Método de Pago</Label>
                <Select
                  value={formData.metodo_pago}
                  onValueChange={(v) => setFormData({ ...formData, metodo_pago: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="mercadopago">MercadoPago</SelectItem>
                    <SelectItem value="deposito">Depósito Bancario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referencia">Referencia / Comprobante</Label>
                <Input
                  id="referencia"
                  value={formData.referencia_pago}
                  onChange={(e) => setFormData({ ...formData, referencia_pago: e.target.value })}
                  placeholder="Número de transferencia, cheque, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Notas (opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1 bg-transparent" asChild>
                  <Link href="/dashboard/cobranzas">Cancelar</Link>
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving || !selectedRecibo || !formData.monto}>
                  {isSaving ? "Registrando..." : "Registrar Pago"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
