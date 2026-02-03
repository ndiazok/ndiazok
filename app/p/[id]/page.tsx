"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
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
  X,
  MessageCircle,
  Copy,
  QrCode,
  Download,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default function MicrositePage() {
  const { id } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [contactForm, setContactForm] = useState({ nombre: "", email: "", telefono: "", mensaje: "" })
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const micrositeUrl = typeof window !== "undefined" ? window.location.href : ""

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
    // TODO: Submit to API
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSent(true)
    setIsSending(false)
  }

  const nextImage = useCallback(() => {
    if (property?.images?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
    }
  }, [property?.images?.length])

  const prevImage = useCallback(() => {
    if (property?.images?.length) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
    }
  }, [property?.images?.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage()
      if (e.key === "ArrowLeft") prevImage()
      if (e.key === "Escape") setIsLightboxOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextImage, prevImage])

  const copyLink = async () => {
    await navigator.clipboard.writeText(micrositeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const text = property 
      ? `Mirá esta propiedad: ${property.direccion}, ${property.ciudad}. ${micrositeUrl}`
      : micrositeUrl
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(micrositeUrl)}`, "_blank")
  }

  const shareTwitter = () => {
    const text = property 
      ? `Mirá esta propiedad en ${property.ciudad}: ${property.direccion}`
      : "Mirá esta propiedad"
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(micrositeUrl)}&text=${encodeURIComponent(text)}`, "_blank")
  }

  const shareEmail = () => {
    const subject = property 
      ? `Propiedad en ${property.ciudad}: ${property.direccion}`
      : "Propiedad interesante"
    const body = property
      ? `Te comparto esta propiedad:\n\n${property.direccion}, ${property.ciudad}\n\n${micrositeUrl}`
      : micrositeUrl
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(micrositeUrl)}`

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando propiedad...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Propiedad no encontrada</h1>
          <p className="text-muted-foreground mb-4">Esta propiedad no existe o ya no está disponible</p>
          <Button asChild>
            <Link href="/propiedades">Ver otras propiedades</Link>
          </Button>
        </div>
      </div>
    )
  }

  const sortedImages = property.images?.length
    ? [...property.images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header con branding */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Sigma Inmobiliaria</span>
          </Link>
          <div className="flex items-center gap-2">
            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Share2 className="h-4 w-4" />
                  Compartir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compartir propiedad</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="redes" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="redes">Redes sociales</TabsTrigger>
                    <TabsTrigger value="qr">Código QR</TabsTrigger>
                  </TabsList>
                  <TabsContent value="redes" className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                      <Input value={micrositeUrl} readOnly className="text-sm" />
                      <Button size="sm" variant="outline" onClick={copyLink}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="gap-2 justify-start bg-transparent" onClick={shareWhatsApp}>
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        WhatsApp
                      </Button>
                      <Button variant="outline" className="gap-2 justify-start bg-transparent" onClick={shareFacebook}>
                        <Facebook className="h-4 w-4 text-blue-600" />
                        Facebook
                      </Button>
                      <Button variant="outline" className="gap-2 justify-start bg-transparent" onClick={shareTwitter}>
                        <Twitter className="h-4 w-4 text-sky-500" />
                        Twitter
                      </Button>
                      <Button variant="outline" className="gap-2 justify-start bg-transparent" onClick={shareEmail}>
                        <Mail className="h-4 w-4 text-gray-600" />
                        Email
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="qr" className="mt-4">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-white rounded-lg border">
                        <Image src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" width={200} height={200} />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Escaneá el código QR para ver esta propiedad en tu celular
                      </p>
                      <Button variant="outline" className="gap-2 bg-transparent" asChild>
                        <a href={qrCodeUrl} download={`propiedad-${property.id}.png`}>
                          <Download className="h-4 w-4" />
                          Descargar QR
                        </a>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Button size="sm" className="gap-2" asChild>
              <a href="#contacto">
                <Phone className="h-4 w-4" />
                Contactar
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero con galería */}
      <section className="relative">
        {sortedImages.length > 0 ? (
          <div className="relative h-[50vh] md:h-[60vh] bg-black">
            <Image
              src={sortedImages[currentImageIndex]?.url || "/placeholder.svg"}
              alt={sortedImages[currentImageIndex]?.description || property.direccion}
              fill
              className="object-contain cursor-pointer"
              onClick={() => setIsLightboxOpen(true)}
              priority
            />
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {sortedImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? "bg-white w-6" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              {property.en_venta && (
                <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                  Venta
                </Badge>
              )}
              {property.en_alquiler && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Alquiler
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[40vh] bg-muted flex items-center justify-center">
            <Building2 className="h-24 w-24 text-muted-foreground" />
          </div>
        )}

        {/* Thumbnails */}
        {sortedImages.length > 1 && (
          <div className="container mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sortedImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img.url || "/placeholder.svg"} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Info principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                <span>{property.ciudad}, {property.provincia}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{property.direccion}</h1>
              <div className="flex flex-wrap gap-4 text-lg">
                {property.en_venta && property.precio_venta && (
                  <div className="font-bold text-2xl text-primary">
                    {formatPrice(property.precio_venta, property.moneda_venta)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">venta</span>
                  </div>
                )}
                {property.en_alquiler && property.precio_alquiler && (
                  <div className="font-bold text-2xl">
                    {formatPrice(property.precio_alquiler, property.moneda_alquiler)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">/mes</span>
                  </div>
                )}
              </div>
            </div>

            {/* Características principales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {property.ambientes && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{property.ambientes}</div>
                    <div className="text-sm text-muted-foreground">Ambientes</div>
                  </CardContent>
                </Card>
              )}
              {property.dormitorios && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Bed className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{property.dormitorios}</div>
                    <div className="text-sm text-muted-foreground">Dormitorios</div>
                  </CardContent>
                </Card>
              )}
              {property.banos && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Bath className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{property.banos}</div>
                    <div className="text-sm text-muted-foreground">Baños</div>
                  </CardContent>
                </Card>
              )}
              {property.metros_cuadrados && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Square className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{property.metros_cuadrados}</div>
                    <div className="text-sm text-muted-foreground">m²</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Descripción */}
            {property.descripcion_publica && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Descripción</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {property.descripcion_publica}
                </p>
              </div>
            )}

            {/* Características adicionales */}
            {property.caracteristicas && property.caracteristicas.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Características</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.caracteristicas.map((car, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{car}</span>
                    </div>
                  ))}
                  {property.cochera && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Cochera</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detalles adicionales */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Detalles</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium capitalize">{property.tipo}</span>
                </div>
                {property.metros_cuadrados && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Superficie</span>
                    <span className="font-medium">{property.metros_cuadrados} m²</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar con contacto */}
          <div className="space-y-6">
            <Card className="sticky top-24" id="contacto">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sigma Inmobiliaria</h3>
                    <p className="text-sm text-muted-foreground">Consultá por esta propiedad</p>
                  </div>
                </div>

                {sent ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Consulta enviada</h3>
                    <p className="text-muted-foreground text-sm">
                      Nos comunicaremos a la brevedad
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={contactForm.nombre}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, nombre: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={contactForm.telefono}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, telefono: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mensaje">Mensaje</Label>
                      <Textarea
                        id="mensaje"
                        rows={3}
                        value={contactForm.mensaje}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, mensaje: e.target.value }))}
                        placeholder={`Hola, me interesa la propiedad en ${property.direccion}`}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSending}>
                      {isSending ? "Enviando..." : "Enviar consulta"}
                    </Button>
                  </form>
                )}

                <Separator className="my-6" />

                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 bg-transparent"
                    onClick={() => window.open("tel:+5493586103333", "_self")}
                  >
                    <Phone className="h-4 w-4" />
                    Llamar ahora
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
                    onClick={() => window.open(`https://wa.me/5493586103333?text=${encodeURIComponent(
                      `Hola! Me interesa la propiedad en ${property.direccion}, ${property.ciudad}. ${micrositeUrl}`
                    )}`, "_blank")}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card compartir */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Compartir esta propiedad</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={shareWhatsApp} className="flex-1 bg-transparent">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={shareFacebook} className="flex-1 bg-transparent">
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={shareTwitter} className="flex-1 bg-transparent">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={copyLink} className="flex-1 bg-transparent">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Sigma Inmobiliaria</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Venta, alquiler y administración de propiedades
            </p>
            <Button variant="link" asChild>
              <Link href="/propiedades">Ver más propiedades</Link>
            </Button>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {isLightboxOpen && sortedImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="h-8 w-8" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
          >
            <ChevronLeft className="h-12 w-12" />
          </button>
          <Image
            src={sortedImages[currentImageIndex]?.url || "/placeholder.svg"}
            alt={sortedImages[currentImageIndex]?.description || ""}
            width={1200}
            height={800}
            className="max-h-[90vh] w-auto object-contain"
          />
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
          >
            <ChevronRight className="h-12 w-12" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {currentImageIndex + 1} / {sortedImages.length}
          </div>
        </div>
      )}
    </div>
  )
}
