"use client"

import { useRef, useState } from "react"
import { MapPin, X, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

interface Property {
  id: string
  direccion: string
  ciudad: string
  provincia: string
  tipo: string
  dormitorios: number | null
  precio_alquiler: number | null
  moneda_alquiler: string | null
  precio_venta: number | null
  moneda_venta: string | null
  en_alquiler: boolean
  en_venta: boolean
  lat?: number
  lng?: number
  images?: { url: string }[]
}

interface PropertyMapProps {
  properties: Property[]
  onPropertyClick?: (id: string) => void
}

export function PropertyMap({ properties, onPropertyClick }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Simular coordenadas basadas en la ciudad (en producción usarías geocoding)
  const getCoordinates = (property: Property) => {
    // Coordenadas base para ciudades argentinas comunes
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      "rio cuarto": { lat: -33.13, lng: -64.35 },
      córdoba: { lat: -31.42, lng: -64.18 },
      "buenos aires": { lat: -34.6, lng: -58.38 },
      mendoza: { lat: -32.89, lng: -68.83 },
      rosario: { lat: -32.95, lng: -60.65 },
    }

    const cityKey = property.ciudad?.toLowerCase() || ""
    const base = cityCoords[cityKey] || { lat: -34.6, lng: -64.0 }

    // Añadir variación aleatoria basada en el ID
    const hash = property.id.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    return {
      lat: base.lat + (hash % 100) / 1000,
      lng: base.lng + ((hash >> 8) % 100) / 1000,
    }
  }

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return null
    const symbol = currency === "USD" ? "USD " : "$ "
    return symbol + price.toLocaleString("es-AR")
  }

  // Simular vista de mapa con CSS (en producción usarías Leaflet o Google Maps)
  const propertiesWithCoords = properties.map((p) => ({
    ...p,
    coords: getCoordinates(p),
  }))

  // Normalizar coordenadas para el contenedor
  const bounds = propertiesWithCoords.reduce(
    (acc, p) => ({
      minLat: Math.min(acc.minLat, p.coords.lat),
      maxLat: Math.max(acc.maxLat, p.coords.lat),
      minLng: Math.min(acc.minLng, p.coords.lng),
      maxLng: Math.max(acc.maxLng, p.coords.lng),
    }),
    {
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
    },
  )

  const getPosition = (lat: number, lng: number) => {
    const padding = 0.1
    const latRange = bounds.maxLat - bounds.minLat || 1
    const lngRange = bounds.maxLng - bounds.minLng || 1

    return {
      top: `${((bounds.maxLat - lat) / latRange) * (1 - padding * 2) * 100 + padding * 100}%`,
      left: `${((lng - bounds.minLng) / lngRange) * (1 - padding * 2) * 100 + padding * 100}%`,
    }
  }

  return (
    <div
      className={`relative bg-muted/30 rounded-lg border overflow-hidden transition-all ${
        isFullscreen ? "fixed inset-4 z-50" : "h-[400px]"
      }`}
    >
      {/* Controles */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <Button variant="secondary" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mapa simulado */}
      <div ref={mapRef} className="absolute inset-0 bg-[#f0f0f0]">
        {/* Grid de fondo simulando mapa */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #ccc 1px, transparent 1px),
              linear-gradient(to bottom, #ccc 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Marcadores */}
        {propertiesWithCoords.map((property) => {
          const pos = getPosition(property.coords.lat, property.coords.lng)
          return (
            <button
              key={property.id}
              className={`absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 z-10 ${
                selectedProperty?.id === property.id ? "scale-125 z-20" : ""
              }`}
              style={{ top: pos.top, left: pos.left }}
              onClick={() => setSelectedProperty(property)}
            >
              <div
                className={`px-2 py-1 rounded-full text-xs font-semibold shadow-md ${
                  property.en_venta ? "bg-foreground text-background" : "bg-blue-600 text-white"
                }`}
              >
                {property.en_venta
                  ? formatPrice(property.precio_venta, property.moneda_venta)
                  : formatPrice(property.precio_alquiler, property.moneda_alquiler)}
              </div>
              <div
                className={`w-0 h-0 mx-auto border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${
                  property.en_venta ? "border-t-foreground" : "border-t-blue-600"
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* Popup de propiedad seleccionada */}
      {selectedProperty && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-3 shadow-lg z-30">
          <button
            className="absolute top-2 right-2 p-1 hover:bg-muted rounded"
            onClick={() => setSelectedProperty(null)}
          >
            <X className="h-4 w-4" />
          </button>
          <Link
            href={`/propiedades/${selectedProperty.id}`}
            className="flex gap-3"
            onClick={() => onPropertyClick?.(selectedProperty.id)}
          >
            <div className="w-20 h-20 rounded bg-muted flex-shrink-0 overflow-hidden">
              {selectedProperty.images?.[0] ? (
                <Image
                  src={selectedProperty.images[0].url || "/placeholder.svg"}
                  alt={selectedProperty.direccion}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex gap-1 mb-1">
                {selectedProperty.en_venta && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    Venta
                  </Badge>
                )}
                {selectedProperty.en_alquiler && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Alquiler
                  </Badge>
                )}
              </div>
              <p className="font-medium text-sm truncate">{selectedProperty.direccion}</p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedProperty.ciudad}, {selectedProperty.provincia}
              </p>
              <p className="font-semibold text-sm mt-1">
                {selectedProperty.en_venta
                  ? formatPrice(selectedProperty.precio_venta, selectedProperty.moneda_venta)
                  : formatPrice(selectedProperty.precio_alquiler, selectedProperty.moneda_alquiler)}
              </p>
            </div>
          </Link>
        </Card>
      )}

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur rounded-lg px-3 py-2 text-xs flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-foreground" />
          Venta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600" />
          Alquiler
        </span>
      </div>
    </div>
  )
}
