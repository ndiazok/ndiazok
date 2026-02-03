"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        if (session) {
          router.replace("/dashboard")
        } else {
          setIsCheckingSession(false)
        }
      } else if (event === "SIGNED_IN" && session) {
        router.replace("/dashboard")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // The SIGNED_IN event will trigger navigation
      if (!data.session) {
        setError("No se pudo iniciar sesión")
        setIsLoading(false)
      }
      // Keep loading state true, onAuthStateChange will redirect
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message === "Invalid login credentials"
            ? "Credenciales inválidas. Verificá tu email y contraseña."
            : error.message
          : "Ocurrió un error",
      )
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <Link href="/" className="inline-block">
              <span className="text-2xl font-semibold tracking-tight">Sigma</span>
            </Link>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl font-semibold tracking-tight mb-6 text-balance">
              Control total de tu operación inmobiliaria
            </h1>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Accedé a tu panel de gestión y mantené el control operativo, técnico y financiero de tus propiedades en
              tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary-foreground/50">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Sistema operativo 24/7</span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-semibold tracking-tight text-foreground">Sigma</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Iniciar sesión</h2>
            <p className="text-muted-foreground">Ingresá tus credenciales para acceder a tu cuenta</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 px-4 pr-12 bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Ingresar
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              ¿No tenés una cuenta?{" "}
              <Link href="/auth/register" className="font-medium text-foreground hover:text-primary transition-colors">
                Registrate
              </Link>
            </p>
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground">
              Al ingresar, aceptás nuestros{" "}
              <Link href="/terminos" className="underline hover:text-foreground">
                Términos de servicio
              </Link>{" "}
              y{" "}
              <Link href="/privacidad" className="underline hover:text-foreground">
                Política de privacidad
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
