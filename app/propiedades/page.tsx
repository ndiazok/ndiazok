import { Suspense } from "react"
import PropertiesContent from "./properties-content"

export default function PublicPropertiesPage() {
  return (
    <Suspense fallback={<PropertiesLoading />}>
      <PropertiesContent />
    </Suspense>
  )
}

function PropertiesLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
