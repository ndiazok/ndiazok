import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data: liquidacion, error } = await supabaseAdmin
      .from("liquidaciones")
      .select(
        `
        *,
        propietario:propietario_id(full_name, email, phone, dni, cuit, domicilio_legal),
        propiedad:propiedad_id(direccion, ciudad, provincia)
      `,
      )
      .eq("id", id)
      .single()

    if (error) throw error

    const html = generateLiquidationHTML(liquidacion)

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error: any) {
    console.error("Error generating liquidation PDF:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateLiquidationHTML(liquidacion: any) {
  const fechaEmision = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const moneda = liquidacion.moneda === "USD" ? "USD" : "$"
  const ingresos = Number(liquidacion.total_ingresos || 0)
  const deducciones = Number(liquidacion.total_deducciones || 0)
  const neto = Number(liquidacion.monto_neto || 0)

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Liquidación - ${liquidacion.id.slice(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .document {
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
    .doc-info {
      text-align: right;
    }
    .doc-info h2 {
      font-size: 14px;
      font-weight: 400;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    .doc-info p {
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
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
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
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f8fafc;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      font-weight: 600;
    }
    td {
      font-size: 14px;
    }
    .text-right { text-align: right; }
    .text-green { color: #059669; }
    .text-red { color: #dc2626; }
    .total-row {
      background: #f8fafc;
      font-weight: 600;
    }
    .total-row td {
      border-bottom: none;
      padding: 16px 12px;
    }
    .net-amount {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .net-label {
      font-size: 14px;
      opacity: 0.8;
    }
    .net-value {
      font-size: 32px;
      font-weight: 700;
    }
    .footer {
      background: #f8fafc;
      padding: 20px 40px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #666;
    }
    .signature-area {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 200px;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-bottom: 8px;
      padding-top: 60px;
    }
    @media print {
      body { background: white; padding: 0; }
      .document { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <div class="logo">Sigma<span>.</span></div>
      <div class="doc-info">
        <h2>Liquidación N°</h2>
        <p>${liquidacion.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Propietario</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Nombre</label>
            <p>${liquidacion.propietario?.full_name || "N/A"}</p>
          </div>
          <div class="info-item">
            <label>CUIT/CUIL</label>
            <p>${liquidacion.propietario?.cuit || liquidacion.propietario?.dni || "N/A"}</p>
          </div>
          <div class="info-item">
            <label>Email</label>
            <p>${liquidacion.propietario?.email || "N/A"}</p>
          </div>
          <div class="info-item">
            <label>Domicilio</label>
            <p>${liquidacion.propietario?.domicilio_legal || "N/A"}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Propiedad</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Dirección</label>
            <p>${liquidacion.propiedad?.direccion || "Todas las propiedades"}</p>
          </div>
          <div class="info-item">
            <label>Período</label>
            <p>${liquidacion.periodo || "N/A"}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Detalle de Liquidación</div>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Alquileres cobrados</td>
              <td class="text-right text-green">+ ${moneda} ${ingresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Honorarios de administración</td>
              <td class="text-right text-red">- ${moneda} ${(deducciones * 0.7).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Reparaciones y gastos</td>
              <td class="text-right text-red">- ${moneda} ${(deducciones * 0.3).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Ingresos</strong></td>
              <td class="text-right text-green"><strong>+ ${moneda} ${ingresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong></td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Deducciones</strong></td>
              <td class="text-right text-red"><strong>- ${moneda} ${deducciones.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="net-amount">
          <div>
            <div class="net-label">Monto Neto a Liquidar</div>
          </div>
          <div class="net-value">${moneda} ${neto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div class="signature-area">
        <div class="signature-box">
          <div class="signature-line"></div>
          <p>Firma Propietario</p>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <p>Sigma Inmobiliaria</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Sigma Inmobiliaria</strong> - Documento generado el ${fechaEmision}</p>
      <p>Este documento es válido como comprobante de liquidación.</p>
    </div>
  </div>
</body>
</html>
  `
}
