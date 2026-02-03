"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  AlertCircle,
  FileText,
  Users,
  Upload,
  Send,
  Download,
  Eye,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
  Building2,
  DollarSign,
  PenTool,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

const PIPELINE_STAGES = [
  { id: "borrador", label: "Borrador", icon: FileText },
  { id: "seña_pendiente", label: "Seña Pendiente", icon: DollarSign },
  { id: "seña_recibida", label: "Seña Recibida", icon: Check },
  { id: "docs_inquilino", label: "Docs Inquilino", icon: Upload },
  { id: "docs_garantes", label: "Docs Garantes", icon: Users },
  { id: "revision_legal", label: "Revisión", icon: Eye },
  { id: "pre_aprobado", label: "Pre-aprobado", icon: CheckCircle },
  { id: "contrato_generado", label: "Contrato Listo", icon: FileText },
  { id: "firma_pendiente", label: "Firma Pendiente", icon: PenTool },
  { id: "firmado", label: "Firmado", icon: Check },
  { id: "activo", label: "Activo", icon: Building2 },
]

const SEMAFORO_COLORS: Record<string, string> = {
  rojo: "bg-red-500",
  amarillo: "bg-yellow-500",
  verde: "bg-green-500",
  azul: "bg-blue-500",
  gris: "bg-gray-400",
}

