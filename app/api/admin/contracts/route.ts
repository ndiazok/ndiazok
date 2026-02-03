import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function assignRole(userId: string, role: string, contextType: string, contextId: string) {
  // Check if role already exists for this user
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
      .from("contratos")
      .select(
        `
        *,
        propiedad:propiedades(id, direccion, ciudad, tipo),
        participantes:contract_participants(
          id,
          party_role,
          status,
          person:contract_participants_person_id_fkey(id, full_name, email, phone)
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching contracts:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener contratos" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { participants, guarantors, ...contractData } = body

    console.log("[v0] Creating contract with participants:", JSON.stringify(participants, null, 2))

    const cleanContractData = {
      ...contractData,
      ajustes_manuales: contractData.ajustes_manuales || null,
    }

    // Create the contract
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contratos")
      .insert(cleanContractData)
      .select()
      .single()

    if (contractError) {
      console.error("[v0] Contract insert error:", contractError)
      throw contractError
    }

    console.log("[v0] Contract created:", contract.id)

    const roleMapping: Record<string, string> = {
      inquilino_principal: "INQUILINO",
      co_inquilino: "INQUILINO",
      inquilino: "INQUILINO",
      garante: "GARANTE",
      propietario: "PROPIETARIO",
      apoderado: "APODERADO",
      representante: "APODERADO",
    }

    if (contractData.propiedad_id) {
      const { data: propertyOwners, error: ownersError } = await supabaseAdmin
        .from("property_owners")
        .select("person_id, ownership_percentage, is_primary")
        .eq("property_id", contractData.propiedad_id)

      if (!ownersError && propertyOwners && propertyOwners.length > 0) {
        console.log("[v0] Found property owners:", propertyOwners.length)

        for (const owner of propertyOwners) {
          if (!owner.person_id) continue

          const { error: ownerParticipantError } = await supabaseAdmin.from("contract_participants").insert({
            contract_id: contract.id,
            person_id: owner.person_id,
            party_role: "PROPIETARIO",
            status: "ACTIVE",
          })

          if (ownerParticipantError) {
            console.error("[v0] Error adding owner as participant:", ownerParticipantError)
          } else {
            console.log("[v0] Added owner as participant:", owner.person_id)
          }
        }
      } else {
        console.log("[v0] No property owners found or error:", ownersError)
      }
    }

    // ... existing code for participants ...
    if (participants && participants.length > 0) {
      for (const p of participants) {
        if (!p.personId) continue

        const mappedRole = roleMapping[p.role] || "INQUILINO"

        // Insert into contract_participants
        const { error: participantError } = await supabaseAdmin.from("contract_participants").insert({
          contract_id: contract.id,
          person_id: p.personId,
          party_role: mappedRole,
          status: "PENDING_INVITE",
        })

        if (participantError) {
          console.error("[v0] Error adding participant:", participantError)
        } else {
          console.log("[v0] Added participant:", p.personId, "with role:", mappedRole)
        }

        // Assign role to user
        const userRole = p.role === "garante" ? "garante" : p.role.includes("inquilino") ? "inquilino" : null
        if (userRole) {
          await assignRole(p.personId, userRole, "contract", contract.id)
        }
      }
    }

    // ... existing code for guarantors ...
    if (guarantors && guarantors.length > 0) {
      for (const g of guarantors) {
        // Add as contract participant
        await supabaseAdmin.from("contract_participants").insert({
          contract_id: contract.id,
          person_id: g.personId,
          party_role: "GARANTE",
          status: "PENDING_INVITE",
        })

        // Create guarantee link if tenant specified
        if (g.tenantId) {
          await supabaseAdmin.from("guarantee_links").insert({
            contract_id: contract.id,
            guarantor_person_id: g.personId,
            tenant_person_id: g.tenantId,
            guarantee_type: g.guaranteeType || "solidario",
            status: "pendiente",
          })
        }

        // Assign garante role
        await assignRole(g.personId, "garante", "contract", contract.id)
      }
    }

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating contract:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear el contrato" },
      { status: 500 },
    )
  }
}
