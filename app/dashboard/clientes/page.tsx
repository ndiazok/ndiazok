"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, MoreHorizontal, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchWithError, showError } from "@/lib/client-errors"
import { ErrorBoundary } from "@/components/error-boundary"

interface Cliente {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string | null
  roles?: string[]
  company_name: string | null
}

function ClientesContent() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setError(null)
        const result = await fetchWithError<{ data: Cliente[] } | Cliente[]>("/api/admin/clients")
        
        const data = Array.isArray(result) ? result : result.data || []
        const clientesData = data.filter(
          (c: Cliente) => c.role !== "admin" && !(c.roles || []).includes("admin")
        )
        setClientes(clientesData)
      } catch (err) {
        showError(err, "Error al cargar clientes")
        setError("No se pudieron cargar los clientes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientes()
  }, [])

  const propietarios = clientes.filter((c) => c.role === "propietario" || (c.roles || []).includes("propietario"))
  const inquilinos = clientes.filter((c) => c.role === "inquilino" || (c.roles || []).includes("inquilino"))

  const roleColors: Record<string, string> = {
    propietario: "bg-blue-100 text-blue-700",
    inquilino: "bg-emerald-100 text-emerald-700",
    garante: "bg-amber-100 text-amber-700",
    profesional: "bg-violet-100 text-violet-700",
  }

  const roleLabels: Record<string, string> = {
    propietario: "Propietario",
    inquilino: "Inquilino",
    garante: "Garante",
    profesional: "Profesional",
  }

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || "U"
  }

  const getRoles = (cliente: Cliente) => {
    if (cliente.roles && cliente.roles.length > 0) {
      return cliente.roles
    }
    if (cliente.role) {
      return [cliente.role]
    }
    return []
  }

  const ClienteRow = ({ cliente }: { cliente: Cliente }) => {
    const roles = getRoles(cliente)

    return (
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(cliente.full_name, cliente.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{cliente.full_name || "Sin nombre"}</p>
              {cliente.company_name && <p className="text-xs text-muted-foreground">{cliente.company_name}</p>}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {roles.length > 0 ? (
              roles.map((role) => (
                <Badge key={role} variant="secondary" className={roleColors[role] || ""}>
                  {roleLabels[role] || role}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Sin rol
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            {cliente.email && (
              <p className="text-sm flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                {cliente.email}
              </p>
            )}
            {cliente.phone && (
              <p className="text-sm flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {cliente.phone}
              </p>
            )}
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
                <Link href={`/dashboard/clientes/${cliente.id}`}>Ver perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/clientes/${cliente.id}/editar`}>Editar</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/cuentas?titular=${cliente.id}`}>Ver cuenta corriente</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
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
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestiona propietarios, inquilinos y garantes</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clientes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos ({clientes.length})</TabsTrigger>
          <TabsTrigger value="propietarios">Propietarios ({propietarios.length})</TabsTrigger>
          <TabsTrigger value="inquilinos">Inquilinos ({inquilinos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <Card>
            <CardContent className="pt-6">
              {clientes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => (
                      <ClienteRow key={cliente.id} cliente={cliente} />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No hay clientes</h3>
                  <p className="text-sm text-muted-foreground mb-4">Comienza registrando tu primer cliente</p>
                  <Button asChild>
                    <Link href="/dashboard/clientes/nuevo">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Cliente
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="propietarios">
          <Card>
            <CardContent className="pt-6">
              {propietarios.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propietarios.map((cliente) => (
                      <ClienteRow key={cliente.id} cliente={cliente} />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">No hay propietarios registrados</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inquilinos">
          <Card>
            <CardContent className="pt-6">
              {inquilinos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquilinos.map((cliente) => (
                      <ClienteRow key={cliente.id} cliente={cliente} />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">No hay inquilinos registrados</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ClientesPage() {
  return (
    <ErrorBoundary>
      <ClientesContent />
    </ErrorBoundary>
  )
}
