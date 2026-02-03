import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("propiedades")
      .select("ciudad, provincia")
      .eq("publicar_web", true)
      .or("en_alquiler.eq.true,en_venta.eq.true")

    if (error) throw error

    // Obtener ciudades únicas con su provincia
    const citiesMap = new Map<string, string>()
    data?.forEach((p) => {
      if (p.ciudad && !citiesMap.has(p.ciudad.toLowerCase())) {
        citiesMap.set(p.ciudad.toLowerCase(), `${p.ciudad}, ${p.provincia || ""}`)
      }
    })

    const cities = Array.from(citiesMap.values()).sort()

    return NextResponse.json({ cities })
  } catch (error) {
    console.error("[v0] Error fetching cities:", error)
    return NextResponse.json({ cities: [] })
  }
}
