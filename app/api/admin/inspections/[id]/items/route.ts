import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("inspection_items")
    .select("*")
    .eq("inspection_id", id)
    .order("orden", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  // Si es un array de items, insertar todos
  if (Array.isArray(body)) {
    const items = body.map((item, index) => ({
      inspection_id: id,
      categoria: item.categoria,
      item_nombre: item.item_nombre || item.nombre,
      descripcion: item.descripcion || null,
      orden: item.orden || index + 1,
      estado: "pendiente",
    }))

    const { data, error } = await supabase
      .from("inspection_items")
      .insert(items)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  }

  // Insertar un solo item
  const { data, error } = await supabase
    .from("inspection_items")
    .insert({
      inspection_id: id,
      categoria: body.categoria,
      item_nombre: body.item_nombre || body.nombre,
      descripcion: body.descripcion || null,
      orden: body.orden || 1,
      estado: "pendiente",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  // Actualizar un item específico
  const { item_id, ...updateData } = body

  if (!item_id) {
    return NextResponse.json({ error: "item_id es requerido" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("inspection_items")
    .update({
      estado: updateData.estado,
      observacion: updateData.observacion,
      fotos: updateData.fotos,
    })
    .eq("id", item_id)
    .eq("inspection_id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
