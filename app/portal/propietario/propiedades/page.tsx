"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Building2, MapPin, Bed, Bath, Car } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Propiedad {
  id: string
  direccion: string
  ciudad: string
  provincia: string
  tipo: string
  dormitorios: number | null
  banos: number | null
  cochera: boolean | null
  estado: string
  en_alquiler: boolean
  en_venta: boolean
  en_administracion: boolean
  precio_alquiler: number | null
  precio_venta: number | null
  moneda_alquiler: string | null
  moneda_venta: string | null
  share_pct: number
}

export default function PropietarioPropiedades() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get properties where user is owner
      const { data: ownership } = await supabase
        .from("property_owners")
        .select(`
          share_pct,
          propiedades (
            id, direccion, ciudad, provincia, tipo,
            dormitorios, banos, cochera, estado,
            en_alquiler, en_venta, en_administracion,
            precio_alquiler, precio_venta, moneda_alquiler, moneda_venta
          )
        `)
        .eq("person_id", user.id)

      if (ownership) {
        const props = ownership.map((o) => ({
          ...(o.propiedades as any),
          share_pct: o.share_pct,
        }))
        setPropiedades(props)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mis Propiedades</h1>
        <p className="text-muted-foreground">
          {propiedades.length} propiedad{propiedades.length !== 1 ? "es" : ""} registrada
          {propiedades.length !== 1 ? "s" : ""}
        </p>
      </div>

      {propiedades.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tenés propiedades registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {propiedades.map((prop) => (
            <Link key={prop.id} href={`/portal/propietario/propiedades/${prop.id}`}>
              <Card className="hover:border-foreground transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{prop.direccion}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {prop.ciudad}, {prop.provincia}
                      </CardDescription>
                    </div>
                    {prop.share_pct < 100 && <Badge variant="outline">{prop.share_pct}%</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary">{prop.tipo}</Badge>
                    {prop.en_administracion && <Badge variant="outline">En administración</Badge>}
                    {prop.en_alquiler && (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En alquiler</Badge>
                    )}
                    {prop.en_venta && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">En venta</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {prop.dormitorios && (
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" />
                        {prop.dormitorios}
                      </span>
                    )}
                    {prop.banos && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" />
                        {prop.banos}
                      </span>
                    )}
                    {prop.cochera && (
                      <span className="flex items-center gap-1">
                        <Car className="h-3.5 w-3.5" />
                        Cochera
                      </span>
                    )}
                  </div>

                  {(prop.precio_alquiler || prop.precio_venta) && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      {prop.precio_alquiler && (
                        <p>
                          Alquiler:{" "}
                          <span className="font-medium">
                            {prop.moneda_alquiler === "USD" ? "USD " : "$ "}
                            {prop.precio_alquiler.toLocaleString("es-AR")}
                          </span>
                        </p>
                      )}
                      {prop.precio_venta && (
                        <p>
                          Venta:{" "}
                          <span className="font-medium">
                            {prop.moneda_venta === "USD" ? "USD " : "$ "}
                            {prop.precio_venta.toLocaleString("es-AR")}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
