"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Building2,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Camera,
  User,
  Home,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const REQUIRED_DOCS = {
  garante: [
    { type: "dni_frente", label: "DNI Frente", icon: User },
    { type: "dni_dorso", label: "DNI Dorso", icon: User },
    { type: "recibo_sueldo_1", label: "Recibo de Sueldo 1", icon: FileText },
    { type: "recibo_sueldo_2", label: "Recibo de Sueldo 2", icon: FileText },
    { type: "recibo_sueldo_3", label: "Recibo de Sueldo 3", icon: FileText },
    { type: "escritura_propiedad", label: "Escritura de Propiedad", icon: Home },
    { type: "libre_deuda", label: "Libre Deuda Municipal", icon: Shield },
  ],
  inquilino: [
    { type: "dni_frente", label: "DNI Frente", icon: User },
    { type: "dni_dorso", label: "DNI Dorso", icon: User },
    { type: "recibo_sueldo_1", label: "Recibo de Sueldo 1", icon: FileText },
    { type: "recibo_sueldo_2", label: "Recibo de Sueldo 2", icon: FileText },
    { type: "recibo_sueldo_3", label: "Recibo de Sueldo 3", icon: FileText },
    { type: "cuit_constancia", label: "Constancia de CUIT", icon: FileText },
  ],
  co_inquilino: [
    { type: "dni_frente", label: "DNI Frente", icon: User },
    { type: "dni_dorso", label: "DNI Dorso", icon: User },
    { type: "recibo_sueldo_1", label: "Recibo de Sueldo 1", icon: FileText },
    { type: "recibo_sueldo_2", label: "Recibo de Sueldo 2", icon: FileText },
  ],
}

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const supabase = createClient()

  const [invitation, setInvitation] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    fetchInvitation()
    checkUser()
  }, [token])

  const fetchInvitation = async () => {
    try {
      const { data: inv, error: invError } = await supabase
        .from("contract_invitations")
        .select(`
          *,
          contract:contratos(
            *,
            propiedad:propiedades(direccion, ciudad)
          )
        `)
        .eq("token", token)
        .single()

      if (invError || !inv) {
        setError("Invitación no encontrada o expirada")
        setIsLoading(false)
        return
      }

      if (new Date(inv.expires_at) < new Date()) {
        setError("Esta invitación ha expirado")
        setIsLoading(false)
        return
      }

      setInvitation(inv)
      setContract(inv.contract)
      setAccepted(!!inv.accepted_at)
    } catch (e) {
      setError("Error al cargar la invitación")
    } finally {
      setIsLoading(false)
    }
  }

  const checkUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      setUser(authUser)
      fetchUserDocuments(authUser.id)
    }
  }

  const fetchUserDocuments = async (userId: string) => {
    const { data } = await supabase
      .from("person_documents")
      .select("*")
      .eq("person_id", userId)

    setDocuments(data || [])
  }

  const acceptInvitation = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/invitacion/${token}`)
      return
    }

    try {
      // Update invitation
      await supabase
        .from("contract_invitations")
        .update({
          accepted_at: new Date().toISOString(),
          accepted_by: user.id
        })
        .eq("id", invitation.id)

      // Create guarantee link if garante
      if (invitation.role === "garante") {
        await supabase.from("guarantee_links").insert({
          contract_id: invitation.contract_id,
          tenant_person_id: contract.inquilino_id,
          guarantor_person_id: user.id,
          guarantee_type: "propietario",
          status: "pendiente"
        })
      }

      // Add as participant
      await supabase.from("contract_participants").insert({
        contract_id: invitation.contract_id,
        person_id: user.id,
        party_role: invitation.role,
        status: "pendiente"
      })

      setAccepted(true)
      fetchUserDocuments(user.id)
    } catch (e) {
      console.error("Error accepting invitation:", e)
    }
  }

  const uploadDocument = async (docType: string, file: File) => {
    if (!user) return

    setIsUploading(docType)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("document_type", docType)
      formData.append("run_ocr", "true")

      const res = await fetch(`/api/admin/persons/${user.id}/documents`, {
        method: "POST",
        body: formData
      })

      if (res.ok) {
        fetchUserDocuments(user.id)
      }
    } finally {
      setIsUploading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const requiredDocs = REQUIRED_DOCS[invitation.role as keyof typeof REQUIRED_DOCS] || []
  const uploadedTypes = documents.map(d => d.document_type)
  const completedCount = requiredDocs.filter(d => uploadedTypes.includes(d.type)).length
  const progressPct = Math.round((completedCount / requiredDocs.length) * 100)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="font-semibold text-lg">Sigma Inmobiliaria</span>
          </div>
          {user ? (
            <span className="text-sm text-muted-foreground">{user.email}</span>
          ) : (
            <Button asChild size="sm">
              <Link href={`/auth/login?redirect=/invitacion/${token}`}>Iniciar Sesión</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Contract Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Contrato de Alquiler
            </CardTitle>
            <CardDescription>{contract?.propiedad?.direccion}, {contract?.propiedad?.ciudad}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Te han invitado como</span>
              <Badge variant="secondary" className="capitalize">{invitation.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {!accepted ? (
          /* Accept Invitation */
          <Card>
            <CardHeader>
              <CardTitle>Aceptar Invitación</CardTitle>
              <CardDescription>
                Para continuar con el proceso de contratación, necesitamos que aceptes participar y cargues la documentación requerida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Inicio de sesión requerido</AlertTitle>
                  <AlertDescription>
                    Necesitás tener una cuenta para continuar. Si ya tenés cuenta, iniciá sesión. Si no, registrate.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Sesión iniciada</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Estás listo para aceptar la invitación.
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={acceptInvitation}
                disabled={!user}
              >
                {user ? "Aceptar y Continuar" : "Iniciar Sesión para Continuar"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Upload Documents */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Carga de Documentación</CardTitle>
                <CardDescription>
                  Subí los documentos requeridos para completar el proceso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progreso</span>
                    <span className="text-sm text-muted-foreground">{completedCount}/{requiredDocs.length}</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </div>

                {progressPct === 100 && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Documentación completa</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Has subido todos los documentos requeridos. Te notificaremos cuando sean validados.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              {requiredDocs.map((doc) => {
                const uploaded = documents.find(d => d.document_type === doc.type)
                const Icon = doc.icon

                return (
                  <Card key={doc.type} className={uploaded ? "border-green-200 bg-green-50/50" : ""}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${uploaded ? "bg-green-100" : "bg-muted"}`}>
                          <Icon className={`h-5 w-5 ${uploaded ? "text-green-600" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{doc.label}</p>
                          {uploaded ? (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Subido - {uploaded.status === "validado" ? "Validado" : "Pendiente de validación"}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Requerido</p>
                          )}
                        </div>
                        <div>
                          {uploaded ? (
                            <Button size="sm" variant="outline" asChild>
                              <a href={uploaded.url} target="_blank" rel="noopener noreferrer">
                                Ver
                              </a>
                            </Button>
                          ) : (
                            <Label className="cursor-pointer">
                              <Input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) uploadDocument(doc.type, file)
                                }}
                                disabled={isUploading === doc.type}
                              />
                              <Button size="sm" asChild disabled={isUploading === doc.type}>
                                <span>
                                  {isUploading === doc.type ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-1" />
                                      Subir
                                    </>
                                  )}
                                </span>
                              </Button>
                            </Label>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
