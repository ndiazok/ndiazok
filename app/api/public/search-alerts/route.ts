import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      nombre,
      operacion,
      tipo,
      ciudad,
      provincia,
      dormitorios_min,
      dormitorios_max,
      precio_min,
      precio_max,
      moneda,
      frecuencia,
    } = body

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("search_alerts")
      .insert({
        email,
        nombre,
        operacion: operacion || "ambas",
        tipo,
        ciudad,
        provincia,
        dormitorios_min,
        dormitorios_max,
        precio_min,
        precio_max,
        moneda: moneda || "ARS",
        frecuencia: frecuencia || "diaria",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, alert: data })
  } catch (error) {
    console.error("[v0] Error creating search alert:", error)
    return NextResponse.json({ error: "Error al crear alerta" }, { status: 500 })
  }
}
