import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dias = Number.parseInt(searchParams.get("dias") || "60")

    // Obtener contratos con alertas usando la vista
    const { data: contratos, error } = await supabaseAdmin
      .from("vista_contratos_vigencia")
      .select("*")
      .eq("estado", "activo")
      .or(
        `fecha_fin.lt.${new Date().toISOString().split("T")[0]},fecha_fin.lte.${new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}`,
      )
      .order("fecha_fin", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching alerts:", error)
      // Si la vista no existe, usar query directa
      const { data: contratosDirect, error: directError } = await supabaseAdmin
        .from("contratos")
        .select(`
          *,
          propiedades (
            direccion,
            ciudad,
            tipo
          )
        `)
        .eq("estado", "activo")
        .order("fecha_fin", { ascending: true })

      if (directError) throw directError

      const hoy = new Date()
      const alertas = (contratosDirect || [])
        .map((c) => {
          const fechaFin = new Date(c.fecha_fin)
          const diasHastaVencimiento = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

          let nivelAlerta = "ninguna"
          if (diasHastaVencimiento < 0) nivelAlerta = "vencido"
          else if (diasHastaVencimiento <= 15) nivelAlerta = "urgente"
          else if (diasHastaVencimiento <= 30) nivelAlerta = "proximo"
          else if (diasHastaVencimiento <= 60) nivelAlerta = "atencion"

          return {
            ...c,
            direccion: c.propiedades?.direccion,
            ciudad: c.propiedades?.ciudad,
            tipo_propiedad: c.propiedades?.tipo,
            vigente: diasHastaVencimiento >= 0,
            vencido: diasHastaVencimiento < 0,
            dias_hasta_vencimiento: diasHastaVencimiento,
            nivel_alerta: nivelAlerta,
          }
        })
        .filter((c) => c.dias_hasta_vencimiento <= dias)

      return NextResponse.json(alertas)
    }

    return NextResponse.json(contratos || [])
  } catch (error) {
    console.error("[v0] Error in alerts API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
