"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Receipt, MoreHorizontal, AlertTriangle, Clock, CheckCircle, Filter, Download } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BulkActions, BulkCheckbox } from "@/components/dashboard/bulk-actions"
import { Mail, Trash2, Send } from "lucide-react"

interface Recibo {
  id: string
  monto: number
  periodo_mes: number
  periodo_anio: number
  estado: string
  descripcion: string
  created_at: string
  contrato: {
    id: string
    propiedad: {
      id: string
      direccion: string
      ciudad: string
    }
  }
  cuenta: {
    id: string
    titular_id: string
    titular: {
      id: string
      full_name: string
      email: string
    }
  }
}

export default function CobranzasPage() {
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [resumen, setResumen] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const bulkActions = [
    {
      label: "Enviar recordatorio",
      icon: <Send className="h-4 w-4" />,
      onClick: async (ids: string[]) => {
        await fetch("/api/admin/finance/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send_reminder", ids }),
        })
      },
    },
    {
      label: "Marcar como pagados",
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: async (ids: string[]) => {
        await fetch("/api/admin/finance/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_paid", ids }),
        })
        window.location.reload()
      },
      confirmMessage: "¿Marcar {count} recibos como pagados?",
    },
    {
      label: "Eliminar seleccionados",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (ids: string[]) => {
        await fetch("/api/admin/finance/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", ids }),
        })
        window.location.reload()
      },
      variant: "destructive" as const,
      confirmMessage: "¿Eliminar {count} recibos? Esta acción no se puede deshacer.",
    },
  ]

  useEffect(() => {
    const fetchData = async () => {
      // Obtener resumen
      const resRes = await fetch("/api/admin/finance/pending")
      if (resRes.ok) {
        const data = await resRes.json()
        setResumen(data.recibos)
        setRecibos(data.recibos.detalle || [])
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const estadoConfig: Record<string, { label: string; color: string; icon: any }> = {
    pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: Clock },
    vencido: { label: "Vencido", color: "bg-red-100 text-red-700", icon: AlertTriangle },
    parcial: { label: "Pago Parcial", color: "bg-blue-100 text-blue-700", icon: Receipt },
    pagado: { label: "Pagado", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const nombreMes = (mes: number) => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return meses[mes - 1]
  }

  const recibosFiltrados = filtroEstado === "todos" ? recibos : recibos.filter((r) => r.estado === filtroEstado)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Cobranzas</h1>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex justify-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cobranzas</h1>
          <p className="text-muted-foreground">Gestión de recibos de alquiler y pagos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/cobranzas/recibos">
              <Download className="mr-2 h-4 w-4" />
              Generar Recibos
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/cobranzas/pago">
              <Plus className="mr-2 h-4 w-4" />
              Registrar Pago
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(resumen?.totalPorCobrar || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(resumen?.pendientes || 0) + (resumen?.vencidos || 0)} recibos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{resumen?.pendientes || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{resumen?.vencidos || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Parciales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{resumen?.parciales || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Antigüedad de vencidos */}
      {resumen?.vencidos > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Antigüedad de Deuda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div>
                <span className="text-2xl font-bold">{resumen?.vencidosPorAntigüedad?.hasta30dias || 0}</span>
                <p className="text-xs text-muted-foreground">hasta 30 días</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-amber-600">
                  {resumen?.vencidosPorAntigüedad?.de31a60dias || 0}
                </span>
                <p className="text-xs text-muted-foreground">31-60 días</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-red-600">
                  {resumen?.vencidosPorAntigüedad?.masde60dias || 0}
                </span>
                <p className="text-xs text-muted-foreground">más de 60 días</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros y tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recibos</CardTitle>
            <div className="flex items-center gap-4">
              <BulkActions
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                actions={bulkActions}
              />
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="vencido">Vencidos</SelectItem>
                    <SelectItem value="parcial">Pago Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recibosFiltrados.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <BulkCheckbox
                      checked={selectedIds.length === recibosFiltrados.length && recibosFiltrados.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedIds(checked === true ? recibosFiltrados.map((r) => r.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recibosFiltrados.map((recibo) => {
                  const config = estadoConfig[recibo.estado] || estadoConfig.pendiente
                  const Icon = config.icon
                  return (
                    <TableRow key={recibo.id}>
                      <TableCell>
                        <BulkCheckbox
                          checked={selectedIds.includes(recibo.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds(
                              checked === true ? [...selectedIds, recibo.id] : selectedIds.filter((id) => id !== recibo.id),
                            )
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {nombreMes(recibo.periodo_mes)} {recibo.periodo_anio}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{recibo.contrato?.propiedad?.direccion}</div>
                        <div className="text-xs text-muted-foreground">{recibo.contrato?.propiedad?.ciudad}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{recibo.cuenta?.titular?.full_name || "Sin asignar"}</div>
                        <div className="text-xs text-muted-foreground">{recibo.cuenta?.titular?.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(recibo.monto)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/cobranzas/pago?recibo=${recibo.id}`}>Registrar pago</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/contratos/${recibo.contrato?.id}`}>Ver contrato</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Enviar recordatorio</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No hay recibos pendientes</h3>
              <p className="text-sm text-muted-foreground mb-4">Genera recibos para el período actual</p>
              <Button asChild>
                <Link href="/dashboard/cobranzas/recibos">Generar Recibos</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
