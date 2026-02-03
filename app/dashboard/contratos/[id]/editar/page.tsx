"use client"

import { Suspense } from "react"
import { EditContratoForm } from "./form"

export default function EditContratoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      }
    >
      <EditContratoForm />
    </Suspense>
  )
}
