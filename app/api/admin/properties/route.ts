import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function assignRole(userId: string, role: string, contextType: string, contextId: string) {
  // Check if role already exists
  const { data: existing } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle()

  if (!existing) {
    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role,
      context_type: contextType,
      context_id: contextId,
    })

    // Also update legacy role field if empty
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single()

    if (!profile?.role) {
      await supabaseAdmin.from("profiles").update({ role }).eq("id", userId)
    }
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("propiedades")
      .select(
        `
        *,
        propietario:profiles!propiedades_propietario_id_fkey(id, full_name, email),
        property_owners(
          id,
          share_pct,
          is_primary,
          person:profiles(id, full_name, email)
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching properties:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener propiedades" },
      { status: 500 },
    )
  }
}

// Valid tipos according to database check constraint
const VALID_TIPOS = ["departamento", "casa", "local", "oficina", "cochera", "deposito", "terreno", "otro"]

// Map invalid tipos to valid ones
const TIPO_MAPPING: Record<string, string> = {
  ph: "departamento", // PH se mapea a departamento
  galpon: "deposito", // Galpón se mapea a depósito
  loft: "departamento",
  duplex: "casa",
  triplex: "casa",
  monoambiente: "departamento",
}

function normalizeTipo(tipo: string | null | undefined): string {
  if (!tipo) return "otro"
  const lower = tipo.toLowerCase().trim()
  if (VALID_TIPOS.includes(lower)) return lower
  if (TIPO_MAPPING[lower]) return TIPO_MAPPING[lower]
  return "otro"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { owners, ...propertyData } = body

    // Normalize tipo to valid database value
    if (propertyData.tipo) {
      propertyData.tipo = normalizeTipo(propertyData.tipo)
    }

    const primaryOwner = owners?.find((o: any) => o.is_primary) || owners?.[0]

    // Create property
    const { data: property, error: propertyError } = await supabaseAdmin
      .from("propiedades")
      .insert({
        ...propertyData,
        propietario_id: primaryOwner?.person_id || null,
      })
      .select()
      .single()

    if (propertyError) throw propertyError

    // Create property_owners records
    if (owners && owners.length > 0) {
      const ownerRecords = owners
        .filter((o: any) => o.person_id)
        .map((o: any) => ({
          property_id: property.id,
          person_id: o.person_id,
          share_pct: o.share_pct,
          is_primary: o.is_primary,
          active: true,
        }))

      if (ownerRecords.length > 0) {
        const { error: ownersError } = await supabaseAdmin.from("property_owners").insert(ownerRecords)

        if (ownersError) throw ownersError

        for (const owner of ownerRecords) {
          await assignRole(owner.person_id, "propietario", "property", property.id)
        }
      }
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error("Error creating property:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear la propiedad" },
      { status: 500 },
    )
  }
}
