"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Building2, Home } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface UserRole {
  role: string
}

export default function PortalPage() {
  const [roles, setRoles] = useState<UserRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchRoles = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", user.id)

      if (rolesData) {
        setRoles(rolesData)

        // Auto-redirect if user has only one role
        const uniqueRoles = [...new Set(rolesData.map((r) => r.role))]
        if (uniqueRoles.length === 1) {
          if (uniqueRoles[0] === "propietario") {
            router.replace("/portal/propietario")
            return
          } else if (uniqueRoles[0] === "inquilino") {
            router.replace("/portal/inquilino")
            return
          }
        }
      }

      setIsLoading(false)
    }

    fetchRoles()
  }, [router])

  const isPropietario = roles.some((r) => r.role === "propietario")
  const isInquilino = roles.some((r) => r.role === "inquilino")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isPropietario && !isInquilino) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <h1 className="text-2xl font-semibold mb-4">Sin acceso al portal</h1>
        <p className="text-muted-foreground mb-6">
          Tu cuenta no tiene propiedades ni contratos asociados. Contactá a Sigma Inmobiliaria para más información.
        </p>
        <Link href="/" className="text-sm underline underline-offset-4 hover:text-foreground">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold mb-2">Bienvenido al Portal</h1>
        <p className="text-muted-foreground">Seleccioná cómo querés acceder</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {isPropietario && (
          <Link href="/portal/propietario">
            <Card className="h-full hover:border-foreground transition-colors cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Building2 className="h-6 w-6" />
                </div>
                <CardTitle>Portal Propietario</CardTitle>
                <CardDescription>Gestioná tus propiedades, contratos y liquidaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ver estado de tus inmuebles</li>
                  <li>• Consultar contratos activos</li>
                  <li>• Revisar liquidaciones y cobros</li>
                  <li>• Documentación y reportes</li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        )}

        {isInquilino && (
          <Link href="/portal/inquilino">
            <Card className="h-full hover:border-foreground transition-colors cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Home className="h-6 w-6" />
                </div>
                <CardTitle>Portal Inquilino</CardTitle>
                <CardDescription>Consultá tu contrato, pagos y solicitá reparaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ver detalles de tu contrato</li>
                  <li>• Consultar pagos pendientes</li>
                  <li>• Historial de pagos realizados</li>
                  <li>• Solicitar reparaciones</li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
