"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, MoreHorizontal, Calendar, LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ContractsKanban } from "@/components/dashboard/contracts-kanban"
import { useToast } from "@/hooks/use-toast"

interface Participant {
  party_role: string
  person: { full_name: string; email: string } | null
}

interface Contrato {
  id: string
  fecha_inicio: string
  fecha_fin: string
  monto_base: number
  moneda: string
  indice_ajuste: string | null
  estado: string
  propiedad: { direccion: string; ciudad: string } | null
  participantes: Participant[]
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban")
  const { toast } = useToast()

  const fetchContratos = async () => {
    try {
      const response = await fetch("/api/admin/contracts")
      const data = await response.json()
      setContratos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching contracts:", error)
      setContratos([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContratos()
  }, [])

  const handleStatusChange = async (contractId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/contracts/${contractId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newStatus }),
      })

      if (res.ok) {
        toast({
          title: "Estado actualizado",
          description: `El contrato se movió a "${newStatus}"`,
        })
        fetchContratos()

        // Log activity
        await fetch("/api/admin/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actorName: "Admin",
            entityType: "contrato",
            entityId: contractId,
            entityLabel: `Contrato`,
            action: "status_changed",
            actionLabel: "cambió estado",
            description: `Estado cambiado a ${newStatus}`,
            newValue: { estado: newStatus },
          }),
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const estadoColors: Record<string, string> = {
    activo: "bg-emerald-100 text-emerald-700",
    borrador: "bg-slate-100 text-slate-700",
    finalizado: "bg-gray-100 text-gray-700",
  }

  const estadoLabels: Record<string, string> = {
    activo: "Activo",
    borrador: "Borrador",
    finalizado: "Finalizado",
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number, currency = "ARS") => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
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
          <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">Gestiona los contratos de alquiler</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border bg-background p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "kanban" ? "bg-foreground text-background" : "hover:bg-muted"
              }`}
              title="Vista Kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list" ? "bg-foreground text-background" : "hover:bg-muted"
              }`}
              title="Vista lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button asChild>
            <Link href="/dashboard/contratos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Contrato
            </Link>
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <ContractsKanban contratos={contratos} onStatusChange={handleStatusChange} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{contratos.length} contratos registrados</CardTitle>
          </CardHeader>
          <CardContent>
            {contratos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((contrato) => {
                    const inquilino = contrato.participantes?.find((p) => p.party_role === "INQUILINO")?.person

                    return (
                      <TableRow key={contrato.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-muted p-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{contrato.propiedad?.direccion || "Sin propiedad"}</p>
                              <p className="text-xs text-muted-foreground">{contrato.propiedad?.ciudad}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{inquilino?.full_name || "Sin asignar"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(contrato.fecha_inicio)} - {formatDate(contrato.fecha_fin)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatCurrency(contrato.monto_base, contrato.moneda)}</p>
                            <p className="text-xs text-muted-foreground">
                              Ajuste: {contrato.indice_ajuste?.toUpperCase() || "ICL"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={estadoColors[contrato.estado] || ""}>
                            {estadoLabels[contrato.estado] || contrato.estado}
                          </Badge>
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
                                <Link href={`/dashboard/contratos/${contrato.id}`}>Ver detalle</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/contratos/${contrato.id}/editar`}>Editar</Link>
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
                <h3 className="text-lg font-medium">No hay contratos</h3>
                <p className="text-sm text-muted-foreground mb-4">Comienza creando tu primer contrato de alquiler</p>
                <Button asChild>
                  <Link href="/dashboard/contratos/nuevo">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Contrato
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
