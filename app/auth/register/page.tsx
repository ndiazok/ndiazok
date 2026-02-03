"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, ArrowRight, Building2, User, Briefcase } from "lucide-react"

type Role = "propietario" | "inquilino" | "profesional"

const roleLabels: Record<Role, { label: string; description: string; icon: React.ReactNode }> = {
  propietario: {
    label: "Propietario / Inversor",
    description: "Gestiono mis propiedades",
    icon: <Building2 className="h-4 w-4" />,
  },
  inquilino: {
    label: "Inquilino",
    description: "Alquilo una propiedad",
    icon: <User className="h-4 w-4" />,
  },
  profesional: {
    label: "Profesional Inmobiliario",
    description: "Administro propiedades de terceros",
    icon: <Briefcase className="h-4 w-4" />,
  },
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    companyName: "",
    role: "propietario" as Role,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            company_name: formData.companyName,
            role: formData.role,
          },
        },
      })
      if (error) throw error
      router.push("/auth/verify-email")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al registrar")
    } finally {
      setIsLoading(false)
    }
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
              Comenzá a gestionar tus propiedades de forma profesional
            </h1>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Creá tu cuenta y accedé a todas las herramientas que necesitás para una gestión inmobiliaria eficiente y
              transparente.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-sm text-primary-foreground/70">Gestión centralizada de propiedades</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-sm text-primary-foreground/70">Control operativo en tiempo real</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-semibold tracking-tight text-foreground">Sigma</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Crear cuenta</h2>
            <p className="text-muted-foreground">Completá tus datos para comenzar</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Role selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Cómo vas a usar Sigma?</Label>
              <Select value={formData.role} onValueChange={(value: Role) => handleChange("role", value)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(roleLabels) as Role[]).map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        {roleLabels[role].icon}
                        <div>
                          <span className="font-medium">{roleLabels[role].label}</span>
                          <span className="text-muted-foreground ml-2 text-xs">— {roleLabels[role].description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Nombre completo
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                required
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="h-12 px-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                required
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="h-12 px-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+54 11 1234-5678"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="h-12 px-4"
              />
            </div>

            {formData.role === "profesional" && (
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">
                  Nombre de la empresa
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Tu Inmobiliaria S.A."
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="h-12 px-4"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="h-12 px-4 pr-12"
                  placeholder="Mínimo 8 caracteres"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className="h-12 px-4"
              />
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
                  Creando cuenta...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Crear cuenta
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés una cuenta?{" "}
              <Link href="/auth/login" className="font-medium text-foreground hover:text-primary transition-colors">
                Iniciar sesión
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Al registrarte, aceptás nuestros{" "}
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
