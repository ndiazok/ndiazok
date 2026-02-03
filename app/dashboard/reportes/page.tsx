"use client"

import { useState } from "react"
import { FileSpreadsheet, FileText, Download, Loader2, Filter, Calendar, Building2, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const reportTypes = [
  { id: "cobranzas", label: "Cobranzas", description: "Recibos de alquiler y pagos" },
  { id: "liquidaciones", label: "Liquidaciones", description: "Liquidaciones a propietarios" },
  { id: "ocupacion", label: "Ocupación", description: "Estado de propiedades" },
  { id: "rentabilidad", label: "Rentabilidad", description: "Rentabilidad por propietario" },
  { id: "contratos", label: "Contratos", description: "Estado de contratos" },
]

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState("cobranzas")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [loading, setLoading] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  const generateReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ tipo: tipoReporte })
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)

      const res = await fetch(`/api/admin/reports?${params}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      setReportData(data)
    } catch (error: any) {
      console.error("Error:", error)
      alert("Error al generar reporte: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    if (!reportData) return
    setExportingPDF(true)
    
    try {
      const { jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default
      
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(20)
      doc.setTextColor(30, 30, 30)
      doc.text("SIGMA", 14, 20)
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text("Inmobiliaria", 14, 26)
      
      // Title
      doc.setFontSize(16)
      doc.setTextColor(30, 30, 30)
      doc.text(reportData.titulo, 14, 40)
      
      // Filters
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      let filterText = `Generado: ${new Date(reportData.generado).toLocaleString("es-AR")}`
      if (desde || hasta) {
        filterText += ` | Período: ${desde || "..."} a ${hasta || "..."}`
      }
      doc.text(filterText, 14, 48)
      
      // Table
      const headers = reportData.columnas
      const rows = reportData.data.map((row: any) => {
        return Object.values(row).map((val: any) => {
          if (typeof val === "number") {
            return val.toLocaleString("es-AR")
          }
          return String(val || "-")
        })
      })
      
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 55,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [50, 50, 50], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      })
      
      // Totals if available
      if (reportData.totales) {
        const finalY = (doc as any).lastAutoTable.finalY + 10
        doc.setFontSize(10)
        doc.setTextColor(30, 30, 30)
        
        if (tipoReporte === "cobranzas") {
          doc.text(`Total Pendiente: $${reportData.totales.pendiente?.toLocaleString("es-AR") || 0}`, 14, finalY)
          doc.text(`Total Cobrado: $${reportData.totales.cobrado?.toLocaleString("es-AR") || 0}`, 14, finalY + 6)
        } else if (tipoReporte === "liquidaciones") {
          doc.text(`Total Neto: $${reportData.totales.totalNeto?.toLocaleString("es-AR") || 0}`, 14, finalY)
        }
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
        doc.text("Sigma Inmobiliaria - Sistema de Gestión", 14, doc.internal.pageSize.height - 10)
      }
      
      doc.save(`${reportData.titulo.toLowerCase().replace(/\s/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error: any) {
      console.error("Error exporting PDF:", error)
      alert("Error al exportar PDF")
    } finally {
      setExportingPDF(false)
    }
  }

  const exportToExcel = async () => {
    if (!reportData) return
    setExportingExcel(true)
    
    try {
      const XLSX = await import("xlsx")
      
      // Prepare data with headers
      const wsData = [
        [reportData.titulo],
        [`Generado: ${new Date(reportData.generado).toLocaleString("es-AR")}`],
        [],
        reportData.columnas,
        ...reportData.data.map((row: any) => Object.values(row))
      ]
      
      // Add totals
      if (reportData.totales) {
        wsData.push([])
        if (tipoReporte === "cobranzas") {
          wsData.push(["Total Pendiente:", reportData.totales.pendiente])
          wsData.push(["Total Cobrado:", reportData.totales.cobrado])
        } else if (tipoReporte === "liquidaciones") {
          wsData.push(["Total Neto:", reportData.totales.totalNeto])
        }
      }
      
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      
      // Set column widths
      ws["!cols"] = reportData.columnas.map(() => ({ wch: 18 }))
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Reporte")
      
      XLSX.writeFile(wb, `${reportData.titulo.toLowerCase().replace(/\s/g, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error: any) {
      console.error("Error exporting Excel:", error)
      alert("Error al exportar Excel")
    } finally {
      setExportingExcel(false)
    }
  }

  const formatCurrency = (val: number, moneda?: string) => {
    return `${moneda === "USD" ? "US$" : "$"} ${val?.toLocaleString("es-AR") || 0}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">Genera y exporta reportes del sistema</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filtros */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Reporte</Label>
              <Select value={tipoReporte} onValueChange={setTipoReporte}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {reportTypes.find(t => t.id === tipoReporte)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Desde
              </Label>
              <Input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Hasta
              </Label>
              <Input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>

            <Button onClick={generateReport} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar Reporte"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{reportData?.titulo || "Reporte"}</CardTitle>
              <CardDescription>
                {reportData ? (
                  <>
                    {reportData.data.length} registros | Generado: {new Date(reportData.generado).toLocaleString("es-AR")}
                  </>
                ) : (
                  "Selecciona filtros y genera el reporte"
                )}
              </CardDescription>
            </div>
            {reportData && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  disabled={exportingPDF}
                >
                  {exportingPDF ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  disabled={exportingExcel}
                >
                  {exportingExcel ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  Excel
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!reportData ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>Configura los filtros y haz clic en "Generar Reporte"</p>
              </div>
            ) : reportData.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>No hay datos para mostrar con los filtros seleccionados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Totales */}
                {reportData.totales && (
                  <div className="flex gap-4 flex-wrap">
                    {tipoReporte === "cobranzas" && (
                      <>
                        <div className="bg-yellow-50 dark:bg-yellow-950 px-4 py-2 rounded-lg">
                          <p className="text-xs text-muted-foreground">Pendiente</p>
                          <p className="text-lg font-semibold text-yellow-600">
                            {formatCurrency(reportData.totales.pendiente)}
                          </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950 px-4 py-2 rounded-lg">
                          <p className="text-xs text-muted-foreground">Cobrado</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(reportData.totales.cobrado)}
                          </p>
                        </div>
                      </>
                    )}
                    {tipoReporte === "liquidaciones" && (
                      <div className="bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-lg">
                        <p className="text-xs text-muted-foreground">Total Neto</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {formatCurrency(reportData.totales.totalNeto)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tabla */}
                <div className="rounded-md border overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        {reportData.columnas.map((col: string, i: number) => (
                          <TableHead key={i}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.data.map((row: any, i: number) => (
                        <TableRow key={i}>
                          {Object.entries(row).map(([key, val]: [string, any], j: number) => (
                            <TableCell key={j}>
                              {key === "estado" ? (
                                <Badge variant={
                                  val === "pagado" || val === "pagada" || val === "activo" || val === "Ocupada" ? "default" :
                                  val === "pendiente" || val === "borrador" || val === "Disponible" ? "secondary" :
                                  val === "vencido" || val === "finalizado" ? "destructive" : "outline"
                                }>
                                  {val}
                                </Badge>
                              ) : key === "monto" || key === "ingresos" || key === "deducciones" || key === "neto" ? (
                                formatCurrency(val, row.moneda)
                              ) : key === "dias_restantes" ? (
                                <span className={val < 0 ? "text-red-600" : val < 30 ? "text-yellow-600" : ""}>
                                  {val} días
                                </span>
                              ) : key === "moneda" ? null : (
                                String(val || "-")
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Types Quick Access */}
      <div className="grid gap-4 md:grid-cols-5">
        {reportTypes.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              tipoReporte === type.id ? "border-primary" : ""
            }`}
            onClick={() => setTipoReporte(type.id)}
          >
            <CardContent className="pt-4">
              <p className="font-medium">{type.label}</p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
