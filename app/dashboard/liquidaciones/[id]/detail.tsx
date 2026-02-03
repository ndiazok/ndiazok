"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  FileText,
  User,
  Building,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Banknote,
  Download,
} from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LiquidacionDetalle {
  id: string
  periodo_desde: string
  periodo_hasta: string
  total_creditos: number
  total_debitos: number
  saldo_neto: number
  estado: string
  fecha_pago: string | null
  metodo_pago: string | null
  comprobante_pago: string | null
  notas: string | null
  created_at: string
  propietario: {
    id: string
    full_name: string
    email: string
    phone: string
  }
  propiedad: {
    id: string
    direccion: string
    ciudad: string
  } | null
  items: Array<{
    id: string
    tipo: string
    concepto: string
    descripcion: string
    monto: number
  }>
}

export function LiquidacionDetail() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const accion = searchParams.get("accion")

  const [liquidacion, setLiquidacion] = useState<LiquidacionDetalle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActioning, setIsActioning] = useState(false)
  const [showPagoDialog, setShowPagoDialog] = useState(accion === "pagar")

  const [pagoData, setPagoData] = useState({
    metodo_pago: "transferencia",
    comprobante_pago: "",
  })

  useEffect(() => {
    const fetchLiquidacion = async () => {
      const res = await fetch(`/api/admin/finance/liquidations?id=${params.id}`)
      if (res.ok) {
        const data = await res.json()
        const liq = Array.isArray(data) ? data.find((l: any) => l.id === params.id) : data
        setLiquidacion(liq)
      }
      setIsLoading(false)
    }

    fetchLiquidacion()
  }, [params.id])

  const handleAccion = async (accion: string) => {
    setIsActioning(true)

    try {
      const body: any = {
        liquidacion_id: params.id,
        accion,
      }

      if (accion === "pagar") {
        body.metodo_pago = pagoData.metodo_pago
        body.comprobante_pago = pagoData.comprobante_pago
      }

      const res = await fetch("/api/admin/finance/liquidations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const updated = await res.json()
        setLiquidacion(updated)
        setShowPagoDialog(false)
      }
    } finally {
      setIsActioning(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const estadoConfig: Record<string, { label: string; color: string }> = {
    borrador: { label: "Borrador", color: "bg-slate-100 text-slate-700" },
    confirmada: { label: "Confirmada", color: "bg-amber-100 text-amber-700" },
    pagada: { label: "Pagada", color: "bg-emerald-100 text-emerald-700" },
    anulada: { label: "Anulada", color: "bg-red-100 text-red-700" },
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
            <h1 className="text-2xl font-semibold tracking-tight">Liquidación</h1>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!liquidacion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/liquidaciones">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Liquidación no encontrada</h1>
          </div>
        </div>
      </div>
    )
  }

  const config = estadoConfig[liquidacion.estado] || estadoConfig.borrador
  const itemsCredito = liquidacion.items?.filter((i) => i.tipo === "credito") || []
  const itemsDebito = liquidacion.items?.filter((i) => i.tipo === "debito") || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/liquidaciones">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Liquidación</h1>
              <Badge variant="secondary" className={config.color}>
                {config.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {formatDate(liquidacion.periodo_desde)} - {formatDate(liquidacion.periodo_hasta)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
          {liquidacion.estado === "borrador" && (
            <Button onClick={() => handleAccion("confirmar")} disabled={isActioning}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmar
            </Button>
          )}
          {liquidacion.estado === "confirmada" && (
            <Button onClick={() => setShowPagoDialog(true)}>
              <Banknote className="mr-2 h-4 w-4" />
              Registrar Pago
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Propietario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{liquidacion.propietario?.full_name}</p>
            <p className="text-sm text-muted-foreground">{liquidacion.propietario?.email}</p>
            {liquidacion.propietario?.phone && (
              <p className="text-sm text-muted-foreground">{liquidacion.propietario?.phone}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Propiedad
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liquidacion.propiedad ? (
              <>
                <p className="font-medium">{liquidacion.propiedad.direccion}</p>
                <p className="text-sm text-muted-foreground">{liquidacion.propiedad.ciudad}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Todas las propiedades</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600">+ Ingresos</span>
                <span className="font-medium text-emerald-600">{formatCurrency(liquidacion.total_creditos)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">- Deducciones</span>
                <span className="font-medium text-red-600">{formatCurrency(liquidacion.total_debitos)}</span>
              </div>
              <div className="border-t pt-1 mt-1">
                <div className="flex justify-between">
                  <span className="font-medium">Neto a pagar</span>
                  <span className="font-bold text-lg">{formatCurrency(liquidacion.saldo_neto)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Ingresos
            </CardTitle>
            <CardDescription>Alquileres cobrados en el período</CardDescription>
          </CardHeader>
          <CardContent>
            {itemsCredito.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsCredito.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.concepto}</p>
                          <p className="text-xs text-muted-foreground">{item.descripcion}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {formatCurrency(item.monto)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-muted-foreground">Sin ingresos en el período</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Deducciones
            </CardTitle>
            <CardDescription>Honorarios y gastos a descontar</CardDescription>
          </CardHeader>
          <CardContent>
            {itemsDebito.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsDebito.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.concepto}</p>
                          <p className="text-xs text-muted-foreground">{item.descripcion}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        -{formatCurrency(item.monto)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-muted-foreground">Sin deducciones</p>
            )}
          </CardContent>
        </Card>
      </div>

      {liquidacion.estado === "pagada" && liquidacion.fecha_pago && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              Pago Registrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Fecha de pago</p>
                <p className="font-medium">{formatDate(liquidacion.fecha_pago)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Método</p>
                <p className="font-medium capitalize">{liquidacion.metodo_pago || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Comprobante</p>
                <p className="font-medium">{liquidacion.comprobante_pago || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {liquidacion.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{liquidacion.notas}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showPagoDialog} onOpenChange={setShowPagoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago de Liquidación</DialogTitle>
            <DialogDescription>
              Monto a pagar: <strong>{formatCurrency(liquidacion.saldo_neto)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={pagoData.metodo_pago} onValueChange={(v) => setPagoData({ ...pagoData, metodo_pago: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comprobante / Referencia</Label>
              <Input
                value={pagoData.comprobante_pago}
                onChange={(e) => setPagoData({ ...pagoData, comprobante_pago: e.target.value })}
                placeholder="Número de transferencia, cheque, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPagoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleAccion("pagar")} disabled={isActioning}>
              {isActioning ? "Registrando..." : "Confirmar Pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
