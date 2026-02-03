import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Get receipt data
    const { data: movimiento, error } = await supabaseAdmin
      .from("movimientos")
      .select(
        `
        *,
        cuenta:cuenta_id(
          titular:titular_id(full_name, email, phone, dni, domicilio_legal)
        ),
        contrato:contrato_id(
          id,
          fecha_inicio,
          fecha_fin,
          monto_base,
          moneda,
          propiedad:propiedad_id(
            direccion,
            ciudad,
            provincia
          )
        )
      `,
      )
      .eq("id", id)
      .single()

    if (error) throw error

    // Generate HTML for PDF
    const html = generateReceiptHTML(movimiento)

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error: any) {
    console.error("Error generating receipt PDF:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateReceiptHTML(movimiento: any) {
  const fecha = new Date(movimiento.fecha_vencimiento).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const fechaEmision = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const moneda = movimiento.moneda === "USD" ? "USD" : "$"
  const monto = Number(movimiento.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo de Alquiler - ${movimiento.id.slice(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .receipt {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      padding: 30px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -1px;
    }
    .logo span { color: #4ade80; }
    .receipt-number {
      text-align: right;
    }
    .receipt-number h2 {
      font-size: 14px;
      font-weight: 400;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    .receipt-number p {
      font-size: 18px;
      font-weight: 600;
    }
    .content { padding: 40px; }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .info-item label {
      display: block;
      font-size: 11px;
      color: #888;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .info-item p {
      font-size: 15px;
      font-weight: 500;
      color: #333;
    }
    .amount-box {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 30px 0;
    }
    .amount-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .amount {
      font-size: 42px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 10px 0;
    }
    .amount-status {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .status-paid {
      background: #d1fae5;
      color: #065f46;
    }
    .status-overdue {
      background: #fee2e2;
      color: #991b1b;
    }
    .footer {
      background: #f8fafc;
      padding: 20px 40px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #666;
    }
    .qr-placeholder {
      width: 60px;
      height: 60px;
      background: #e2e8f0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #888;
    }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">Sigma<span>.</span></div>
      <div class="receipt-number">
        <h2>Recibo N°</h2>
        <p>${movimiento.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Inquilino</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Nombre</label>
            <p>${movimiento.cuenta?.titular?.full_name || "N/A"}</p>
          </div>
          <div class="info-item">
            <label>DNI</label>
            <p>${movimiento.cuenta?.titular?.dni || "N/A"}</p>
          </div>
          <div class="info-item">
            <label>Email</label>
            <p>${movimiento.cuenta?.titular?.email || "N/A"}</p>
          </div>
          <div class="info-item">
            <label>Teléfono</label>
            <p>${movimiento.cuenta?.titular?.phone || "N/A"}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Propiedad</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Dirección</label>
            <p>${movimiento.contrato?.propiedad?.direccion || "N/A"}</p>
          </div>
          <div class="info-item">
            <label>Localidad</label>
            <p>${movimiento.contrato?.propiedad?.ciudad || "N/A"}, ${movimiento.contrato?.propiedad?.provincia || ""}</p>
          </div>
        </div>
      </div>

      <div class="amount-box">
        <div class="amount-label">Importe a Pagar</div>
        <div class="amount">${moneda} ${monto}</div>
        <span class="amount-status ${
          movimiento.estado === "pagado"
            ? "status-paid"
            : movimiento.estado === "vencido"
              ? "status-overdue"
              : "status-pending"
        }">
          ${movimiento.estado === "pagado" ? "Pagado" : movimiento.estado === "vencido" ? "Vencido" : "Pendiente"}
        </span>
      </div>

      <div class="section">
        <div class="info-grid">
          <div class="info-item">
            <label>Fecha de Emisión</label>
            <p>${fechaEmision}</p>
          </div>
          <div class="info-item">
            <label>Fecha de Vencimiento</label>
            <p>${fecha}</p>
          </div>
          <div class="info-item">
            <label>Concepto</label>
            <p>${movimiento.concepto || "Alquiler mensual"}</p>
          </div>
          <div class="info-item">
            <label>Período</label>
            <p>${movimiento.periodo || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>
        <p><strong>Sigma Inmobiliaria</strong></p>
        <p>Documento generado el ${fechaEmision}</p>
      </div>
      <div class="qr-placeholder">QR</div>
    </div>
  </div>
</body>
</html>
  `
}
