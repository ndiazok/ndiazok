"use client"

import React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle, 
  Bug, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Server, 
  Shield, 
  XCircle,
  Eye,
  Check,
  Filter,
  ArrowLeft
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface ErrorLog {
  id: string
  error_type: string
  error_code: string | null
  message: string
  stack_trace: string | null
  endpoint: string | null
  user_agent: string | null
  user_id: string | null
  metadata: any
  status: string
  resolved_by: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
}

interface ErrorStats {
  total: number
  unresolved: number
  today: number
}

interface ErrorGroup {
  error_type: string
  message: string
  count: number
  last_seen: string
}

const errorTypeIcons: Record<string, React.ReactNode> = {
  validation: <AlertTriangle className="h-4 w-4" />,
  authentication: <Shield className="h-4 w-4" />,
  authorization: <Shield className="h-4 w-4" />,
  not_found: <XCircle className="h-4 w-4" />,
  database: <Server className="h-4 w-4" />,
  server: <Server className="h-4 w-4" />,
  network: <RefreshCw className="h-4 w-4" />,
  unknown: <Bug className="h-4 w-4" />,
}

const errorTypeColors: Record<string, string> = {
  validation: "bg-yellow-100 text-yellow-800 border-yellow-200",
  authentication: "bg-red-100 text-red-800 border-red-200",
  authorization: "bg-red-100 text-red-800 border-red-200",
  not_found: "bg-gray-100 text-gray-800 border-gray-200",
  database: "bg-purple-100 text-purple-800 border-purple-200",
  server: "bg-red-100 text-red-800 border-red-200",
  network: "bg-blue-100 text-blue-800 border-blue-200",
  unknown: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function ErroresPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [stats, setStats] = useState<ErrorStats>({ total: 0, unresolved: 0, today: 0 })
  const [grouped, setGrouped] = useState<ErrorGroup[]>([])
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterResolved, setFilterResolved] = useState<string>("unresolved")
  const [resolutionNotes, setResolutionNotes] = useState("")

  const fetchErrors = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filterType !== "all") params.set("type", filterType)
      if (filterResolved !== "all") params.set("resolved", filterResolved === "resolved" ? "true" : "false")
      
      const response = await fetch(`/api/admin/errors?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setErrors(result.data?.errors || [])
        setStats(result.data?.stats || { total: 0, unresolved: 0, today: 0 })
        setGrouped(result.data?.grouped || [])
        setTypeCounts(result.data?.typeCounts || {})
      }
    } catch (error) {
      console.error("Error fetching errors:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchErrors()
  }, [filterType, filterResolved])

  const markAsResolved = async (ids: string[], notes?: string) => {
    try {
      await fetch("/api/admin/errors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids,
          resolved: true,
          resolution_notes: notes,
        }),
      })
      fetchErrors()
      setSelectedError(null)
      setResolutionNotes("")
    } catch (error) {
      console.error("Error resolving:", error)
    }
  }

  const totalUnresolved = typeCounts ? Object.values(typeCounts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Log de Errores</h1>
            <p className="text-muted-foreground">Monitoreo y resolución de errores del sistema</p>
          </div>
        </div>
        <Button onClick={fetchErrors} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sin resolver</p>
                <p className="text-3xl font-bold text-red-600">{stats.unresolved}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoy</p>
                <p className="text-3xl font-bold text-orange-600">{stats.today}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total histórico</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Bug className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resueltos</p>
                <p className="text-3xl font-bold text-green-600">{(stats.total || 0) - (stats.unresolved || 0)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Type Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Errores por tipo</CardTitle>
          <CardDescription>Click en un tipo para filtrar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeCounts).map(([type, count]) => (
              <Badge
                key={type}
                variant="outline"
                className={`cursor-pointer text-sm py-1.5 px-3 ${errorTypeColors[type] || errorTypeColors.unknown} ${filterType === type ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                onClick={() => setFilterType(filterType === type ? "all" : type)}
              >
                <span className="mr-1.5">{errorTypeIcons[type] || errorTypeIcons.unknown}</span>
                {type}
                <span className="ml-2 bg-white/50 rounded-full px-2 py-0.5 text-xs font-bold">
                  {count}
                </span>
              </Badge>
            ))}
            {Object.keys(typeCounts).length === 0 && (
              <p className="text-muted-foreground text-sm">No hay errores sin resolver</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list">Lista de errores</TabsTrigger>
            <TabsTrigger value="grouped">Agrupados</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterResolved} onValueChange={setFilterResolved}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unresolved">Sin resolver</SelectItem>
                <SelectItem value="resolved">Resueltos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="list" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead className="w-[180px]">URL</TableHead>
                  <TableHead className="w-[150px]">Fecha</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : errors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No hay errores para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  errors.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell>
                        <Badge variant="outline" className={errorTypeColors[error.error_type] || errorTypeColors.unknown}>
                          {errorTypeIcons[error.error_type] || errorTypeIcons.unknown}
                          <span className="ml-1">{error.error_type}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate font-mono text-sm">
                          {error.message}
                        </div>
                        {error.error_code && (
                          <div className="text-xs text-muted-foreground">
                            Código: {error.error_code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {error.endpoint || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(error.created_at).toLocaleDateString("es-AR")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(error.created_at).toLocaleTimeString("es-AR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {error.status === "resolved" || error.status === "ignored" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resuelto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedError(error)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {error.status !== "resolved" && error.status !== "ignored" && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => markAsResolved([error.id])}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="grouped" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Errores agrupados</CardTitle>
              <CardDescription>Errores similares agrupados por tipo y mensaje</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grouped.map((group, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={errorTypeColors[group.error_type] || errorTypeColors.unknown}>
                        {errorTypeIcons[group.error_type] || errorTypeIcons.unknown}
                        <span className="ml-1">{group.error_type}</span>
                      </Badge>
                      <div>
                        <p className="font-mono text-sm truncate max-w-lg">{group.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Última vez: {new Date(group.last_seen).toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {group.count}x
                    </Badge>
                  </div>
                ))}
                {grouped.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No hay errores agrupados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Detail Dialog */}
      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedError && (
                <Badge variant="outline" className={errorTypeColors[selectedError.error_type] || errorTypeColors.unknown}>
                  {selectedError.error_type}
                </Badge>
              )}
              Detalle del error
            </DialogTitle>
            <DialogDescription>
              {selectedError && new Date(selectedError.created_at).toLocaleString("es-AR")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedError && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Mensaje</Label>
                <p className="font-mono text-sm bg-muted p-3 rounded mt-1">{selectedError.message}</p>
              </div>
              
              {selectedError.error_code && (
                <div>
                  <Label className="text-muted-foreground">Código</Label>
                  <p className="font-mono text-sm">{selectedError.error_code}</p>
                </div>
              )}
              
              {selectedError.endpoint && (
                <div>
                  <Label className="text-muted-foreground">Endpoint</Label>
                  <p className="font-mono text-sm break-all">{selectedError.endpoint}</p>
                </div>
              )}
              
              {selectedError.stack_trace && (
                <div>
                  <Label className="text-muted-foreground">Stack Trace</Label>
                  <pre className="font-mono text-xs bg-muted p-3 rounded mt-1 overflow-x-auto max-h-48">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}
              
              {selectedError.metadata && (
                <div>
                  <Label className="text-muted-foreground">Metadata</Label>
                  <pre className="font-mono text-xs bg-muted p-3 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedError.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedError.user_agent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="font-mono text-xs text-muted-foreground">{selectedError.user_agent}</p>
                </div>
              )}
              
              {selectedError.status !== "resolved" && selectedError.status !== "ignored" && (
                <div className="border-t pt-4">
                  <Label>Notas de resolución (opcional)</Label>
                  <Textarea 
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe cómo se resolvió el error..."
                    className="mt-2"
                  />
                  <Button 
                    className="mt-3 w-full"
                    onClick={() => markAsResolved([selectedError.id], resolutionNotes)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como resuelto
                  </Button>
                </div>
              )}
              
              {(selectedError.status === "resolved" || selectedError.status === "ignored") && selectedError.resolution_notes && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Notas de resolución</Label>
                  <p className="text-sm bg-green-50 p-3 rounded mt-1 border border-green-200">
                    {selectedError.resolution_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
