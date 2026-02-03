"use client"

import { Suspense } from "react"
import { LiquidacionForm } from "./form"

export default function NuevaLiquidacionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <LiquidacionForm />
    </Suspense>
  )
}
