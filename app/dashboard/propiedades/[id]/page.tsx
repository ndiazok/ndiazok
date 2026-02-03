import { redirect } from "next/navigation"
import PropertyDetailClient from "./property-detail-client"
import NuevaPropiedadPage from "../nueva/page"

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Handle "nueva" route - render the nueva page content directly
  // This handles cases where Next.js routes to dynamic instead of static
  if (id === "nueva") {
    return <NuevaPropiedadPage />
  }
  
  // Validate UUID format to avoid invalid DB queries
  if (!UUID_REGEX.test(id)) {
    redirect("/dashboard/propiedades")
  }
  
  return <PropertyDetailClient id={id} />
}
