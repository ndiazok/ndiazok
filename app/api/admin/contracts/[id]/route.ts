import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Obtener contrato con propiedad
  const { data: contrato, error: contratoError } = await supabaseAdmin
    .from("contratos")
    .select(`
      *,
      propiedad:propiedades(id, direccion, ciudad, provincia, tipo)
    `)
    .eq("id", id)
    .single()

  if (contratoError) {
    console.error("Error fetching contract:", contratoError)
    return NextResponse.json({ error: contratoError.message }, { status: 404 })
  }

  // Obtener participantes del contrato
  const { data: participantes, error: participantesError } = await supabaseAdmin
    .from("contract_participants")
    .select("*")
    .eq("contract_id", id)

  if (participantesError) {
    console.error("Error fetching participants:", participantesError)
  }

  // Obtener datos de personas para participantes
  let participantesConPersonas: any[] = []
  if (participantes && participantes.length > 0) {
    const personIds = participantes
      .map((p) => p.person_id)
      .filter((id): id is string => id !== null && id !== undefined)

    if (personIds.length > 0) {
      const { data: personas, error: personasError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", personIds)

      if (personasError) {
        console.error("Error fetching personas:", personasError)
      }

      participantesConPersonas = participantes.map((p) => ({
        ...p,
        person: personas?.find((persona) => persona.id === p.person_id) || null,
      }))
    } else {
      participantesConPersonas = participantes.map((p) => ({
        ...p,
        person: null,
      }))
    }
  }

  // Si no hay PROPIETARIO en participantes, obtener de property_owners
  const tienePropietario = participantesConPersonas.some((p) => p.party_role === "PROPIETARIO")

  if (!tienePropietario && contrato.propiedad_id) {
    const { data: owners, error: ownersError } = await supabaseAdmin
      .from("property_owners")
      .select("*")
      .eq("property_id", contrato.propiedad_id)

    if (!ownersError && owners && owners.length > 0) {
      // Use person_id instead of owner_id
      const ownerIds = owners.map((o) => o.person_id).filter((id): id is string => id !== null && id !== undefined)

      if (ownerIds.length > 0) {
        const { data: ownerPersonas } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", ownerIds)

        // Use ownership_percentage instead of share_pct
        const propietariosDesdeProperty = owners.map((o) => ({
          id: `owner-${o.id}`,
          party_role: "PROPIETARIO",
          status: "ACTIVE",
          ownership_percentage: o.ownership_percentage,
          person: ownerPersonas?.find((p) => p.id === o.person_id) || null,
        }))

        // Agregar propietarios al inicio de la lista
        participantesConPersonas = [...propietariosDesdeProperty, ...participantesConPersonas]
      }
    }
  }

  return NextResponse.json({
    ...contrato,
    participantes: participantesConPersonas,
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const { participants, ...contratoData } = body

  const { data: contrato, error: contratoError } = await supabaseAdmin
    .from("contratos")
    .update(contratoData)
    .eq("id", id)
    .select()
    .single()

  if (contratoError) {
    console.error("Error updating contract:", contratoError)
    return NextResponse.json({ error: contratoError.message }, { status: 400 })
  }

  if (participants && Array.isArray(participants)) {
    await supabaseAdmin.from("contract_participants").delete().eq("contract_id", id).neq("party_role", "PROPIETARIO")

    // Insert new participants
    const roleMap: Record<string, string> = {
      inquilino: "INQUILINO",
      co_inquilino: "INQUILINO",
      garante: "GARANTE",
      apoderado: "APODERADO",
    }

    for (const participant of participants) {
      if (!participant.personId) continue
      if (participant.role === "propietario") continue

      const dbRole = roleMap[participant.role] || "INQUILINO"

      const { error: participantError } = await supabaseAdmin.from("contract_participants").insert({
        contract_id: id,
        person_id: participant.personId,
        party_role: dbRole,
        status: "ACTIVE",
      })

      if (participantError) {
        console.error("Error inserting participant:", participantError)
      }

      const userRoleMap: Record<string, string> = {
        inquilino: "inquilino",
        co_inquilino: "inquilino",
        garante: "garante",
      }
      const userRole = userRoleMap[participant.role]

      if (userRole) {
        const { data: existingRole } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", participant.personId)
          .eq("role", userRole)
          .single()

        if (!existingRole) {
          await supabaseAdmin.from("user_roles").insert({
            user_id: participant.personId,
            role: userRole,
          })
        }
      }
    }
  }

  return NextResponse.json(contrato)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabaseAdmin.from("contratos").update(body).eq("id", id).select().single()

  if (error) {
    console.error("Error updating contract:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Primero eliminar participantes
  await supabaseAdmin.from("contract_participants").delete().eq("contract_id", id)

  // Luego eliminar el contrato
  const { error } = await supabaseAdmin.from("contratos").delete().eq("id", id)

  if (error) {
    console.error("Error deleting contract:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
