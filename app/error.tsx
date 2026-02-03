"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log del error para debugging/tracking
    console.error("[Global Error]", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Ocurrió un error</CardTitle>
          <CardDescription className="text-base">
            Lo sentimos, algo salió mal. Nuestro equipo ha sido notificado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {process.env.NODE_ENV === "development" && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">Error:</p>
              <p className="text-sm font-mono break-all">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">ID: {error.digest}</p>
              )}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar nuevamente
            </Button>
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver atrás
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Ir al inicio
              </Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Si el problema persiste, contacte a soporte en{" "}
            <a href="mailto:soporte@sigma.com.ar" className="text-primary hover:underline">
              soporte@sigma.com.ar
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
