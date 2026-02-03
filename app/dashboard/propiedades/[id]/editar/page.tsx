import { Suspense } from "react"
import PropertyEditForm from "./form"

export default async function PropertyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      }
    >
      <PropertyEditForm id={id} />
    </Suspense>
  )
}
