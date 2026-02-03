"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { ChatWidget } from "@/components/dashboard/chat-widget"
import { OnboardingModal } from "@/components/dashboard/onboarding-modal"
import type { User, Session } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  phone: string | null
  company_name: string | null
}

const DEFAULT_PROFILE: Profile = {
  id: "dev-user",
  full_name: "Admin (Dev Mode)",
  email: "admin@sigma.com",
  role: "admin",
  phone: null,
  company_name: "Sigma Inmobiliaria",
}

const DEFAULT_USER: User = {
  id: "dev-user",
  email: "admin@sigma.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
} as User

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient()
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, phone, company_name")
      .eq("id", userId)
      .single()

    if (profileData) {
      setProfile(profileData)
    }
  }, [])

  const handleSession = useCallback(
    async (session: Session | null) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
        setIsLoading(false)
      } else {
        setUser(DEFAULT_USER)
        setProfile(DEFAULT_PROFILE)
        setIsLoading(false)
      }
    },
    [fetchProfile],
  )

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        handleSession(session)
      } else if (event === "SIGNED_IN") {
        handleSession(session)
      } else if (event === "SIGNED_OUT") {
        setUser(DEFAULT_USER)
        setProfile(DEFAULT_PROFILE)
      }
    })

    return () => subscription.unsubscribe()
  }, [handleSession])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }
  return (
    <SidebarProvider>
      <DashboardSidebar user={user!} profile={profile} />
      <SidebarInset>
        <DashboardHeader user={user!} profile={profile} />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
      <ChatWidget />
      <OnboardingModal />
    </SidebarProvider>
  )
}
