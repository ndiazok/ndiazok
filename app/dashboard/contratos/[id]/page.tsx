"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Shield,
  MoreHorizontal,
  User,
  Mail,
  Phone,
  Pencil,
  GitBranch,
} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Participant {
  id: string
  party_role: string
  status: string
  share_pct: number | null
  signed_at: string | null
  person: {
    id: string
    full_name: string
    email: string
    phone: string | null
  } | null
}

interface AjusteManual {
  fecha: string
  tipo: "indice" | "monto"
  indice?: string
  monto?: number
}

interface Contrato {
  id: string
  created_at: string
  fecha_inicio: string
  fecha_fin: string
  monto_base: number
  moneda: string
  indice_ajuste: string | null
  periodicidad_ajuste: number
  periodicidad_pago: string
  dia_vencimiento: number
  deposito_monto: number
  deposito_moneda: string
  garantia_tipo: string | null
  garantia_detalle: string | null
  honorarios_porcentaje: number
  estado: string
  notas_internas: string | null
  clausulas_especiales: string | null
  ajustes_manuales: AjusteManual[] | null
  propiedad: {
    id: string
    direccion: string
    ciudad: string
    provincia: string
    tipo: string
  } | null
  participantes: Participant[]
}

export default function ContratoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const id = params.id as string

  useEffect(() => {
    if (id === "nuevo") {
      router.replace("/dashboard/contratos/nuevo")
      return
    }

    const fetchContrato = async () => {
      try {
        const response = await fetch(`/api/admin/contracts/${id}`)
        if (!response.ok) {
          throw new Error("Contrato no encontrado")
        }
        const data = await response.json()
        setContrato(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el contrato")
      } finally {
        setIsLoading(false)
      }
    }

    fetchContrato()
  }, [id, router])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
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

  const estadoColors: Record<string, string> = {
    activo: "bg-emerald-100 text-emerald-700",
    borrador: "bg-amber-100 text-amber-700",
    finalizado: "bg-gray-100 text-gray-700",
    rescindido: "bg-red-100 text-red-700",
  }

  const estadoLabels: Record<string, string> = {
    activo: "Activo",
    borrador: "Borrador",
    finalizado: "Finalizado",
    rescindido: "Rescindido",
  }

  const roleLabels: Record<string, string> = {
    INQUILINO: "Inquilino",
    PROPIETARIO: "Propietario",
    GARANTE: "Garante",
    APODERADO: "Apoderado",
    USUFRUCTUARIO: "Usufructuario",
  }

  const statusLabels: Record<string, string> = {
    PENDING_INVITE: "Pendiente",
    INVITED: "Invitado",
    ACTIVE: "Activo",
    SIGNED: "Firmado",
    REVOKED: "Revocado",
    EXPIRED: "Expirado",
  }

  const statusColors: Record<string, string> = {
    PENDING_INVITE: "bg-amber-100 text-amber-700",
    INVITED: "bg-blue-100 text-blue-700",
    ACTIVE: "bg-emerald-100 text-emerald-700",
    SIGNED: "bg-emerald-100 text-emerald-700",
    REVOKED: "bg-red-100 text-red-700",
    EXPIRED: "bg-gray-100 text-gray-700",
  }

  if (id === "nuevo") {
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/contratos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Cargando contrato...</h1>
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

  if (error || !contrato) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/contratos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Error</h1>
            <p className="text-muted-foreground">{error || "Contrato no encontrado"}</p>
          </div>
        </div>
      </div>
    )
  }

  const duracionMeses = Math.round(
    (new Date(contrato.fecha_fin).getTime() - new Date(contrato.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24 * 30),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contratos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Contrato</h1>
            <p className="text-muted-foreground">
              {contrato?.propiedad?.direccion}, {contrato?.propiedad?.ciudad}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/contratos/${id}/pipeline`}>
            <Button variant="default">
              <GitBranch className="h-4 w-4 mr-2" />
              Pipeline
            </Button>
          </Link>
          <Link href={`/dashboard/contratos/${id}/editar`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive">Eliminar contrato</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Información de la propiedad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Propiedad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{contrato.propiedad?.direccion}</p>
                  <p className="text-sm text-muted-foreground">
                    {contrato.propiedad?.ciudad}, {contrato.propiedad?.provincia}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {contrato.propiedad?.tipo || "Propiedad"}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/propiedades/${contrato.propiedad?.id}`}>Ver propiedad</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Participantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Participantes
              </CardTitle>
              <CardDescription>Personas involucradas en este contrato</CardDescription>
            </CardHeader>
            <CardContent>
              {contrato.participantes && contrato.participantes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Persona</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Contacto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contrato.participantes.map((participante) => (
                      <TableRow key={participante.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-muted p-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{participante.person?.full_name || "Sin nombre"}</p>
                              {participante.share_pct && (
                                <p className="text-xs text-muted-foreground">{participante.share_pct}% participación</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {roleLabels[participante.party_role] || participante.party_role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[participante.status] || ""}>
                            {statusLabels[participante.status] || participante.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {participante.person?.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {participante.person.email}
                              </div>
                            )}
                            {participante.person?.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {participante.person.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No hay participantes registrados</div>
              )}
            </CardContent>
          </Card>

          {/* Ajustes programados */}
          {contrato.ajustes_manuales && contrato.ajustes_manuales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Ajustes Programados
                </CardTitle>
                <CardDescription>Calendario de ajustes de alquiler</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contrato.ajustes_manuales.map((ajuste, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(ajuste.fecha)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ajuste.tipo === "indice" ? "Índice" : "Monto fijo"}</Badge>
                        </TableCell>
                        <TableCell>
                          {ajuste.tipo === "indice"
                            ? ajuste.indice?.toUpperCase()
                            : formatCurrency(ajuste.monto || 0, contrato.moneda)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Notas */}
          {(contrato.notas_internas || contrato.clausulas_especiales) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Notas y Cláusulas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contrato.notas_internas && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Notas internas</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contrato.notas_internas}</p>
                  </div>
                )}
                {contrato.clausulas_especiales && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Cláusulas especiales</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contrato.clausulas_especiales}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Vigencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Vigencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Inicio</p>
                  <p className="font-medium">{formatDate(contrato.fecha_inicio)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fin</p>
                  <p className="font-medium">{formatDate(contrato.fecha_fin)}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Duración</p>
                <p className="font-medium">{duracionMeses} meses</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencimiento mensual</p>
                <p className="font-medium">Día {contrato.dia_vencimiento}</p>
              </div>
            </CardContent>
          </Card>

          {/* Datos financieros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Datos Financieros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Alquiler base</p>
                <p className="text-xl font-semibold">{formatCurrency(contrato.monto_base, contrato.moneda)}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Índice de ajuste</p>
                  <p className="font-medium">{contrato.indice_ajuste?.toUpperCase() || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Periodicidad</p>
                  <p className="font-medium">Cada {contrato.periodicidad_ajuste} meses</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Depósito</p>
                <p className="font-medium">{formatCurrency(contrato.deposito_monto, contrato.deposito_moneda)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Honorarios</p>
                <p className="font-medium">{contrato.honorarios_porcentaje}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Garantía */}
          {contrato.garantia_tipo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Garantía
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium capitalize">{contrato.garantia_tipo.replace("_", " ")}</p>
                </div>
                {contrato.garantia_detalle && (
                  <div>
                    <p className="text-xs text-muted-foreground">Detalle</p>
                    <p className="text-sm">{contrato.garantia_detalle}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Información del sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>{formatDate(contrato.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{contrato.id.slice(0, 8)}...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
