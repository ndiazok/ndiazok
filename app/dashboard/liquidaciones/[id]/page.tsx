import { Suspense } from "react"
import { LiquidacionDetail } from "./detail"

export default function LiquidacionDetallePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <LiquidacionDetail />
    </Suspense>
  )
}
