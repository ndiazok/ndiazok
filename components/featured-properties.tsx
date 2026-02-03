"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Maximize, BedDouble, Bath } from "lucide-react"
import Link from "next/link"

interface Property {
  id: string
  direccion: string
  ciudad: string
  tipo: string
  ambientes: number | null
  dormitorios: number | null
  banos: number | null
  metros_cuadrados: number | null
  en_alquiler: boolean
  precio_alquiler: number | null
  moneda_alquiler: string | null
  en_venta: boolean
  precio_venta: number | null
  moneda_venta: string | null
  images?: { id: string; url: string; es_principal: boolean }[]
}

export function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

useEffect(() => {
    const fetchProperties = async (retries = 2) => {
      try {
        const res = await fetch("/api/public/properties?limit=4")
        if (res.ok) {
          const data = await res.json()
          setProperties(data.properties || [])
        }
      } catch (err) {
        if (retries > 0) {
          // Retry after a short delay on connection errors
          setTimeout(() => fetchProperties(retries - 1), 1000)
          return
        }
        console.error("Error fetching featured properties:", err)
      } finally {
        if (retries <= 0 || !loading) {
          setLoading(false)
        }
      }
    }
    fetchProperties()
  }, [])

  const formatPrice = (property: Property) => {
    if (property.en_venta && property.precio_venta) {
      const currency = property.moneda_venta === "USD" ? "USD" : "$"
      return `${currency} ${property.precio_venta.toLocaleString("es-AR")}`
    }
    if (property.en_alquiler && property.precio_alquiler) {
      const currency = property.moneda_alquiler === "USD" ? "USD" : "$"
      return `${currency} ${property.precio_alquiler.toLocaleString("es-AR")}/mes`
    }
    return "Consultar"
  }

  const getPropertyType = (property: Property) => {
    if (property.en_venta) return "Venta"
    if (property.en_alquiler) return "Alquiler"
    return ""
  }

  const getPropertyImage = (property: Property) => {
    const primaryImage = property.images?.find(img => img.es_principal)
    return primaryImage?.url || property.images?.[0]?.url || "/placeholder.svg?height=300&width=400"
  }

  const formatTipo = (tipo: string) => {
    const tipos: Record<string, string> = {
      departamento: "Departamento",
      casa: "Casa",
      ph: "PH",
      local: "Local",
      oficina: "Oficina",
      cochera: "Cochera",
      terreno: "Terreno",
      galpon: "Galpón",
    }
    return tipos[tipo] || tipo
  }

  if (loading) {
    return (
      <section id="propiedades" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Propiedades destacadas
              </span>
              <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Encontrá tu próximo hogar o inversión
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (properties.length === 0) {
    return null
  }

  return (
    <section id="propiedades" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Propiedades destacadas
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Encontrá tu próximo hogar o inversión
            </h2>
          </div>
          <Link href="/propiedades">
            <Button variant="outline" className="shrink-0 bg-transparent">
              Ver todas las propiedades
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.map((property) => (
            <Link key={property.id} href={`/propiedades/${property.id}`} className="group">
              <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={getPropertyImage(property) || "/placeholder.svg"}
                    alt={`${formatTipo(property.tipo)} en ${property.direccion}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {getPropertyType(property) && (
                    <span
                      className={`absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full ${
                        getPropertyType(property) === "Venta"
                          ? "bg-primary text-primary-foreground"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      {getPropertyType(property)}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-lg font-semibold text-foreground">{formatPrice(property)}</p>
                  <h3 className="mt-1 font-medium text-foreground">
                    {formatTipo(property.tipo)} en {property.ciudad}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {property.direccion}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                    {property.dormitorios && property.dormitorios > 0 && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5" />
                        {property.dormitorios}
                      </span>
                    )}
                    {property.banos && property.banos > 0 && (
                      <span className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5" />
                        {property.banos}
                      </span>
                    )}
                    {property.metros_cuadrados && (
                      <span className="flex items-center gap-1">
                        <Maximize className="w-3.5 h-3.5" />
                        {property.metros_cuadrados} m²
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
