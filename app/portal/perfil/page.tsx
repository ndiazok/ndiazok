"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User, Mail, Phone, MapPin, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  domicilio_real: string | null
  domicilio_ciudad: string | null
  domicilio_provincia: string | null
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  // Form state
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [domicilioReal, setDomicilioReal] = useState("")
  const [domicilioCiudad, setDomicilioCiudad] = useState("")
  const [domicilioProvincia, setDomicilioProvincia] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (data) {
        setProfile(data)
        setFullName(data.full_name || "")
        setPhone(data.phone || "")
        setDomicilioReal(data.domicilio_real || "")
        setDomicilioCiudad(data.domicilio_ciudad || "")
        setDomicilioProvincia(data.domicilio_provincia || "")
      }

      setIsLoading(false)
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    setMessage("")

    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        domicilio_real: domicilioReal,
        domicilio_ciudad: domicilioCiudad,
        domicilio_provincia: domicilioProvincia,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    if (error) {
      setMessage("Error al guardar los cambios")
    } else {
      setMessage("Cambios guardados correctamente")
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi Perfil</h1>
        <p className="text-muted-foreground">Actualizá tu información personal</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información personal</CardTitle>
          <CardDescription>Estos datos se utilizan para la gestión de tus contratos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input id="email" value={profile?.email || ""} disabled className="bg-muted" />
            </div>
            <p className="text-xs text-muted-foreground">El email no puede modificarse</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domicilio</CardTitle>
          <CardDescription>Tu domicilio real o fiscal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domicilioReal">Dirección</Label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input
                id="domicilioReal"
                value={domicilioReal}
                onChange={(e) => setDomicilioReal(e.target.value)}
                placeholder="Calle y número"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domicilioCiudad">Ciudad</Label>
              <Input
                id="domicilioCiudad"
                value={domicilioCiudad}
                onChange={(e) => setDomicilioCiudad(e.target.value)}
                placeholder="Ciudad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domicilioProvincia">Provincia</Label>
              <Input
                id="domicilioProvincia"
                value={domicilioProvincia}
                onChange={(e) => setDomicilioProvincia(e.target.value)}
                placeholder="Provincia"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {message && (
        <p className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>{message}</p>
      )}

      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  )
}
