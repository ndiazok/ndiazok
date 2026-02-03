import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const operacion = searchParams.get("operacion")
  const tipo = searchParams.get("tipo")
  const ciudad = searchParams.get("ciudad")
  const precioMin = searchParams.get("precioMin")
  const precioMax = searchParams.get("precioMax")
  const dormitorios = searchParams.get("dormitorios")
  const q = searchParams.get("q")
  const page = Number.parseInt(searchParams.get("page") || "1")
  const perPage = Number.parseInt(searchParams.get("perPage") || "12")

  try {
    let query = supabaseAdmin
      .from("propiedades")
      .select(
        `
        id,
        direccion,
        ciudad,
        provincia,
        tipo,
        ambientes,
        dormitorios,
        banos,
        metros_cuadrados,
        en_alquiler,
        precio_alquiler,
        moneda_alquiler,
        en_venta,
        precio_venta,
        moneda_venta,
        descripcion_publica
      `,
        { count: "exact" },
      )
      .eq("publicar_web", true)
      .or("en_alquiler.eq.true,en_venta.eq.true")

    // Filtrar por operación
    if (operacion === "venta") {
      query = query.eq("en_venta", true)
    } else if (operacion === "alquiler") {
      query = query.eq("en_alquiler", true)
    }

    // Filtrar por tipo
    if (tipo) {
      query = query.eq("tipo", tipo)
    }

    // Filtrar por ciudad
    if (ciudad) {
      query = query.ilike("ciudad", `%${ciudad}%`)
    }

    // Filtrar por dormitorios
    if (dormitorios) {
      query = query.gte("dormitorios", Number.parseInt(dormitorios))
    }

    // Filtrar por precio
    if (precioMin || precioMax) {
      if (operacion === "venta") {
        if (precioMin) query = query.gte("precio_venta", Number.parseInt(precioMin))
        if (precioMax) query = query.lte("precio_venta", Number.parseInt(precioMax))
      } else if (operacion === "alquiler") {
        if (precioMin) query = query.gte("precio_alquiler", Number.parseInt(precioMin))
        if (precioMax) query = query.lte("precio_alquiler", Number.parseInt(precioMax))
      }
    }

    // Búsqueda de texto
    if (q) {
      query = query.or(`direccion.ilike.%${q}%,ciudad.ilike.%${q}%,tipo.ilike.%${q}%`)
    }

    // Paginación
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    query = query.range(from, to).order("created_at", { ascending: false })

    const { data: properties, error, count } = await query

    if (error) {
      console.error("[v0] Error fetching public properties:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Obtener imágenes para cada propiedad
    const propertyIds = properties?.map((p) => p.id) || []
    let images: any[] = []

    if (propertyIds.length > 0) {
      const { data: imagesData } = await supabaseAdmin
        .from("property_images")
        .select("id, property_id, url, es_principal")
        .in("property_id", propertyIds)

      images = imagesData || []
    }

    // Combinar propiedades con imágenes
    const propertiesWithImages = properties?.map((p) => ({
      ...p,
      images: images.filter((img) => img.property_id === p.id),
    }))

    return NextResponse.json({
      properties: propertiesWithImages,
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    })
  } catch (error) {
    console.error("[v0] Error in public properties API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
