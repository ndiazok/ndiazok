import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { put, del } from "@vercel/blob"
import { generateObject } from "ai"
import { z } from "zod"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("person_documents")
    .select("*")
    .eq("person_id", id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const formData = await request.formData()
  
  const file = formData.get("file") as File
  const documentType = formData.get("document_type") as string
  const runOcr = formData.get("run_ocr") === "true"

  if (!file || !documentType) {
    return NextResponse.json({ error: "File and document_type required" }, { status: 400 })
  }

  // Upload to Vercel Blob
  const blob = await put(`persons/${id}/documents/${documentType}_${Date.now()}_${file.name}`, file, {
    access: "public",
  })

  // Create document record
  const { data: doc, error } = await supabase
    .from("person_documents")
    .insert({
      person_id: id,
      document_type: documentType,
      url: blob.url,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: "pendiente"
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Run OCR if requested and it's an image
  if (runOcr && file.type.startsWith("image/")) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")
      const dataUrl = `data:${file.type};base64,${base64}`

      const ocrSchema = z.object({
        document_type_detected: z.string().describe("Tipo de documento detectado (DNI, recibo de sueldo, escritura, etc)"),
        nombre_completo: z.string().optional().describe("Nombre completo si aparece"),
        numero_documento: z.string().optional().describe("Número de DNI/CUIT si aparece"),
        fecha_emision: z.string().optional().describe("Fecha de emisión si aparece"),
        fecha_vencimiento: z.string().optional().describe("Fecha de vencimiento si aparece"),
        domicilio: z.string().optional().describe("Domicilio si aparece"),
        monto: z.number().optional().describe("Monto si es un recibo o comprobante"),
        empleador: z.string().optional().describe("Empleador si es recibo de sueldo"),
        observaciones: z.string().optional().describe("Cualquier otra información relevante"),
        confianza: z.number().min(0).max(1).describe("Nivel de confianza de la extracción (0-1)")
      })

      const { object: ocrData } = await generateObject({
        model: "openai/gpt-4o-mini",
        schema: ocrSchema,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extrae toda la información relevante de este documento. Es un documento argentino, puede ser DNI, recibo de sueldo, escritura, certificado, etc." },
              { type: "image", image: dataUrl }
            ]
          }
        ]
      })

      // Update document with OCR data
      await supabase
        .from("person_documents")
        .update({
          ocr_data: ocrData,
          ocr_processed_at: new Date().toISOString(),
          ocr_confidence: ocrData.confianza
        })
        .eq("id", doc.id)

      return NextResponse.json({ ...doc, ocr_data: ocrData })
    } catch (ocrError) {
      console.error("OCR error:", ocrError)
      // Return doc without OCR data
      return NextResponse.json(doc)
    }
  }

  return NextResponse.json(doc)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const docId = searchParams.get("docId")

  if (!docId) {
    return NextResponse.json({ error: "docId required" }, { status: 400 })
  }

  // Get document to delete blob
  const { data: doc } = await supabase
    .from("person_documents")
    .select("url")
    .eq("id", docId)
    .single()

  if (doc?.url) {
    try {
      await del(doc.url)
    } catch (e) {
      console.error("Error deleting blob:", e)
    }
  }

  const { error } = await supabase
    .from("person_documents")
    .delete()
    .eq("id", docId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
