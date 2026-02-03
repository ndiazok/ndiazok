import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "ID de propiedad inválido" }, { status: 400 })
  }

  try {
    // Obtener propiedad pública
    const { data: property, error } = await supabaseAdmin
      .from("propiedades")
      .select(`
        id,
        direccion,
        ciudad,
        provincia,
        tipo,
        ambientes,
        dormitorios,
        banos,
        metros_cuadrados,
        cochera,
        en_alquiler,
        precio_alquiler,
        moneda_alquiler,
        en_venta,
        precio_venta,
        moneda_venta,
        descripcion_publica,
        amenities,
        titulo_publicacion,
        tour_virtual_url,
        video_url
      `)
      .eq("id", id)
      .eq("publicar_web", true)
      .or("en_alquiler.eq.true,en_venta.eq.true")
      .single()

    if (error || !property) {
      return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 })
    }

    // Obtener imágenes
    const { data: images } = await supabaseAdmin
      .from("property_images")
      .select("id, url, descripcion, es_principal")
      .eq("property_id", id)
      .order("es_principal", { ascending: false })
      .order("orden", { ascending: true })

    return NextResponse.json({
      ...property,
      images: images || [],
    })
  } catch (error) {
    console.error("[v0] Error fetching public property:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
