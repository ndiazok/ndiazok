"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Calendar, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

interface ContratoAlerta {
  id: string
  propiedad_id: string
  direccion: string
  ciudad: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
  dias_hasta_vencimiento: number
  nivel_alerta: string
  monto_base: number
  moneda: string
}

export function ContractAlerts() {
  const [alertas, setAlertas] = useState<ContratoAlerta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAlertas() {
      try {
        const res = await fetch("/api/admin/contracts/alerts?dias=60")
        if (res.ok) {
          const data = await res.json()
          setAlertas(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Error fetching alerts:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAlertas()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas de Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alertas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Alertas de Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No hay contratos próximos a vencer o vencidos.</p>
        </CardContent>
      </Card>
    )
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case "vencido":
        return "bg-red-100 text-red-800 border-red-200"
      case "urgente":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "proximo":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "atencion":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getNivelLabel = (nivel: string) => {
    switch (nivel) {
      case "vencido":
        return "Vencido"
      case "urgente":
        return "Urgente (≤15 días)"
      case "proximo":
        return "Próximo (≤30 días)"
      case "atencion":
        return "Atención (≤60 días)"
      default:
        return nivel
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertas de Contratos
          <Badge variant="secondary" className="ml-2">
            {alertas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertas.slice(0, 5).map((alerta) => (
          <div key={alerta.id} className={`p-3 rounded-lg border ${getNivelColor(alerta.nivel_alerta)}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {alerta.direccion}, {alerta.ciudad}
                </p>
                <div className="flex items-center gap-2 mt-1 text-sm">
                  <Clock className="h-3 w-3" />
                  {alerta.dias_hasta_vencimiento < 0 ? (
                    <span>Vencido hace {Math.abs(alerta.dias_hasta_vencimiento)} días</span>
                  ) : alerta.dias_hasta_vencimiento === 0 ? (
                    <span>Vence hoy</span>
                  ) : (
                    <span>Vence en {alerta.dias_hasta_vencimiento} días</span>
                  )}
                </div>
                <p className="text-xs mt-1 opacity-75">Fin: {new Date(alerta.fecha_fin).toLocaleDateString("es-AR")}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className="text-xs">
                  {getNivelLabel(alerta.nivel_alerta)}
                </Badge>
                <Link href={`/dashboard/contratos/${alerta.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    Ver <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
        {alertas.length > 5 && (
          <Link href="/dashboard/contratos?filter=alertas">
            <Button variant="outline" className="w-full bg-transparent">
              Ver todas las alertas ({alertas.length})
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
