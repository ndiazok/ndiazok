"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Phone,
  ChevronLeft,
  ChevronRight,
  Building2,
  Check,
  Share2,
  Heart,
  Calendar,
  Maximize2,
  X,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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
  cochera: boolean
  en_alquiler: boolean
  precio_alquiler: number | null
  moneda_alquiler: string | null
  en_venta: boolean
  precio_venta: number | null
  moneda_venta: string | null
  descripcion_publica: string | null
  caracteristicas: string[] | null
  images: { id: string; url: string; description: string | null; is_primary: boolean }[]
}

export default function PublicPropertyDetailPage() {
  const { id } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [contactForm, setContactForm] = useState({ nombre: "", email: "", telefono: "", mensaje: "" })
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/public/properties/${id}`)
        if (res.ok) {
          const data = await res.json()
          setProperty(data)
        }
      } catch (error) {
        console.error("Error fetching property:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchProperty()
  }, [id])

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return null
    const symbol = currency === "USD" ? "USD " : "$ "
    return symbol + price.toLocaleString("es-AR")
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSent(true)
    setIsSending(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: property?.direccion,
        text: `Mirá esta propiedad en Sigma Inmobiliaria: ${property?.direccion}`,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert("Link copiado al portapapeles")
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isLightboxOpen) return
      if (e.key === "Escape") setIsLightboxOpen(false)
      if (e.key === "ArrowLeft") setCurrentImageIndex((i) => (i === 0 ? (property?.images.length || 1) - 1 : i - 1))
      if (e.key === "ArrowRight") setCurrentImageIndex((i) => (i === (property?.images.length || 1) - 1 ? 0 : i + 1))
    },
    [isLightboxOpen, property?.images.length],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando propiedad...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h1 className="text-2xl font-semibold mb-2">Propiedad no encontrada</h1>
          <p className="text-muted-foreground mb-6">La propiedad que buscás no existe o ya no está disponible.</p>
          <Link href="/propiedades">
            <Button size="lg">Ver todas las propiedades</Button>
          </Link>
        </div>
      </div>
    )
  }

  const images = property.images || []
  const sortedImages = [...images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
  const hasImages = sortedImages.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/propiedades"
            className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver a propiedades</span>
            <span className="sm:hidden">Volver</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFavorite(!isFavorite)}
              className={isFavorite ? "text-red-500" : ""}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Gallery */}
      <section className="relative bg-muted">
        <div className="container mx-auto">
          {hasImages ? (
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 p-2 md:h-[500px]">
              {/* Main Image */}
              <div
                className="md:col-span-2 md:row-span-2 relative aspect-[4/3] md:aspect-auto rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => setIsLightboxOpen(true)}
              >
                <Image
                  src={sortedImages[0]?.url || "/placeholder.svg"}
                  alt={sortedImages[0]?.description || property.direccion}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Ver fotos
                </Button>
              </div>
              {/* Secondary Images */}
              {sortedImages.slice(1, 5).map((img, idx) => (
                <div
                  key={img.id}
                  className="hidden md:block relative rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => {
                    setCurrentImageIndex(idx + 1)
                    setIsLightboxOpen(true)
                  }}
                >
                  <Image
                    src={img.url || "/placeholder.svg"}
                    alt={img.description || ""}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {idx === 3 && sortedImages.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">+{sortedImages.length - 5} fotos</span>
                    </div>
                  )}
                </div>
              ))}
              {/* Mobile: Show all button */}
              {sortedImages.length > 1 && (
                <Button
                  variant="secondary"
                  className="md:hidden absolute bottom-4 right-4"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  Ver {sortedImages.length} fotos
                </Button>
              )}
            </div>
          ) : (
            <div className="h-[300px] md:h-[500px] flex items-center justify-center">
              <div className="text-center">
                <Building2 className="h-20 w-20 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground mt-4">Sin imágenes disponibles</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Price Section */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {property.en_venta && (
                  <Badge className="bg-foreground text-background text-sm px-3 py-1">En Venta</Badge>
                )}
                {property.en_alquiler && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    En Alquiler
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize text-sm px-3 py-1">
                  {property.tipo}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{property.direccion}</h1>

              <p className="text-lg text-muted-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {property.ciudad}, {property.provincia}
              </p>

              {/* Prices */}
              <div className="flex flex-wrap gap-6 pt-2">
                {property.en_venta && property.precio_venta && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Precio de venta</p>
                    <p className="text-3xl md:text-4xl font-bold">
                      {formatPrice(property.precio_venta, property.moneda_venta)}
                    </p>
                  </div>
                )}
                {property.en_alquiler && property.precio_alquiler && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Alquiler mensual</p>
                    <p className="text-3xl md:text-4xl font-bold">
                      {formatPrice(property.precio_alquiler, property.moneda_alquiler)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Key Features */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Características principales</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {property.ambientes && (
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold">{property.ambientes}</p>
                    <p className="text-sm text-muted-foreground mt-1">Ambientes</p>
                  </div>
                )}
                {property.dormitorios && (
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <Bed className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-3xl font-bold">{property.dormitorios}</p>
                    <p className="text-sm text-muted-foreground mt-1">Dormitorios</p>
                  </div>
                )}
                {property.banos && (
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <Bath className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-3xl font-bold">{property.banos}</p>
                    <p className="text-sm text-muted-foreground mt-1">Baños</p>
                  </div>
                )}
                {property.metros_cuadrados && (
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <Square className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-3xl font-bold">{property.metros_cuadrados}</p>
                    <p className="text-sm text-muted-foreground mt-1">m²</p>
                  </div>
                )}
              </div>

              {/* Additional specs */}
              {property.cochera && (
                <div className="flex flex-wrap gap-3 mt-4">
                  <Badge variant="outline" className="text-sm py-1.5 px-3">
                    <Car className="h-3.5 w-3.5 mr-1.5" />
                    Con cochera
                  </Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {property.descripcion_publica && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Descripción</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
                  {property.descripcion_publica}
                </p>
              </div>
            )}

            {/* Features List */}
            {property.caracteristicas && property.caracteristicas.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-xl font-semibold mb-4">Comodidades y servicios</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {property.caracteristicas.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-foreground/10 flex items-center justify-center">
                          <Check className="h-4 w-4 text-foreground" />
                        </div>
                        <span className="text-sm font-medium">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Location hint */}
            <Separator />
            <div>
              <h2 className="text-xl font-semibold mb-4">Ubicación</h2>
              <div className="bg-muted rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{property.direccion}</p>
                    <p className="text-muted-foreground">
                      {property.ciudad}, {property.provincia}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Contactanos para coordinar una visita y conocer la ubicación exacta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Contact Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Contact Card */}
              <Card className="shadow-lg border-2">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-3">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-lg">Sigma Inmobiliaria</h3>
                    <p className="text-sm text-muted-foreground">Tu inmobiliaria de confianza</p>
                  </div>

                  {sent ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Consulta enviada</h3>
                      <p className="text-sm text-muted-foreground">
                        Nos pondremos en contacto a la brevedad para coordinar una visita.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre completo *</Label>
                        <Input
                          id="nombre"
                          required
                          placeholder="Tu nombre"
                          value={contactForm.nombre}
                          onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="tu@email.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          placeholder="+54 9 11 1234-5678"
                          value={contactForm.telefono}
                          onChange={(e) => setContactForm({ ...contactForm, telefono: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mensaje">Mensaje</Label>
                        <Textarea
                          id="mensaje"
                          rows={3}
                          placeholder="Hola, me interesa esta propiedad..."
                          value={contactForm.mensaje}
                          onChange={(e) => setContactForm({ ...contactForm, mensaje: e.target.value })}
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 text-base" disabled={isSending}>
                        {isSending ? "Enviando..." : "Enviar consulta"}
                      </Button>
                    </form>
                  )}

                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-center">O contactanos directamente</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        className="w-full bg-transparent"
                        onClick={() => window.open("tel:+5493586103333", "_self")}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Llamar
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full bg-transparent"
                        onClick={() => window.open("https://wa.me/5493586103333", "_blank")}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Visit CTA */}
              <Card className="bg-foreground text-background">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Agendá una visita</h3>
                  <p className="text-sm opacity-80 mb-4">
                    Coordinamos un horario para que conozcas la propiedad personalmente.
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => window.open(`https://wa.me/5493586103333?text=${encodeURIComponent(`Hola! Me interesa agendar una visita para la propiedad en ${property.direccion}, ${property.ciudad}. ¿Podrían indicarme horarios disponibles?`)}`, "_blank")}
                  >
                    Solicitar visita
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 mt-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="font-semibold">Sigma Inmobiliaria</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Sigma Inmobiliaria. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {isLightboxOpen && hasImages && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <span className="text-white/80 text-sm">
              {currentImageIndex + 1} / {sortedImages.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="h-full flex items-center justify-center p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 text-white hover:bg-white/20 h-12 w-12"
              onClick={() => setCurrentImageIndex((i) => (i === 0 ? sortedImages.length - 1 : i - 1))}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <div className="relative max-w-5xl max-h-[80vh] w-full h-full">
              <Image
                src={sortedImages[currentImageIndex].url || "/placeholder.svg"}
                alt={sortedImages[currentImageIndex].description || property.direccion}
                fill
                className="object-contain"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 text-white hover:bg-white/20 h-12 w-12"
              onClick={() => setCurrentImageIndex((i) => (i === sortedImages.length - 1 ? 0 : i + 1))}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>

          {/* Thumbnails */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-2">
            {sortedImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setCurrentImageIndex(idx)}
                className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                  idx === currentImageIndex
                    ? "border-white scale-110"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={img.url || "/placeholder.svg"} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
