"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import { Home, Building2, FileText, DollarSign, Wrench, UserIcon, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

interface UserRole {
  role: string
  context_type: string | null
  context_id: string | null
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const fetchUserData = useCallback(async (userId: string) => {
    const supabase = createClient()

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", userId)
      .single()

    if (profileData) {
      setProfile(profileData)
    }

    // Fetch roles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role, context_type, context_id")
      .eq("user_id", userId)

    if (rolesData) {
      setRoles(rolesData)
    }
  }, [])

  const handleSession = useCallback(
    async (session: Session | null) => {
      if (session?.user) {
        setUser(session.user)
        await fetchUserData(session.user.id)
      }
      setIsLoading(false)
    },
    [fetchUserData],
  )

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        handleSession(session)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setRoles([])
      }
    })

    return () => subscription.unsubscribe()
  }, [handleSession])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  const isPropietario = roles.some((r) => r.role === "propietario")
  const isInquilino = roles.some((r) => r.role === "inquilino")

  // Determine which portal section we're in
  const isInPropietarioSection = pathname.startsWith("/portal/propietario")
  const isInInquilinoSection = pathname.startsWith("/portal/inquilino")

  const propietarioLinks = [
    { href: "/portal/propietario", label: "Inicio", icon: Home },
    { href: "/portal/propietario/propiedades", label: "Mis Propiedades", icon: Building2 },
    { href: "/portal/propietario/contratos", label: "Contratos", icon: FileText },
    { href: "/portal/propietario/liquidaciones", label: "Liquidaciones", icon: DollarSign },
  ]

  const inquilinoLinks = [
    { href: "/portal/inquilino", label: "Inicio", icon: Home },
    { href: "/portal/inquilino/contrato", label: "Mi Contrato", icon: FileText },
    { href: "/portal/inquilino/pagos", label: "Pagos", icon: DollarSign },
    { href: "/portal/inquilino/reparaciones", label: "Reparaciones", icon: Wrench },
  ]

  const currentLinks = isInPropietarioSection ? propietarioLinks : inquilinoLinks

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Acceso requerido</h1>
          <p className="text-muted-foreground">Debes iniciar sesión para acceder al portal</p>
          <Button asChild>
            <Link href="/auth/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/portal" className="font-semibold text-lg">
              Sigma
            </Link>

            {/* Role switcher for users with multiple roles */}
            {isPropietario && isInquilino && (
              <div className="hidden sm:flex items-center gap-2 ml-4">
                <Link
                  href="/portal/propietario"
                  className={cn(
                    "text-sm px-3 py-1.5 rounded-full transition-colors",
                    isInPropietarioSection
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Propietario
                </Link>
                <Link
                  href="/portal/inquilino"
                  className={cn(
                    "text-sm px-3 py-1.5 rounded-full transition-colors",
                    isInInquilinoSection
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Inquilino
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 min-h-[calc(100vh-4rem)] bg-background border-r p-4">
          <nav className="space-y-1">
            {currentLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Profile section */}
          <div className="mt-8 pt-8 border-t">
            <Link
              href="/portal/perfil"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                pathname === "/portal/perfil"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <UserIcon className="h-4 w-4" />
              Mi Perfil
            </Link>
          </div>
        </aside>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <aside className="fixed left-0 top-16 bottom-0 w-64 bg-background border-r p-4 overflow-y-auto">
              {/* Role switcher for mobile */}
              {isPropietario && isInquilino && (
                <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                  <Link
                    href="/portal/propietario"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "text-sm px-3 py-1.5 rounded-full transition-colors flex-1 text-center",
                      isInPropietarioSection ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    Propietario
                  </Link>
                  <Link
                    href="/portal/inquilino"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "text-sm px-3 py-1.5 rounded-full transition-colors flex-1 text-center",
                      isInInquilinoSection ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    Inquilino
                  </Link>
                </div>
              )}

              <nav className="space-y-1">
                {currentLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-8 pt-8 border-t">
                <Link
                  href="/portal/perfil"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    pathname === "/portal/perfil"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <UserIcon className="h-4 w-4" />
                  Mi Perfil
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
