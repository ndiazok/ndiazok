import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contract_invitations")
    .select("*")
    .eq("contract_id", id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()
  const { data: { user } } = await supabase.auth.getUser()

  const { email, role, nombre } = body

  // Create invitation
  const { data: invitation, error } = await supabase
    .from("contract_invitations")
    .insert({
      contract_id: id,
      email,
      role,
      invited_by: user?.id
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get contract details for the email
  const { data: contract } = await supabase
    .from("contratos")
    .select(`
      *,
      propiedad:propiedades(direccion, ciudad)
    `)
    .eq("id", id)
    .single()

  // Build the invitation URL with fallback
  const host = request.headers.get("host") || "localhost:3000"
  const protocol = host.includes("localhost") ? "http" : "https"
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`
  const invitationUrl = `${baseUrl}/invitacion/${invitation.token}`

  return NextResponse.json({
    ...invitation,
    invitation_url: invitationUrl,
    message: `Invitación creada. Enviar este link a ${email}: ${invitationUrl}`
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const invitationId = searchParams.get("invitationId")

  if (!invitationId) {
    return NextResponse.json({ error: "invitationId required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("contract_invitations")
    .delete()
    .eq("id", invitationId)
    .eq("contract_id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
