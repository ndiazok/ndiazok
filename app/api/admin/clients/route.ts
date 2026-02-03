import { createClient } from "@supabase/supabase-js"
import { 
  createErrorResponse, 
  ValidationError, 
  NotFoundError,
  validateRequired,
  validateEmail 
} from "@/lib/errors"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { full_name, company_name, email, phone } = body

    // Validaciones
    validateRequired(body, ["full_name"])
    if (email) validateEmail(email)

    // Create auth user (required for profiles foreign key)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email || `${crypto.randomUUID()}@placeholder.sigma.com`,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    })

    if (authError) {
      throw new ValidationError(authError.message)
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name,
        company_name: company_name || null,
        email: email || null,
        phone: phone || null,
        role: null,
      })
      .eq("id", authData.user.id)
      .select()
      .single()

    if (error) throw error

    return Response.json({ success: true, data })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function GET() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Fetch roles for all users
    const { data: userRoles } = await supabaseAdmin.from("user_roles").select("user_id, role")

    // Map roles to profiles
    const profilesWithRoles = profiles?.map((profile) => {
      const roles = userRoles?.filter((ur) => ur.user_id === profile.id).map((ur) => ur.role) || []
      return {
        ...profile,
        roles,
        role: profile.role || roles[0] || null,
      }
    })

    return Response.json({ success: true, data: profilesWithRoles })
  } catch (error) {
    return createErrorResponse(error)
  }
}
