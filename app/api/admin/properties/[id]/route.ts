import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// UUID regex for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "ID de propiedad inválido" }, { status: 400 })
    }

    // Get property with owners
    const { data: property, error } = await supabaseAdmin
      .from("propiedades")
      .select(`
        *,
        property_owners(
          id,
          person_id,
          share_pct,
          is_primary,
          person:profiles(id, full_name, email, phone)
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // Get images
    const { data: images } = await supabaseAdmin
      .from("property_images")
      .select("*")
      .eq("property_id", id)
      .order("orden", { ascending: true })

    // Get documents
    const { data: documents } = await supabaseAdmin
      .from("property_documents")
      .select("*")
      .eq("property_id", id)
      .order("created_at", { ascending: false })

    // Get active contracts
    const { data: contracts } = await supabaseAdmin
      .from("contratos")
      .select(`
        id,
        fecha_inicio,
        fecha_fin,
        monto_base,
        moneda,
        estado,
        contract_participants(
          party_role,
          person:profiles(id, full_name)
        )
      `)
      .eq("propiedad_id", id)
      .order("fecha_inicio", { ascending: false })

    // Get repairs history
    const { data: repairs } = await supabaseAdmin
      .from("reparaciones")
      .select(`
        *,
        profesional:profiles(id, full_name)
      `)
      .eq("propiedad_id", id)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      ...property,
      images: images || [],
      documents: documents || [],
      contracts: contracts || [],
      repairs: repairs || [],
    })
  } catch (error) {
    console.error("Error fetching property:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener la propiedad" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { owners, images, documents, ...propertyData } = body

    // Update property
    const { data: property, error } = await supabaseAdmin
      .from("propiedades")
      .update(propertyData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    // Update owners if provided
    if (owners) {
      // Remove existing owners
      await supabaseAdmin.from("property_owners").delete().eq("property_id", id)

      // Add new owners
      if (owners.length > 0) {
        const ownerRecords = owners
          .filter((o: any) => o.person_id)
          .map((o: any) => ({
            property_id: id,
            person_id: o.person_id,
            share_pct: o.share_pct || 100,
            is_primary: o.is_primary || false,
            active: true,
          }))

        if (ownerRecords.length > 0) {
          await supabaseAdmin.from("property_owners").insert(ownerRecords)
        }
      }
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error("Error updating property:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar la propiedad" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin.from("propiedades").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting property:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar la propiedad" },
      { status: 500 },
    )
  }
}
