"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Home, FileText, DollarSign, Wrench, AlertCircle, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ContratoActivo {
  id: string
  direccion: string
  fecha_fin: string
  monto_base: number
  moneda: string
  dia_vencimiento: number
  dias_hasta_vencimiento: number
}

interface PagoPendiente {
  id: string
  concepto: string
  monto: number
  periodo_mes: number
  periodo_anio: number
}

export default function InquilinoDashboard() {
  const [contrato, setContrato] = useState<ContratoActivo | null>(null)
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([])
  const [totalPendiente, setTotalPendiente] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get active contracts where user is tenant
      const { data: participaciones } = await supabase
        .from("contract_participants")
        .select("contract_id")
        .eq("person_id", user.id)
        .eq("party_role", "INQUILINO")

      if (participaciones && participaciones.length > 0) {
        const contractIds = participaciones.map((p) => p.contract_id)

        // Get contract details
        const { data: contratos } = await supabase
          .from("vista_contratos_vigencia")
          .select("*")
          .in("id", contractIds)
          .eq("estado", "activo")
          .limit(1)
          .single()

        if (contratos) {
          setContrato({
            id: contratos.id,
            direccion: contratos.direccion,
            fecha_fin: contratos.fecha_fin,
            monto_base: contratos.monto_base,
            moneda: contratos.moneda,
            dia_vencimiento: contratos.dia_vencimiento,
            dias_hasta_vencimiento: contratos.dias_hasta_vencimiento,
          })
        }

        // Get pending payments
        const { data: cuenta } = await supabase
          .from("cuentas_corrientes")
          .select("id")
          .eq("titular_id", user.id)
          .eq("tipo_cuenta", "inquilino")
          .single()

        if (cuenta) {
          const { data: movimientos } = await supabase
            .from("movimientos")
            .select("id, concepto, monto, periodo_mes, periodo_anio")
            .eq("cuenta_id", cuenta.id)
            .eq("tipo", "debito")
            .eq("estado", "pendiente")
            .order("periodo_anio", { ascending: true })
            .order("periodo_mes", { ascending: true })
            .limit(5)

          if (movimientos) {
            setPagosPendientes(movimientos)
            setTotalPendiente(movimientos.reduce((sum, m) => sum + Number(m.monto), 0))
          }
        }
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  const meses = [
    "",
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Sin contrato activo</h1>
        <p className="text-muted-foreground">No tenés contratos de alquiler activos en este momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Portal Inquilino</h1>
        <p className="text-muted-foreground">Tu vivienda en {contrato.direccion}</p>
      </div>

      {/* Contract alert */}
      {contrato.dias_hasta_vencimiento <= 60 && contrato.dias_hasta_vencimiento > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">
            Tu contrato vence en {contrato.dias_hasta_vencimiento} días. Contactá a Sigma para renovarlo.
          </span>
        </div>
      )}

      {/* Pending payments alert */}
      {totalPendiente > 0 && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Pagos pendientes</p>
              <p className="text-sm">
                Total: {contrato.moneda === "USD" ? "USD " : "$ "}
                {totalPendiente.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-red-300 hover:bg-red-100 bg-transparent">
            <Link href="/portal/inquilino/pagos">Ver pagos</Link>
          </Button>
        </div>
      )}

      {/* Contract summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tu Contrato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Alquiler mensual</p>
              <p className="text-lg font-semibold">
                {contrato.moneda === "USD" ? "USD " : "$ "}
                {contrato.monto_base.toLocaleString("es-AR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vencimiento</p>
              <p className="text-lg font-semibold">Día {contrato.dia_vencimiento}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vigencia hasta</p>
              <p className="text-lg font-semibold">{new Date(contrato.fecha_fin).toLocaleDateString("es-AR")}</p>
            </div>
          </div>
          <div className="pt-2">
            <Button asChild variant="outline" className="w-full sm:w-auto bg-transparent">
              <Link href="/portal/inquilino/contrato">Ver contrato completo</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending payments */}
      {pagosPendientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pagosPendientes.map((pago) => (
                <div key={pago.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{pago.concepto}</p>
                    <p className="text-sm text-muted-foreground">
                      {meses[pago.periodo_mes]} {pago.periodo_anio}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {contrato.moneda === "USD" ? "USD " : "$ "}
                    {Number(pago.monto).toLocaleString("es-AR")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button asChild className="w-full">
                <Link href="/portal/inquilino/pagos">Ver todos los pagos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/portal/inquilino/pagos">
          <Card className="hover:border-foreground transition-colors cursor-pointer h-full">
            <CardHeader>
              <DollarSign className="h-8 w-8 mb-2 text-muted-foreground" />
              <CardTitle className="text-base">Mis Pagos</CardTitle>
              <CardDescription>Historial de pagos y comprobantes</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/portal/inquilino/reparaciones">
          <Card className="hover:border-foreground transition-colors cursor-pointer h-full">
            <CardHeader>
              <Wrench className="h-8 w-8 mb-2 text-muted-foreground" />
              <CardTitle className="text-base">Reparaciones</CardTitle>
              <CardDescription>Solicitar reparaciones o reportar problemas</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
