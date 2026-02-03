import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const now = new Date()

  // Leads without activity in last 7 days
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)

  const { data: leads } = await supabase
    .from("leads")
    .select("id, nombre, email, telefono, interes, temperatura, estado, updated_at, proxima_accion")
    .not("estado", "in", '("ganado","perdido")')
    .lt("updated_at", sevenDaysAgo.toISOString())
    .order("updated_at", { ascending: true })

  const forgottenLeads = leads?.map(lead => {
    const lastContact = new Date(lead.updated_at)
    const daysSilent = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
    return {
      ...lead,
      daysSilent,
      type: "lead",
      urgency: daysSilent > 14 ? "high" : daysSilent > 7 ? "medium" : "low",
    }
  }) || []

  // Owners without contact in last 30 days (owners with active properties)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const { data: propertyOwners } = await supabase
    .from("property_owners")
    .select(`
      person_id,
      propiedades!inner(id, direccion, en_administracion),
      profiles!property_owners_person_id_fkey(id, full_name, email, phone, updated_at)
    `)
    .eq("propiedades.en_administracion", true)

  const ownerMap: Record<string, {
    id: string
    full_name: string
    email: string
    phone: string
    updated_at: string
    properties: string[]
  }> = {}

  propertyOwners?.forEach(po => {
    const profile = po.profiles as { id: string; full_name: string; email: string; phone: string; updated_at: string }
    if (profile && !ownerMap[profile.id]) {
      ownerMap[profile.id] = {
        ...profile,
        properties: []
      }
    }
    if (profile && po.propiedades) {
      const prop = po.propiedades as { direccion: string }
      ownerMap[profile.id].properties.push(prop.direccion)
    }
  })

  const silentOwners = Object.values(ownerMap)
    .filter(owner => new Date(owner.updated_at) < thirtyDaysAgo)
    .map(owner => {
      const lastContact = new Date(owner.updated_at)
      const daysSilent = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...owner,
        daysSilent,
        type: "owner",
        urgency: daysSilent > 60 ? "high" : daysSilent > 30 ? "medium" : "low",
      }
    })
    .sort((a, b) => b.daysSilent - a.daysSilent)

  // Tenants without contact (active contracts, no recent activity)
  const { data: activeContracts } = await supabase
    .from("contratos")
    .select(`
      id,
      propiedad_id,
      propiedades(direccion),
      contract_participants!inner(
        person_id,
        party_role,
        profiles(id, full_name, email, phone, updated_at)
      )
    `)
    .eq("estado", "activo")
    .eq("contract_participants.party_role", "INQUILINO")

  const tenantMap: Record<string, {
    id: string
    full_name: string
    email: string
    phone: string
    updated_at: string
    property: string
  }> = {}

  activeContracts?.forEach(contract => {
    contract.contract_participants?.forEach((cp: { profiles: { id: string; full_name: string; email: string; phone: string; updated_at: string } }) => {
      const profile = cp.profiles
      if (profile && !tenantMap[profile.id]) {
        tenantMap[profile.id] = {
          ...profile,
          property: (contract.propiedades as { direccion: string })?.direccion || ""
        }
      }
    })
  })

  const silentTenants = Object.values(tenantMap)
    .filter(tenant => new Date(tenant.updated_at) < thirtyDaysAgo)
    .map(tenant => {
      const lastContact = new Date(tenant.updated_at)
      const daysSilent = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...tenant,
        daysSilent,
        type: "tenant",
        urgency: daysSilent > 60 ? "high" : daysSilent > 30 ? "medium" : "low",
      }
    })
    .sort((a, b) => b.daysSilent - a.daysSilent)

  // Properties without inquiries in 30+ days (published for sale/rent)
  const { data: publishedProperties } = await supabase
    .from("propiedades")
    .select("id, direccion, ciudad, tipo, publicar_web, updated_at, precio_alquiler, precio_venta")
    .eq("publicar_web", true)
    .or("en_alquiler.eq.true,en_venta.eq.true")

  const silentProperties = publishedProperties
    ?.filter(p => new Date(p.updated_at) < thirtyDaysAgo)
    .map(prop => {
      const lastActivity = new Date(prop.updated_at)
      const daysSilent = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...prop,
        daysSilent,
        type: "property",
        urgency: daysSilent > 45 ? "high" : daysSilent > 30 ? "medium" : "low",
      }
    })
    .sort((a, b) => b.daysSilent - a.daysSilent) || []

  return NextResponse.json({
    summary: {
      forgottenLeads: forgottenLeads.length,
      silentOwners: silentOwners.length,
      silentTenants: silentTenants.length,
      silentProperties: silentProperties.length,
      total: forgottenLeads.length + silentOwners.length + silentTenants.length + silentProperties.length,
    },
    forgottenLeads,
    silentOwners,
    silentTenants,
    silentProperties,
  })
}
