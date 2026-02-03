"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  MapPin,
  Bed,
  Bath,
  Square,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Home,
  Building2,
  ArrowLeft,
  Map,
  Grid3X3,
  Bell,
  GitCompare,
  X,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { SearchAutocomplete } from "@/components/public/search-autocomplete"
import { PropertyMap } from "@/components/public/property-map"
import { PropertyComparator } from "@/components/public/property-comparator"
import { SearchAlertModal } from "@/components/public/search-alert-modal"

interface Property {
  id: string
  direccion: string
  ciudad: string
  provincia: string
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
  descripcion_publica: string | null
  latitud: number | null
  longitud: number | null
  images: { id: string; url: string; is_primary: boolean }[]
}

const PROPERTY_TYPES = [
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Departamento" },
  { value: "ph", label: "PH" },
  { value: "local", label: "Local comercial" },
  { value: "oficina", label: "Oficina" },
  { value: "terreno", label: "Terreno" },
  { value: "galpon", label: "Galpón" },
  { value: "cochera", label: "Cochera" },
]

export default function PropertiesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<Property[]>([])
  const [showComparator, setShowComparator] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)

  // Filtros
  const [operacion, setOperacion] = useState(searchParams.get("operacion") || "todas")
  const [tipo, setTipo] = useState(searchParams.get("tipo") || "")
  const [ciudad, setCiudad] = useState(searchParams.get("ciudad") || "")
  const [precioMin, setPrecioMin] = useState(searchParams.get("precioMin") || "")
  const [precioMax, setPrecioMax] = useState(searchParams.get("precioMax") || "")
  const [dormitoriosMin, setDormitoriosMin] = useState(searchParams.get("dormitorios") || "")
  const [searchText, setSearchText] = useState(searchParams.get("q") || "")

  const page = Number.parseInt(searchParams.get("page") || "1")
  const perPage = 12

  const fetchProperties = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (operacion && operacion !== "todas") params.set("operacion", operacion)
      if (tipo) params.set("tipo", tipo)
      if (ciudad) params.set("ciudad", ciudad)
      if (precioMin) params.set("precioMin", precioMin)
      if (precioMax) params.set("precioMax", precioMax)
      if (dormitoriosMin) params.set("dormitorios", dormitoriosMin)
      if (searchText) params.set("q", searchText)
      params.set("page", page.toString())
      params.set("perPage", perPage.toString())

      const res = await fetch(`/api/public/properties?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProperties(data.properties || [])
        setTotalCount(data.total || 0)
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setIsLoading(false)
    }
  }, [operacion, tipo, ciudad, precioMin, precioMax, dormitoriosMin, searchText, page])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (operacion && operacion !== "todas") params.set("operacion", operacion)
    if (tipo) params.set("tipo", tipo)
    if (ciudad) params.set("ciudad", ciudad)
    if (precioMin) params.set("precioMin", precioMin)
    if (precioMax) params.set("precioMax", precioMax)
    if (dormitoriosMin) params.set("dormitorios", dormitoriosMin)
    if (searchText) params.set("q", searchText)
    router.push(`/propiedades?${params.toString()}`)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setOperacion("todas")
    setTipo("")
    setCiudad("")
    setPrecioMin("")
    setPrecioMax("")
    setDormitoriosMin("")
    setSearchText("")
    router.push("/propiedades")
  }

  const toggleCompareSelection = (property: Property) => {
    if (selectedForCompare.find((p) => p.id === property.id)) {
      setSelectedForCompare(selectedForCompare.filter((p) => p.id !== property.id))
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare([...selectedForCompare, property])
    }
  }

  const totalPages = Math.ceil(totalCount / perPage)

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return null
    const symbol = currency === "USD" ? "USD " : "$ "
    return symbol + price.toLocaleString("es-AR")
  }

  const currentSearchCriteria = {
    operacion: operacion !== "todas" ? operacion : undefined,
    tipo: tipo || undefined,
    ciudad: ciudad || undefined,
    precioMin: precioMin ? Number(precioMin) : undefined,
    precioMax: precioMax ? Number(precioMax) : undefined,
    dormitoriosMin: dormitoriosMin ? Number(dormitoriosMin) : undefined,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">Sigma Inmobiliaria</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/propiedades?operacion=venta" className="text-sm hover:text-foreground text-muted-foreground">
              Venta
            </Link>
            <Link
              href="/propiedades?operacion=alquiler"
              className="text-sm hover:text-foreground text-muted-foreground"
            >
              Alquiler
            </Link>
            <Link href="/#contacto" className="text-sm hover:text-foreground text-muted-foreground">
              Contacto
            </Link>
          </nav>
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Ingresar
            </Button>
          </Link>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-muted/50 border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Operacion tabs */}
            <div className="flex rounded-lg border bg-background p-1">
              <button
                onClick={() => setOperacion("todas")}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  operacion === "todas" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setOperacion("venta")}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  operacion === "venta" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                Venta
              </button>
              <button
                onClick={() => setOperacion("alquiler")}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  operacion === "alquiler" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                Alquiler
              </button>
            </div>

            <div className="flex-1 flex gap-2">
              <SearchAutocomplete
                value={ciudad}
                onChange={setCiudad}
                onSearch={(value) => {
                  setCiudad(value)
                  applyFilters()
                }}
                placeholder="Buscar por ciudad o barrio..."
                className="flex-1"
              />
              <Button onClick={applyFilters}>Buscar</Button>
            </div>

            {/* Filters button */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros de búsqueda</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label>Tipo de propiedad</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los tipos</SelectItem>
                        {PROPERTY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <SearchAutocomplete value={ciudad} onChange={setCiudad} placeholder="Ej: Río Cuarto" />
                  </div>

                  <div className="space-y-2">
                    <Label>Dormitorios mínimos</Label>
                    <Select value={dormitoriosMin} onValueChange={setDormitoriosMin}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cualquier cantidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Cualquier cantidad</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Precio mínimo</Label>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={precioMin}
                        onChange={(e) => setPrecioMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Precio máximo</Label>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={precioMax}
                        onChange={(e) => setPrecioMax(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={clearFilters}>
                      Limpiar
                    </Button>
                    <Button className="flex-1" onClick={applyFilters}>
                      Aplicar filtros
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Results */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Buscando..." : `${totalCount} propiedades encontradas`}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Alert button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
              onClick={() => setShowAlertModal(true)}
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Crear alerta</span>
            </Button>

            {/* Compare button */}
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => {
                setCompareMode(!compareMode)
                if (compareMode) {
                  setSelectedForCompare([])
                }
              }}
            >
              <GitCompare className="h-4 w-4" />
              <span className="hidden sm:inline">
                {compareMode ? `Comparar (${selectedForCompare.length}/3)` : "Comparar"}
              </span>
            </Button>

            {/* View toggle */}
            <div className="flex rounded-lg border bg-background p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
                title="Vista grilla"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "map" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
                title="Vista mapa"
              >
                <Map className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {compareMode && (
          <div className="bg-muted/50 border rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Modo comparación activo</p>
                <p className="text-sm text-muted-foreground">Seleccioná hasta 3 propiedades para comparar</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedForCompare.length >= 2 && (
                <Button size="sm" onClick={() => setShowComparator(true)}>
                  Comparar {selectedForCompare.length} propiedades
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCompareMode(false)
                  setSelectedForCompare([])
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {viewMode === "map" ? (
          <PropertyMap
            properties={properties}
            isLoading={isLoading}
            onPropertyClick={(id) => router.push(`/propiedades/${id}`)}
          />
        ) : (
          <>
            {/* Properties grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-muted" />
                    <CardContent className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-6 bg-muted rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No encontramos propiedades</h3>
                <p className="text-muted-foreground mb-4">Probá ajustando los filtros de búsqueda</p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                  <Button onClick={() => setShowAlertModal(true)}>
                    <Bell className="h-4 w-4 mr-2" />
                    Avisame cuando haya
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map((property) => {
                  const isSelected = selectedForCompare.find((p) => p.id === property.id)

                  return (
                    <div key={property.id} className="relative">
                      {compareMode && (
                        <div
                          className={`absolute top-3 right-3 z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-foreground border-foreground text-background"
                              : "bg-background/80 border-muted-foreground/50 hover:border-foreground"
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleCompareSelection(property)
                          }}
                        >
                          {isSelected && <Check className="h-4 w-4" />}
                        </div>
                      )}

                      <Link href={`/propiedades/${property.id}`}>
                        <Card
                          className={`overflow-hidden hover:shadow-lg transition-all group cursor-pointer h-full ${
                            isSelected ? "ring-2 ring-foreground" : ""
                          }`}
                        >
                          <div className="aspect-[4/3] relative bg-muted">
                            {property.images && property.images.length > 0 ? (
                              <Image
                                src={property.images.find((img) => img.is_primary)?.url || property.images[0].url}
                                alt={property.direccion}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Building2 className="h-12 w-12 text-muted-foreground/50" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 flex gap-2">
                              {property.en_venta && <Badge className="bg-foreground text-background">Venta</Badge>}
                              {property.en_alquiler && <Badge variant="secondary">Alquiler</Badge>}
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="mb-2">
                              <h3 className="font-medium line-clamp-1">{property.direccion}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {property.ciudad}, {property.provincia}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                              {property.dormitorios && (
                                <span className="flex items-center gap-1">
                                  <Bed className="h-3.5 w-3.5" />
                                  {property.dormitorios}
                                </span>
                              )}
                              {property.banos && (
                                <span className="flex items-center gap-1">
                                  <Bath className="h-3.5 w-3.5" />
                                  {property.banos}
                                </span>
                              )}
                              {property.metros_cuadrados && (
                                <span className="flex items-center gap-1">
                                  <Square className="h-3.5 w-3.5" />
                                  {property.metros_cuadrados} m²
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {property.en_venta && property.precio_venta && (
                                <p className="font-semibold">
                                  {formatPrice(property.precio_venta, property.moneda_venta)}
                                  <span className="text-xs font-normal text-muted-foreground ml-1">venta</span>
                                </p>
                              )}
                              {property.en_alquiler && property.precio_alquiler && (
                                <p className="font-semibold">
                                  {formatPrice(property.precio_alquiler, property.moneda_alquiler)}
                                  <span className="text-xs font-normal text-muted-foreground ml-1">/mes</span>
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && viewMode === "grid" && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set("page", (page - 1).toString())
                router.push(`/propiedades?${params.toString()}`)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set("page", (page + 1).toString())
                router.push(`/propiedades?${params.toString()}`)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Sigma Inmobiliaria. Todos los derechos reservados.</p>
        </div>
      </footer>

      <PropertyComparator
        properties={selectedForCompare}
        isOpen={showComparator}
        onClose={() => setShowComparator(false)}
      />

      <SearchAlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        searchCriteria={currentSearchCriteria}
      />
    </div>
  )
}
