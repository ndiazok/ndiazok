"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
  Building2,
  FileText,
  Users,
  Wallet,
  LayoutDashboard,
  Wrench,
  TrendingUp,
  Settings,
  HelpCircle,
  Receipt,
  Target,
  CalendarDays,
  FileSpreadsheet,
  Bug,
  ClipboardCheck,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  phone: string | null
  company_name: string | null
}

interface DashboardSidebarProps {
  user: User
  profile: Profile | null
}

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Propiedades",
    href: "/dashboard/propiedades",
    icon: Building2,
  },
  {
    title: "Contratos",
    href: "/dashboard/contratos",
    icon: FileText,
  },
  {
    title: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    title: "CRM",
    href: "/dashboard/crm",
    icon: Target,
  },
  {
    title: "Agenda",
    href: "/dashboard/agenda",
    icon: CalendarDays,
  },
]

const financeNavItems = [
  {
    title: "Cobranzas",
    href: "/dashboard/cobranzas",
    icon: Receipt,
  },
  {
    title: "Liquidaciones",
    href: "/dashboard/liquidaciones",
    icon: TrendingUp,
  },
  {
    title: "Cuentas Corrientes",
    href: "/dashboard/cuentas",
    icon: Wallet,
  },
  {
    title: "Reparaciones",
    href: "/dashboard/reparaciones",
    icon: Wrench,
  },
  {
    title: "Inspecciones",
    href: "/dashboard/inspecciones",
    icon: ClipboardCheck,
  },
]

const operationsNavItems = [
  {
    title: "Equipo",
    href: "/dashboard/equipo",
    icon: Users,
  },
  {
    title: "Reportes",
    href: "/dashboard/reportes",
    icon: FileSpreadsheet,
  },
  {
    title: "Errores",
    href: "/dashboard/errores",
    icon: Bug,
    hasBadge: true,
  },
]

const settingsNavItems = [
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  },
  {
    title: "Ayuda",
    href: "/dashboard/ayuda",
    icon: HelpCircle,
  },
]

export function DashboardSidebar({ user, profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [errorCount, setErrorCount] = useState(0)

  useEffect(() => {
    const fetchErrorCount = async () => {
      try {
        const response = await fetch("/api/admin/errors?resolved=false&limit=1")
        const result = await response.json()
        if (result.success) {
          setErrorCount(result.data.stats?.unresolved || 0)
        }
      } catch {
        // Silently fail
      }
    }
    fetchErrorCount()
    // Refresh every 5 minutes
    const interval = setInterval(fetchErrorCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Sigma</span>
            <span className="text-xs text-muted-foreground">Inmobiliaria</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Finanzas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(item.href + "/")}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Operaciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(item.href + "/")}>
                    <Link href={item.href} className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </span>
                      {item.hasBadge && errorCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="h-5 min-w-[20px] px-1.5 text-xs font-bold"
                        >
                          {errorCount > 99 ? "99+" : errorCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/dashboard/perfil" className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{getInitials(profile?.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{profile?.full_name || user.email}</span>
              <span className="text-xs text-muted-foreground truncate">{profile?.role || "Usuario"}</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