export default function ContractPipelinePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [contract, setContract] = useState<any>(null)
  const [checklist, setChecklist] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("garante")
  const [señaDialogOpen, setSeñaDialogOpen] = useState(false)
  const [señaMonto, setSeñaMonto] = useState("")
  const [isAdvancing, setIsAdvancing] = useState(false)

  useEffect(() => {
    fetchContract()
    fetchChecklist()
  }, [id])

  const fetchContract = async () => {
    try {
      const res = await fetch(`/api/admin/contracts/${id}/pipeline`)
      const data = await res.json()
      setContract(data)
    } catch (error) {
      console.error("Error fetching contract:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`/api/admin/contracts/${id}/checklist`)
      const data = await res.json()
      setChecklist(data)
    } catch (error) {
      console.error("Error fetching checklist:", error)
    }
  }

  const advanceStatus = async () => {
    setIsAdvancing(true)
    try {
      await fetch(`/api/admin/contracts/${id}/pipeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance_status" }),
      })
      fetchContract()
    } finally {
      setIsAdvancing(false)
    }
  }

  const sendInvitation = async () => {
    try {
      const res = await fetch(`/api/admin/contracts/${id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (data.invitation_url) {
        navigator.clipboard.writeText(data.invitation_url)
        alert("Link copiado al portapapeles: " + data.invitation_url)
      }
      setInviteDialogOpen(false)
      setInviteEmail("")
      fetchContract()
    } catch (error) {
      console.error("Error sending invitation:", error)
    }
  }

  const registerSeña = async () => {
    try {
      await fetch(`/api/admin/contracts/${id}/pipeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_seña",
          monto: parseFloat(señaMonto),
          fecha: new Date().toISOString().split("T")[0],
        }),
      })
      setSeñaDialogOpen(false)
      fetchContract()
    } catch (error) {
      console.error("Error registering seña:", error)
    }
  }

  const generateChecklist = async () => {
    await fetch(`/api/admin/contracts/${id}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_default" }),
    })
    fetchChecklist()
  }

  const toggleChecklistItem = async (itemId: string, completed: boolean) => {
    await fetch(`/api/admin/contracts/${id}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_item", item_id: itemId, is_completed: completed }),
    })
    fetchChecklist()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!contract) {
    return <div className="p-8 text-center">Contrato no encontrado</div>
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.id === contract.pipeline_status)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="bg-transparent">
            <Link href={`/dashboard/contratos/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Pipeline de Contratación
              <div className={`w-4 h-4 rounded-full ${SEMAFORO_COLORS[contract.semaforo]}`} title={contract.semaforo} />
            </h1>
            <p className="text-muted-foreground">{contract.propiedad?.direccion}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {contract.completionPct}% Completado
          </Badge>
          <Button onClick={advanceStatus} disabled={isAdvancing || !contract.canAdvance}>
            {isAdvancing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
            Avanzar Etapa
          </Button>
        </div>
      </div>

      {/* Pipeline Progress */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between relative">
            {PIPELINE_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex
              const isCurrent = index === currentStageIndex
              const Icon = stage.icon

              return (
                <div key={stage.id} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center max-w-[80px] ${isCurrent ? "font-semibold" : "text-muted-foreground"}`}
                  >
                    {stage.label}
                  </span>
                </div>
              )
            })}
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted-foreground/20" style={{ zIndex: 0 }}>
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contract.pipeline_status === "seña_pendiente" && (
                  <Dialog open={señaDialogOpen} onOpenChange={setSeñaDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Registrar Seña
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Registrar Seña</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Monto</Label>
                          <Input
                            type="number"
                            value={señaMonto}
                            onChange={(e) => setSeñaMonto(e.target.value)}
                            placeholder="Ej: 50000"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={registerSeña}>Confirmar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start bg-transparent" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invitar Garante
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invitar Participante</DialogTitle>
                      <DialogDescription>Se enviará un link para que cargue sus documentos</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="garante@email.com"
                        />
                      </div>
                      <div>
                        <Label>Rol</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="garante">Garante</SelectItem>
                            <SelectItem value="co_inquilino">Co-inquilino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={sendInvitation}>Enviar Invitación</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {checklist.length === 0 && (
                  <Button className="w-full justify-start bg-transparent" variant="outline" onClick={generateChecklist}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Checklist
                  </Button>
                )}

                <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                  <Link href={`/dashboard/contratos/${id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Contrato
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Contract Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inquilino</span>
                  <span className="font-medium">{contract.inquilino?.full_name || "Sin asignar"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Base</span>
                  <span className="font-medium">
                    {contract.moneda} {contract.monto_base?.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duración</span>
                  <span className="font-medium">
                    {contract.fecha_inicio} al {contract.fecha_fin}
                  </span>
                </div>
                {contract.seña_monto && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seña</span>
                      <span className="font-medium text-green-600">
                        {contract.moneda} {contract.seña_monto?.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progreso de Documentación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={contract.completionPct} className="h-3" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      {checklist.reduce((acc, g) => acc + g.items.filter((i: any) => i.is_completed).length, 0)}{" "}
                      completados
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>
                      {checklist.reduce((acc, g) => acc + g.items.filter((i: any) => !i.is_completed).length, 0)}{" "}
                      pendientes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          {checklist.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No hay checklist generado</p>
                <Button onClick={generateChecklist}>Generar Checklist por Defecto</Button>
              </CardContent>
            </Card>
          ) : (
            checklist.map((group) => (
              <Card key={`${group.participant_type}_${group.participant_id}`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {group.participant_type === "inquilino" && <Users className="h-5 w-5" />}
                    {group.participant_type === "garante" && <Users className="h-5 w-5" />}
                    {group.participant_type === "inmobiliaria" && <Building2 className="h-5 w-5" />}
                    {group.participant_name}
                    <Badge variant="outline" className="ml-auto">
                      {group.items.filter((i: any) => i.is_completed).length}/{group.items.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={(checked) => toggleChecklistItem(item.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <span className={item.is_completed ? "line-through text-muted-foreground" : ""}>
                            {item.requirement}
                          </span>
                          {item.is_required && !item.is_completed && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Requerido
                            </Badge>
                          )}
                        </div>
                        {item.document && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={item.document.url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inquilino */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inquilino</CardTitle>
              </CardHeader>
              <CardContent>
                {contract.inquilino ? (
                  <div className="space-y-2">
                    <p className="font-medium">{contract.inquilino.full_name}</p>
                    <p className="text-sm text-muted-foreground">{contract.inquilino.email}</p>
                    <p className="text-sm text-muted-foreground">{contract.inquilino.phone}</p>
                    {contract.inquilino.datos_validados ? (
                      <Badge className="bg-green-100 text-green-800">Datos validados</Badge>
                    ) : (
                      <Badge variant="outline">Pendiente validación</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sin asignar</p>
                )}
              </CardContent>
            </Card>

            {/* Garantes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Garantes</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Invitar
                </Button>
              </CardHeader>
              <CardContent>
                {contract.guarantees?.length > 0 ? (
                  <div className="space-y-3">
                    {contract.guarantees.map((g: any) => (
                      <div key={g.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{g.guarantor?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{g.guarantee_type}</p>
                        </div>
                        <Badge
                          variant={g.status === "aprobado" ? "default" : "outline"}
                          className={g.status === "aprobado" ? "bg-green-100 text-green-800" : ""}
                        >
                          {g.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sin garantes</p>
                )}

                {/* Pending invitations */}
                {contract.invitations?.filter((i: any) => !i.accepted_at).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Invitaciones pendientes</p>
                    {contract.invitations
                      .filter((i: any) => !i.accepted_at)
                      .map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between text-sm py-1">
                          <span>{inv.email}</span>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendiente
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cambios</CardTitle>
            </CardHeader>
            <CardContent>
              {contract.status_history?.length > 0 ? (
                <div className="space-y-4">
                  {contract.status_history.map((h: any, index: number) => (
                    <div key={h.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        {index < contract.status_history.length - 1 && <div className="w-0.5 h-full bg-muted" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{h.previous_status || "Inicio"}</span>
                          <ArrowRight className="h-4 w-4" />
                          <span className="font-medium">{h.new_status}</span>
                        </div>
                        {h.change_reason && <p className="text-sm text-muted-foreground">{h.change_reason}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(h.created_at).toLocaleString()} por {h.changed_by_user?.full_name || "Sistema"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Sin historial de cambios</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
