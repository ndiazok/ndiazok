"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Wallet, MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CuentaResumen {
  cuenta_id: string
  titular_id: string
  titular_nombre: string | null
  titular_email: string | null
  tipo_cuenta: string
  saldo_actual: number | null
  total_por_cobrar: number | null
  total_por_pagar: number | null
  movimientos_pendientes: number | null
}

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<CuentaResumen[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCuentas = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("vista_resumen_cuenta")
        .select("*")
        .order("saldo_actual", { ascending: false })

      setCuentas(data || [])
      setIsLoading(false)
    }

    fetchCuentas()
  }, [])

  const tipoColors: Record<string, string> = {
    propietario: "bg-blue-100 text-blue-700",
    inquilino: "bg-emerald-100 text-emerald-700",
    profesional: "bg-violet-100 text-violet-700",
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "$0"
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalPorCobrar = cuentas.reduce((acc, c) => acc + (c.total_por_cobrar || 0), 0)
  const totalPorPagar = cuentas.reduce((acc, c) => acc + (c.total_por_pagar || 0), 0)
  const totalPendientes = cuentas.reduce((acc, c) => acc + Number(c.movimientos_pendientes || 0), 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Cuentas Corrientes</h1>
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
          <h1 className="text-2xl font-semibold tracking-tight">Cuentas Corrientes</h1>
          <p className="text-muted-foreground">Estado de cuenta de propietarios e inquilinos</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cuentas/movimiento">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Movimiento
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPorCobrar)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Por Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{formatCurrency(totalPorPagar)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Movimientos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-600" />
              <span className="text-2xl font-bold">{totalPendientes}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{cuentas.length} cuentas activas</CardTitle>
        </CardHeader>
        <CardContent>
          {cuentas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titular</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Por Cobrar</TableHead>
                  <TableHead className="text-right">Por Pagar</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuentas.map((cuenta) => (
                  <TableRow key={cuenta.cuenta_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{cuenta.titular_nombre || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground">{cuenta.titular_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={tipoColors[cuenta.tipo_cuenta] || ""}>
                        {cuenta.tipo_cuenta}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={(cuenta.saldo_actual || 0) >= 0 ? "text-emerald-600" : "text-red-600"}>
                        {formatCurrency(cuenta.saldo_actual)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatCurrency(cuenta.total_por_cobrar)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(cuenta.total_por_pagar)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/cuentas/${cuenta.cuenta_id}`}>Ver movimientos</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/cuentas/movimiento?cuenta=${cuenta.cuenta_id}`}>
                              Registrar movimiento
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/liquidaciones/nueva?propietario=${cuenta.titular_id}`}>
                              Generar liquidación
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No hay cuentas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Las cuentas se crean automáticamente al registrar clientes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
