"use client"

import { Suspense } from "react"
import { PaymentForm } from "./form"

export default function RegistrarPagoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <PaymentForm />
    </Suspense>
  )
}
