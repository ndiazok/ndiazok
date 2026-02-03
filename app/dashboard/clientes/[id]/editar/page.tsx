"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { ClientEditForm } from "./form"

export default function EditarClientePage() {
  const params = useParams()
  const id = params.id as string

  if (id === "nuevo") {
    return null
  }

  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <ClientEditForm clientId={id} />
    </Suspense>
  )
}
