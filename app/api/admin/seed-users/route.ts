import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase configuration", details: { url: !!supabaseUrl, key: !!serviceRoleKey } },
      { status: 500 },
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const mockUsers = [
    {
      full_name: "María García López",
      email: "maria.garcia@ejemplo.com",
      role: "propietario",
      phone: "+54 11 4567-8901",
      company_name: "Inversiones García S.A.",
    },
    {
      full_name: "Juan Carlos Rodríguez",
      email: "juan.rodriguez@ejemplo.com",
      role: "propietario",
      phone: "+54 351 456-7890",
      company_name: null,
    },
    {
      full_name: "Ana Martínez",
      email: "ana.martinez@ejemplo.com",
      role: "inquilino",
      phone: "+54 11 2345-6789",
      company_name: null,
    },
    {
      full_name: "Roberto Fernández",
      email: "roberto.fernandez@ejemplo.com",
      role: "inquilino",
      phone: "+54 358 123-4567",
      company_name: "Fernández & Asociados",
    },
    {
      full_name: "Carlos Pérez (Plomero)",
      email: "carlos.perez@ejemplo.com",
      role: "profesional",
      phone: "+54 351 987-6543",
      company_name: "Servicios Pérez",
    },
  ]

  const results = []

  for (const user of mockUsers) {
    try {
      // Crear usuario en auth.users
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: "password123",
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
        },
      })

      if (authError) {
        // Si ya existe, no es error crítico
        if (authError.message.includes("already") || authError.message.includes("exists")) {
          results.push({ email: user.email, status: "already_exists" })
        } else {
          results.push({ email: user.email, status: "error", error: authError.message })
        }
        continue
      }

      // Actualizar el perfil con los datos adicionales
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: user.full_name,
          role: user.role,
          phone: user.phone,
          company_name: user.company_name,
          email: user.email,
        })
        .eq("id", authUser.user.id)

      if (profileError) {
        results.push({ email: user.email, status: "partial", error: profileError.message, id: authUser.user.id })
      } else {
        results.push({ email: user.email, status: "created", id: authUser.user.id })
      }
    } catch (err: any) {
      results.push({ email: user.email, status: "error", error: err.message })
    }
  }

  return NextResponse.json({ results, total: mockUsers.length })
}

export async function GET() {
  return NextResponse.json({
    message: "Envía un POST a esta URL para crear los usuarios mock",
  })
}
