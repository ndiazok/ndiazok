"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, MoreHorizontal, Clock, CheckCircle, Banknote, Filter } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BulkActions, BulkCheckbox } from "@/components/dashboard/bulk-actions"
import { Trash2, Download, Send } from "lucide-react"

interface Liquidacion {
  id: string
  periodo_desde: string
  periodo_hasta: string
  total_creditos: number
  total_debitos: number
  saldo_neto: number
  estado: string
  fecha_pago: string | null
  metodo_pago: string | null
  created_at: string
  propietario: {
    id: string
    full_name: string
    email: string
  }
  propiedad: {
    id: string
    direccion: string
    ciudad: string
  } | null
  items: any[]
}

export default function LiquidacionesPage() {
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [resumen, setResumen] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const bulkActions = [
    {
      label: "Descargar PDFs",
      icon: <Download className="h-4 w-4" />,
      onClick: async (ids: string[]) => {
        for (const id of ids) {
          window.open(`/api/admin/pdf/liquidation/${id}`, "_blank")
        }
      },
    },
    {
      label: "Enviar por email",
      icon: <Send className="h-4 w-4" />,
      onClick: async (ids: string[]) => {
        await fetch("/api/admin/finance/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send_liquidation", ids }),
        })
      },
    },
    {
      label: "Eliminar seleccionadas",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (ids: string[]) => {
        await fetch("/api/admin/finance/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete_liquidation", ids }),
        })
        window.location.reload()
      },
      variant: "destructive" as const,
      confirmMessage: "¿Eliminar {count} liquidaciones? Esta acción no se puede deshacer.",
    },
  ]

  useEffect(() => {
    const fetchData = async () => {
      // Obtener liquidaciones
      const liqRes = await fetch("/api/admin/finance/liquidations")
      if (liqRes.ok) {
        const data = await liqRes.json()
        setLiquidaciones(data)
      }

      // Obtener resumen
      const resRes = await fetch("/api/admin/finance/pending")
      if (resRes.ok) {
        const data = await resRes.json()
        setResumen(data.liquidaciones)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  const estadoConfig: Record<string, { label: string; color: string; icon: any }> = {
    borrador: { label: "Borrador", color: "bg-slate-100 text-slate-700", icon: FileText },
    confirmada: { label: "Confirmada", color: "bg-amber-100 text-amber-700", icon: Clock },
    pagada: { label: "Pagada", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    anulada: { label: "Anulada", color: "bg-red-100 text-red-700", icon: FileText },
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
      month: "short",
      year: "numeric",
    })
  }

  const liquidacionesFiltradas =
    filtroEstado === "todos" ? liquidaciones : liquidaciones.filter((l) => l.estado === filtroEstado)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Liquidaciones</h1>
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
          <h1 className="text-2xl font-semibold tracking-tight">Liquidaciones</h1>
          <p className="text-muted-foreground">Liquidaciones a propietarios</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/liquidaciones/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Liquidación
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Por Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{formatCurrency(resumen?.totalPorPagar || 0)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(resumen?.borradores || 0) + (resumen?.confirmadas || 0)} liquidaciones
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Borradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-500" />
              <span className="text-2xl font-bold">{resumen?.borradores || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold text-amber-600">{resumen?.confirmadas || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de liquidaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{liquidaciones.length} liquidaciones</CardTitle>
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
                    <SelectItem value="borrador">Borradores</SelectItem>
                    <SelectItem value="confirmada">Confirmadas</SelectItem>
                    <SelectItem value="pagada">Pagadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {liquidacionesFiltradas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <BulkCheckbox
                      checked={selectedIds.length === liquidacionesFiltradas.length && liquidacionesFiltradas.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedIds(checked === true ? liquidacionesFiltradas.map((l) => l.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Neto a Pagar</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidacionesFiltradas.map((liq) => {
                  const config = estadoConfig[liq.estado] || estadoConfig.borrador
                  const Icon = config.icon
                  return (
                    <TableRow key={liq.id}>
                      <TableCell>
                        <BulkCheckbox
                          checked={selectedIds.includes(liq.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds(
                              checked === true ? [...selectedIds, liq.id] : selectedIds.filter((id) => id !== liq.id),
                            )
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{liq.propietario?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{liq.propietario?.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(liq.periodo_desde)} - {formatDate(liq.periodo_hasta)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {liq.propiedad ? (
                          <div>
                            <div className="font-medium">{liq.propiedad.direccion}</div>
                            <div className="text-xs text-muted-foreground">{liq.propiedad.ciudad}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Todas las propiedades</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatCurrency(liq.saldo_neto)}</div>
                        <div className="text-xs text-muted-foreground">
                          +{formatCurrency(liq.total_creditos)} -{formatCurrency(liq.total_debitos)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/liquidaciones/${liq.id}`}>Ver detalle</Link>
                            </DropdownMenuItem>
                            {liq.estado === "borrador" && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/liquidaciones/${liq.id}?accion=confirmar`}>Confirmar</Link>
                              </DropdownMenuItem>
                            )}
                            {liq.estado === "confirmada" && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/liquidaciones/${liq.id}?accion=pagar`}>Registrar pago</Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <a href={`/api/admin/pdf/liquidation/${liq.id}`} target="_blank" rel="noopener noreferrer">
                                Descargar PDF
                              </a>
                            </DropdownMenuItem>
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
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No hay liquidaciones</h3>
              <p className="text-sm text-muted-foreground mb-4">Genera la primera liquidación para un propietario</p>
              <Button asChild>
                <Link href="/dashboard/liquidaciones/nueva">Nueva Liquidación</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
