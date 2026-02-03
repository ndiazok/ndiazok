"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Mail,
  Phone,
  Edit,
  Home,
  FileText,
  Wallet,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  User,
} from "lucide-react"
import Link from "next/link"

function isValidUUID(str: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

interface Cliente {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string
  roles?: string[]
  company_name: string | null
  created_at: string
  // Legal fields
  tipo_persona: string | null
  dni: string | null
  cuit: string | null
  domicilio_legal: string | null
  localidad: string | null
  provincia: string | null
  codigo_postal: string | null
  nacionalidad: string | null
  estado_civil: string | null
  profesion: string | null
  fecha_nacimiento: string | null
  razon_social: string | null
  tipo_societario: string | null
  fecha_constitucion: string | null
  inscripcion_registral: string | null
  datos_legales_completos: boolean
}

interface Propiedad {
  id: string
  direccion: string
  tipo: string
  estado: string
}

interface Contrato {
  id: string
  propiedad_id: string
  fecha_inicio: string
  fecha_fin: string
  monto_base: number
  estado: string
  propiedades?: Propiedad
}

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const clientId = params.id as string

  useEffect(() => {
    if (!isValidUUID(clientId)) {
      router.push("/dashboard/clientes")
      return
    }

    const fetchData = async () => {
      try {
        const clientRes = await fetch(`/api/admin/clients/${clientId}`)
        const clientData = await clientRes.json()

        const clientInfo = clientData.data || clientData
        if (clientInfo && clientInfo.id) {
          setCliente(clientInfo)

          const roles = clientInfo.roles || [clientInfo.role]
          if (roles.includes("propietario")) {
            const propsRes = await fetch(`/api/admin/properties?owner_id=${clientId}`)
            const propsData = await propsRes.json()
            if (Array.isArray(propsData)) {
              setPropiedades(propsData)
            } else if (propsData.data) {
              setPropiedades(propsData.data)
            }
          }

          if (roles.includes("inquilino")) {
            const contractsRes = await fetch(`/api/admin/contracts?participant_id=${clientId}`)
            const contractsData = await contractsRes.json()
            if (Array.isArray(contractsData)) {
              setContratos(contractsData)
            } else if (contractsData.data) {
              setContratos(contractsData.data)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching client:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [clientId, router])

  const roleColors: Record<string, string> = {
    propietario: "bg-blue-100 text-blue-700",
    inquilino: "bg-emerald-100 text-emerald-700",
    garante: "bg-amber-100 text-amber-700",
    profesional: "bg-violet-100 text-violet-700",
    admin: "bg-red-100 text-red-700",
  }

  const roleLabels: Record<string, string> = {
    propietario: "Propietario",
    inquilino: "Inquilino",
    garante: "Garante",
    profesional: "Profesional",
    admin: "Administrador",
  }

  const estadoCivilLabels: Record<string, string> = {
    soltero: "Soltero/a",
    casado: "Casado/a",
    divorciado: "Divorciado/a",
    viudo: "Viudo/a",
    union_convivencial: "Unión Convivencial",
  }

  const tipoSocietarioLabels: Record<string, string> = {
    SA: "Sociedad Anónima (S.A.)",
    SRL: "S.R.L.",
    SAS: "S.A.S.",
    SCS: "Sociedad en Comandita Simple",
    SC: "Sociedad Colectiva",
    cooperativa: "Cooperativa",
    fundacion: "Fundación",
    asociacion: "Asociación Civil",
    consorcio: "Consorcio de Propietarios",
    fideicomiso: "Fideicomiso",
    otro: "Otro",
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

  const getRoles = () => {
    if (!cliente) return []
    if (cliente.roles && cliente.roles.length > 0) {
      return cliente.roles
    }
    if (cliente.role) {
      return [cliente.role]
    }
    return []
  }

  const calculateLegalCompleteness = () => {
    if (!cliente) return { complete: false, missing: [], percentage: 0 }

    const missing: string[] = []

    if (cliente.tipo_persona === "humana") {
      if (!cliente.full_name) missing.push("Nombre completo")
      if (!cliente.dni) missing.push("DNI")
      if (!cliente.cuit) missing.push("CUIT/CUIL")
      if (!cliente.domicilio_legal) missing.push("Domicilio legal")
      if (!cliente.localidad) missing.push("Localidad")
      if (!cliente.provincia) missing.push("Provincia")
      if (!cliente.estado_civil) missing.push("Estado civil")

      const total = 7
      const filled = total - missing.length
      return { complete: missing.length === 0, missing, percentage: Math.round((filled / total) * 100) }
    } else if (cliente.tipo_persona === "juridica") {
      if (!cliente.razon_social) missing.push("Razón social")
      if (!cliente.cuit) missing.push("CUIT")
      if (!cliente.tipo_societario) missing.push("Tipo societario")
      if (!cliente.domicilio_legal) missing.push("Domicilio legal")
      if (!cliente.localidad) missing.push("Localidad")
      if (!cliente.provincia) missing.push("Provincia")
      if (!cliente.inscripcion_registral) missing.push("Inscripción registral")

      const total = 7
      const filled = total - missing.length
      return { complete: missing.length === 0, missing, percentage: Math.round((filled / total) * 100) }
    }

    return { complete: false, missing: ["Tipo de persona no definido"], percentage: 0 }
  }

  const roles = getRoles()
  const hasRole = (role: string) => roles.includes(role)
  const legalStatus = calculateLegalCompleteness()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Perfil del Cliente</h1>
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

  if (!cliente) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Cliente no encontrado</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">El cliente solicitado no existe.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/clientes">Volver al listado</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Perfil del Cliente</h1>
            <p className="text-muted-foreground">Información detallada del cliente</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/clientes/${cliente.id}/editar`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      {!legalStatus.complete && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">Datos legales incompletos ({legalStatus.percentage}%)</p>
                <p className="text-sm text-amber-700 mt-1">Faltan: {legalStatus.missing.join(", ")}</p>
                <p className="text-xs text-amber-600 mt-2">
                  Los datos legales son necesarios para generar contratos válidos.
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
              >
                <Link href={`/dashboard/clientes/${cliente.id}/editar`}>Completar datos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info Card */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(cliente.full_name, cliente.email)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold">
                      {cliente.tipo_persona === "juridica" ? cliente.razon_social : cliente.full_name || "Sin nombre"}
                    </h2>
                    {legalStatus.complete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  {cliente.tipo_persona === "juridica" && cliente.tipo_societario && (
                    <p className="text-muted-foreground">
                      {tipoSocietarioLabels[cliente.tipo_societario] || cliente.tipo_societario}
                    </p>
                  )}
                  {cliente.tipo_persona === "humana" && cliente.profesion && (
                    <p className="text-muted-foreground">{cliente.profesion}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {cliente.tipo_persona === "juridica" ? "Persona Jurídica" : "Persona Humana"}
                  </Badge>
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <Badge key={role} variant="secondary" className={roleColors[role] || ""}>
                        {roleLabels[role] || role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Sin rol asignado
                    </Badge>
                  )}
                </div>
                <div className="grid gap-2 pt-2">
                  {cliente.email && (
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${cliente.email}`} className="text-primary hover:underline">
                        {cliente.email}
                      </a>
                    </p>
                  )}
                  {cliente.phone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${cliente.phone}`} className="text-primary hover:underline">
                        {cliente.phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href={`/dashboard/cuentas?titular=${cliente.id}`}>
                <Wallet className="mr-2 h-4 w-4" />
                Ver cuenta corriente
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href={`/dashboard/propiedades/nueva?propietario=${cliente.id}`}>
                <Home className="mr-2 h-4 w-4" />
                Agregar como propietario
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href={`/dashboard/contratos/nuevo?inquilino=${cliente.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Agregar como inquilino
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Identity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Datos de Identificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              {cliente.tipo_persona === "humana" ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">DNI</dt>
                    <dd className="font-medium">
                      {cliente.dni || <span className="text-amber-500">Sin completar</span>}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">CUIT/CUIL</dt>
                    <dd className="font-medium">
                      {cliente.cuit || <span className="text-amber-500">Sin completar</span>}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Estado Civil</dt>
                    <dd className="font-medium">
                      {cliente.estado_civil ? (
                        estadoCivilLabels[cliente.estado_civil] || cliente.estado_civil
                      ) : (
                        <span className="text-amber-500">Sin completar</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Nacionalidad</dt>
                    <dd className="font-medium">{cliente.nacionalidad || "Argentina"}</dd>
                  </div>
                  {cliente.fecha_nacimiento && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Fecha Nac.</dt>
                      <dd className="font-medium">{new Date(cliente.fecha_nacimiento).toLocaleDateString("es-AR")}</dd>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">CUIT</dt>
                    <dd className="font-medium">
                      {cliente.cuit || <span className="text-amber-500">Sin completar</span>}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tipo</dt>
                    <dd className="font-medium">
                      {cliente.tipo_societario ? (
                        tipoSocietarioLabels[cliente.tipo_societario]
                      ) : (
                        <span className="text-amber-500">Sin completar</span>
                      )}
                    </dd>
                  </div>
                  {cliente.fecha_constitucion && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Constitución</dt>
                      <dd className="font-medium">
                        {new Date(cliente.fecha_constitucion).toLocaleDateString("es-AR")}
                      </dd>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground">Inscripción Registral</dt>
                    <dd className="font-medium text-xs">
                      {cliente.inscripcion_registral || <span className="text-amber-500">Sin completar</span>}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Domicilio Legal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cliente.domicilio_legal ? (
              <div className="space-y-2">
                <p className="font-medium">{cliente.domicilio_legal}</p>
                <p className="text-sm text-muted-foreground">
                  {[cliente.localidad, cliente.provincia, cliente.codigo_postal].filter(Boolean).join(", ")}
                </p>
              </div>
            ) : (
              <p className="text-amber-500 text-sm">Domicilio no completado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {hasRole("propietario") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              Propiedades ({propiedades.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {propiedades.length > 0 ? (
              <div className="space-y-3">
                {propiedades.map((prop) => (
                  <div key={prop.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{prop.direccion}</p>
                      <p className="text-sm text-muted-foreground">{prop.tipo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{prop.estado}</Badge>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/propiedades/${prop.id}`}>Ver</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Este propietario no tiene propiedades registradas.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {hasRole("inquilino") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contratos ({contratos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contratos.length > 0 ? (
              <div className="space-y-3">
                {contratos.map((contrato) => (
                  <div key={contrato.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{contrato.propiedades?.direccion || "Propiedad"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(contrato.fecha_inicio).toLocaleDateString()} -{" "}
                        {new Date(contrato.fecha_fin).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{contrato.estado}</Badge>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/contratos/${contrato.id}`}>Ver</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Este inquilino no tiene contratos registrados.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">
            Cliente registrado el{" "}
            {new Date(cliente.created_at).toLocaleDateString("es-AR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
