"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  Users,
  Building2,
  Target,
  AlertTriangle,
  Clock,
} from "lucide-react"
import Link from "next/link"

interface SilenceData {
  summary: {
    forgottenLeads: number
    silentOwners: number
    silentTenants: number
    silentProperties: number
    total: number
  }
  forgottenLeads: Array<{
    id: string
    nombre: string
    email: string
    telefono: string
    interes: string
    temperatura: string
    daysSilent: number
    urgency: string
  }>
  silentOwners: Array<{
    id: string
    full_name: string
    email: string
    phone: string
    properties: string[]
    daysSilent: number
    urgency: string
  }>
  silentTenants: Array<{
    id: string
    full_name: string
    email: string
    phone: string
    property: string
    daysSilent: number
    urgency: string
  }>
  silentProperties: Array<{
    id: string
    direccion: string
    ciudad: string
    daysSilent: number
    urgency: string
  }>
}

const urgencyColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
}

export default function SilenceAlertsPage() {
  const [data, setData] = useState<SilenceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/admin/alerts/silences")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  function getWhatsAppLink(phone: string, name: string, type: string) {
    const firstName = name.split(" ")[0]
    let message = ""
    
    if (type === "lead") {
      message = `Hola ${firstName}! Soy de Sigma Inmobiliaria. Hace un tiempo te contactaste con nosotros y quería saber si seguís interesado en alguna propiedad. ¿Cómo puedo ayudarte?`
    } else if (type === "owner") {
      message = `Hola ${firstName}! Soy de Sigma Inmobiliaria. Te escribo para ponernos al día sobre tus propiedades. ¿Cómo va todo? ¿Hay algo en lo que pueda ayudarte?`
    } else {
      message = `Hola ${firstName}! Soy de Sigma Inmobiliaria. Te escribo para saber cómo va todo con la propiedad. ¿Hay algo que necesites o algún tema que quieras conversar?`
    }
    
    return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="h-20 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, forgottenLeads, silentOwners, silentTenants, silentProperties } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Alertas de Silencio</h1>
          <p className="text-muted-foreground">Contactos sin comunicación reciente</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={summary.forgottenLeads > 0 ? "border-amber-200 bg-amber-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads Olvidados</CardTitle>
            <Target className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.forgottenLeads}</div>
            <p className="text-xs text-muted-foreground">Sin contacto +7 días</p>
          </CardContent>
        </Card>

        <Card className={summary.silentOwners > 0 ? "border-blue-200 bg-blue-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propietarios</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.silentOwners}</div>
            <p className="text-xs text-muted-foreground">Sin contacto +30 días</p>
          </CardContent>
        </Card>

        <Card className={summary.silentTenants > 0 ? "border-purple-200 bg-purple-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inquilinos</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.silentTenants}</div>
            <p className="text-xs text-muted-foreground">Sin contacto +30 días</p>
          </CardContent>
        </Card>

        <Card className={summary.silentProperties > 0 ? "border-orange-200 bg-orange-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.silentProperties}</div>
            <p className="text-xs text-muted-foreground">Sin consultas +30 días</p>
          </CardContent>
        </Card>
      </div>

      {summary.total === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">¡Todo al día!</h3>
            <p className="text-muted-foreground">No hay contactos sin comunicación reciente</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="leads">
          <TabsList>
            <TabsTrigger value="leads" className="gap-2">
              <Target className="h-4 w-4" />
              Leads ({summary.forgottenLeads})
            </TabsTrigger>
            <TabsTrigger value="owners" className="gap-2">
              <Users className="h-4 w-4" />
              Propietarios ({summary.silentOwners})
            </TabsTrigger>
            <TabsTrigger value="tenants" className="gap-2">
              <Users className="h-4 w-4" />
              Inquilinos ({summary.silentTenants})
            </TabsTrigger>
            <TabsTrigger value="properties" className="gap-2">
              <Building2 className="h-4 w-4" />
              Propiedades ({summary.silentProperties})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>Leads sin seguimiento</CardTitle>
                <CardDescription>Más de 7 días sin contacto</CardDescription>
              </CardHeader>
              <CardContent>
                {forgottenLeads.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay leads olvidados</p>
                ) : (
                  <div className="space-y-3">
                    {forgottenLeads.map((lead) => (
                      <div key={lead.id} className={`flex items-center justify-between p-4 rounded-lg border ${urgencyColors[lead.urgency]}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lead.nombre}</span>
                            <Badge variant="outline">{lead.temperatura}</Badge>
                            <Badge variant="secondary">{lead.interes}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {lead.daysSilent} días sin contacto
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lead.telefono && (
                            <>
                              <Button size="icon" variant="ghost" asChild>
                                <a href={`tel:${lead.telefono}`}><Phone className="h-4 w-4" /></a>
                              </Button>
                              <Button size="icon" variant="ghost" className="text-green-600" asChild>
                                <a href={getWhatsAppLink(lead.telefono, lead.nombre, "lead")} target="_blank" rel="noopener noreferrer">
                                  <MessageSquare className="h-4 w-4" />
                                </a>
                              </Button>
                            </>
                          )}
                          {lead.email && (
                            <Button size="icon" variant="ghost" asChild>
                              <a href={`mailto:${lead.email}`}><Mail className="h-4 w-4" /></a>
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/crm/${lead.id}`}>Ver</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="owners">
            <Card>
              <CardHeader>
                <CardTitle>Propietarios sin contacto</CardTitle>
                <CardDescription>Más de 30 días sin comunicación</CardDescription>
              </CardHeader>
              <CardContent>
                {silentOwners.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Todos los propietarios al día</p>
                ) : (
                  <div className="space-y-3">
                    {silentOwners.map((owner) => (
                      <div key={owner.id} className={`flex items-center justify-between p-4 rounded-lg border ${urgencyColors[owner.urgency]}`}>
                        <div className="flex-1">
                          <span className="font-medium">{owner.full_name}</span>
                          <div className="text-sm text-muted-foreground">
                            {owner.properties.slice(0, 2).join(", ")}
                            {owner.properties.length > 2 && ` +${owner.properties.length - 2} más`}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {owner.daysSilent} días sin contacto
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {owner.phone && (
                            <>
                              <Button size="icon" variant="ghost" asChild>
                                <a href={`tel:${owner.phone}`}><Phone className="h-4 w-4" /></a>
                              </Button>
                              <Button size="icon" variant="ghost" className="text-green-600" asChild>
                                <a href={getWhatsAppLink(owner.phone, owner.full_name, "owner")} target="_blank" rel="noopener noreferrer">
                                  <MessageSquare className="h-4 w-4" />
                                </a>
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/propietarios/${owner.id}`}>Ver</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <CardTitle>Inquilinos sin contacto</CardTitle>
                <CardDescription>Más de 30 días sin comunicación</CardDescription>
              </CardHeader>
              <CardContent>
                {silentTenants.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Todos los inquilinos al día</p>
                ) : (
                  <div className="space-y-3">
                    {silentTenants.map((tenant) => (
                      <div key={tenant.id} className={`flex items-center justify-between p-4 rounded-lg border ${urgencyColors[tenant.urgency]}`}>
                        <div className="flex-1">
                          <span className="font-medium">{tenant.full_name}</span>
                          <div className="text-sm text-muted-foreground">{tenant.property}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {tenant.daysSilent} días sin contacto
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {tenant.phone && (
                            <>
                              <Button size="icon" variant="ghost" asChild>
                                <a href={`tel:${tenant.phone}`}><Phone className="h-4 w-4" /></a>
                              </Button>
                              <Button size="icon" variant="ghost" className="text-green-600" asChild>
                                <a href={getWhatsAppLink(tenant.phone, tenant.full_name, "tenant")} target="_blank" rel="noopener noreferrer">
                                  <MessageSquare className="h-4 w-4" />
                                </a>
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/clientes/${tenant.id}`}>Ver</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>Propiedades sin consultas</CardTitle>
                <CardDescription>Publicadas hace más de 30 días sin actividad</CardDescription>
              </CardHeader>
              <CardContent>
                {silentProperties.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Todas las propiedades con actividad</p>
                ) : (
                  <div className="space-y-3">
                    {silentProperties.map((prop) => (
                      <div key={prop.id} className={`flex items-center justify-between p-4 rounded-lg border ${urgencyColors[prop.urgency]}`}>
                        <div className="flex-1">
                          <span className="font-medium">{prop.direccion}</span>
                          <div className="text-sm text-muted-foreground">{prop.ciudad}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {prop.daysSilent} días sin consultas
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/propiedades/${prop.id}`}>Ver propiedad</Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/propiedades/metricas?property=${prop.id}`}>Ver métricas</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
