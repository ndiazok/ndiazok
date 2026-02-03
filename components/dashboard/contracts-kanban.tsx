"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MoreHorizontal,
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface ContractsKanbanProps {
  contratos: Contrato[]
  onStatusChange?: (contractId: string, newStatus: string) => void
}

const COLUMNS = [
  {
    id: "borrador",
    title: "Borrador",
    color: "bg-slate-100 border-slate-300",
    icon: FileText,
    description: "En preparación",
  },
  {
    id: "activo",
    title: "Activo",
    color: "bg-emerald-50 border-emerald-300",
    icon: CheckCircle2,
    description: "Contratos vigentes",
  },
  {
    id: "finalizado",
    title: "Finalizado",
    color: "bg-gray-100 border-gray-300",
    icon: Clock,
    description: "Relación extinguida",
  },
]

export function ContractsKanban({ contratos, onStatusChange }: ContractsKanbanProps) {
  const [draggedContract, setDraggedContract] = useState<string | null>(null)

  const getContractsByStatus = (status: string) => {
    return contratos.filter((c) => c.estado === status)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
    })
  }

  const formatCurrency = (amount: number, currency = "ARS") => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const isExpiringSoon = (fechaFin: string) => {
    const daysUntil = Math.ceil((new Date(fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 30 && daysUntil > 0
  }

  const isExpired = (fechaFin: string) => {
    return new Date(fechaFin) < new Date()
  }

  const handleDragStart = (e: React.DragEvent, contractId: string) => {
    setDraggedContract(contractId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedContract && onStatusChange) {
      onStatusChange(draggedContract, newStatus)
    }
    setDraggedContract(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {COLUMNS.map((column) => {
        const columnContracts = getContractsByStatus(column.id)
        const Icon = column.icon

        return (
          <div
            key={column.id}
            className={`rounded-lg border-2 ${column.color} p-4 min-h-[500px]`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{column.title}</h3>
                  <p className="text-xs text-muted-foreground">{column.description}</p>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono">
                {columnContracts.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {columnContracts.map((contrato) => {
                const inquilino = contrato.participantes?.find((p) => p.party_role === "INQUILINO")?.person
                const expiringSoon = column.id === "activo" && isExpiringSoon(contrato.fecha_fin)
                const expired = column.id === "activo" && isExpired(contrato.fecha_fin)

                return (
                  <Card
                    key={contrato.id}
                    className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                      draggedContract === contrato.id ? "opacity-50" : ""
                    } ${expired ? "border-red-300 bg-red-50/50" : expiringSoon ? "border-amber-300 bg-amber-50/50" : ""}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, contrato.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/dashboard/contratos/${contrato.id}`}
                            className="font-medium text-sm hover:underline line-clamp-1"
                          >
                            {contrato.propiedad?.direccion || "Sin propiedad"}
                          </Link>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {contrato.propiedad?.ciudad || "—"}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
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
                            <DropdownMenuSeparator />
                            {column.id === "borrador" && (
                              <DropdownMenuItem onClick={() => onStatusChange?.(contrato.id, "activo")}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Activar contrato
                              </DropdownMenuItem>
                            )}
                            {column.id === "activo" && (
                              <DropdownMenuItem onClick={() => onStatusChange?.(contrato.id, "finalizado")}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Finalizar contrato
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {inquilino && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <User className="h-3 w-3" />
                          <span className="truncate">{inquilino.full_name}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(contrato.fecha_inicio)} - {formatDate(contrato.fecha_fin)}
                        </div>
                        {(expired || expiringSoon) && (
                          <Badge
                            variant="secondary"
                            className={expired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {expired ? "Vencido" : "Por vencer"}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          {formatCurrency(contrato.monto_base, contrato.moneda)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {contrato.indice_ajuste?.toUpperCase() || "ICL"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {columnContracts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Sin contratos</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
