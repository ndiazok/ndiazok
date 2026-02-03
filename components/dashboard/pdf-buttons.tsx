"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Download, Printer, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PDFButtonsProps {
  type: "receipt" | "liquidation" | "contract"
  id: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost"
}

export function PDFButtons({ type, id, size = "sm", variant = "outline" }: PDFButtonsProps) {
  const [loading, setLoading] = useState(false)

  const urls: Record<string, string> = {
    receipt: `/api/admin/pdf/receipt/${id}`,
    liquidation: `/api/admin/pdf/liquidation/${id}`,
    contract: `/api/admin/pdf/contract/${id}`,
  }

  const labels: Record<string, string> = {
    receipt: "Recibo",
    liquidation: "Liquidación",
    contract: "Contrato",
  }

  const handleView = () => {
    window.open(urls[type], "_blank")
  }

  const handlePrint = () => {
    const printWindow = window.open(urls[type], "_blank")
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleDownload = async () => {
    setLoading(true)
    try {
      const response = await fetch(urls[type])
      const html = await response.text()
      const blob = new Blob([html], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${labels[type]}_${id.slice(0, 8)}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error downloading:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {size !== "icon" && <span className="ml-2">PDF</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleView}>
          <FileText className="h-4 w-4 mr-2" />
          Ver {labels[type]}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Descargar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
