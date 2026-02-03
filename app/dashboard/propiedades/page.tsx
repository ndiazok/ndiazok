"use client"

import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, MapPin, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PropertyOwner {
  share_pct: number
  is_primary: boolean
  person: { full_name: string; email: string } | null
}

interface Propiedad {
  id: string
  direccion: string
  ciudad: string
  provincia: string
  tipo: string
  estado: string
  ambientes: number | null
  metros_cuadrados: number | null
  propietario: { full_name: string; email: string } | null
  property_owners: PropertyOwner[]
}

export default function PropiedadesPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPropiedades = async () => {
      try {
        const res = await fetch("/api/admin/properties")
        if (res.ok) {
          const data = await res.json()
          setPropiedades(data || [])
        }
      } catch (error) {
        console.error("Error fetching properties:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropiedades()
  }, [])

  const estadoColors: Record<string, string> = {
    disponible: "bg-emerald-100 text-emerald-700",
    alquilada: "bg-blue-100 text-blue-700",
    en_venta: "bg-amber-100 text-amber-700",
    reservada: "bg-violet-100 text-violet-700",
    mantenimiento: "bg-red-100 text-red-700",
  }

  const estadoLabels: Record<string, string> = {
    disponible: "Disponible",
    alquilada: "Alquilada",
    en_venta: "En Venta",
    reservada: "Reservada",
    mantenimiento: "En Mantenimiento",
  }

  const tipoLabels: Record<string, string> = {
    departamento: "Departamento",
    casa: "Casa",
    ph: "PH",
    local: "Local Comercial",
    oficina: "Oficina",
    cochera: "Cochera",
    terreno: "Terreno",
    galpon: "Galpón",
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Propiedades</h1>
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
          <h1 className="text-2xl font-semibold tracking-tight">Propiedades</h1>
          <p className="text-muted-foreground">Gestiona tu cartera de inmuebles</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/propiedades/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Propiedad
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{propiedades.length} propiedades en cartera</CardTitle>
        </CardHeader>
        <CardContent>
          {propiedades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Comercialización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propiedades.map((propiedad) => {
                  const owners = propiedad.property_owners || []
                  const primaryOwner = owners.find((o) => o.is_primary)?.person || propiedad.propietario

                  return (
                    <TableRow key={propiedad.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-muted p-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{propiedad.direccion}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {propiedad.ciudad}, {propiedad.provincia}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{tipoLabels[propiedad.tipo] || propiedad.tipo}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{primaryOwner?.full_name || "Sin asignar"}</p>
                          {owners.length > 1 && (
                            <p className="text-xs text-muted-foreground">+{owners.length - 1} copropietarios</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {propiedad.en_venta && (
                            <Badge variant="default" className="bg-green-600 text-xs">Venta</Badge>
                          )}
                          {propiedad.en_alquiler && (
                            <Badge variant="default" className="bg-blue-600 text-xs">Alquiler</Badge>
                          )}
                          {propiedad.en_administracion && (
                            <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">Admin</Badge>
                          )}
                          {!propiedad.en_venta && !propiedad.en_alquiler && !propiedad.en_administracion && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={estadoColors[propiedad.estado] || ""}>
                          {estadoLabels[propiedad.estado] || propiedad.estado}
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
                              <Link href={`/dashboard/propiedades/${propiedad.id}`}>Ver detalle</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/propiedades/${propiedad.id}/editar`}>Editar</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/contratos/nuevo?propiedad=${propiedad.id}`} className="text-primary font-medium">
                                Tomar Seña / Nuevo Contrato
                              </Link>
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
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No hay propiedades</h3>
              <p className="text-sm text-muted-foreground mb-4">Comienza agregando tu primera propiedad a la cartera</p>
              <Button asChild>
                <Link href="/dashboard/propiedades/nueva">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Propiedad
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
