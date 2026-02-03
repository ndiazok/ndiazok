import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { action, ids, data } = await request.json()

    switch (action) {
      case "mark_paid": {
        // Mark multiple receipts as paid
        const { error } = await supabaseAdmin
          .from("movimientos")
          .update({
            estado: "pagado",
            fecha_pago: new Date().toISOString(),
            metodo_pago: data?.metodo_pago || "efectivo",
          })
          .in("id", ids)

        if (error) throw error
        return NextResponse.json({ success: true, updated: ids.length })
      }

      case "send_reminders": {
        // Get contact info for selected receipts
        const { data: movimientos } = await supabaseAdmin
          .from("movimientos")
          .select(
            `
            id,
            monto,
            fecha_vencimiento,
            cuenta:cuenta_id(
              titular:titular_id(full_name, email, phone)
            )
          `,
          )
          .in("id", ids)

        // In a real app, this would send emails/WhatsApp
        // For now, we'll just return the count
        return NextResponse.json({
          success: true,
          sent: movimientos?.length || 0,
          message: `Se enviarían recordatorios a ${movimientos?.length} inquilinos`,
        })
      }

      case "delete_receipts": {
        const { error } = await supabaseAdmin.from("movimientos").delete().in("id", ids)

        if (error) throw error
        return NextResponse.json({ success: true, deleted: ids.length })
      }

      case "confirm_liquidations": {
        const { error } = await supabaseAdmin
          .from("liquidaciones")
          .update({ estado: "confirmada" })
          .in("id", ids)
          .eq("estado", "borrador")

        if (error) throw error
        return NextResponse.json({ success: true, updated: ids.length })
      }

      case "mark_liquidations_paid": {
        const { error } = await supabaseAdmin
          .from("liquidaciones")
          .update({
            estado: "pagada",
            fecha_pago: new Date().toISOString(),
          })
          .in("id", ids)
          .eq("estado", "confirmada")

        if (error) throw error
        return NextResponse.json({ success: true, updated: ids.length })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error in bulk action:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
