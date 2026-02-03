"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Propiedad {
  id: string
  direccion: string
  ciudad: string
}

const CATEGORIAS = [
  { value: "plomeria", label: "Plomería" },
  { value: "electricidad", label: "Electricidad" },
  { value: "gas", label: "Gas" },
  { value: "cerrajeria", label: "Cerrajería" },
  { value: "pintura", label: "Pintura" },
  { value: "humedad", label: "Humedad" },
  { value: "electrodomesticos", label: "Electrodomésticos" },
  { value: "estructura", label: "Estructura" },
  { value: "otro", label: "Otro" },
]

export default function NuevaReparacionPage() {
  const router = useRouter()
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    propiedad_id: "",
    titulo: "",
    descripcion: "",
    categoria: "",
    urgencia: "media",
  })

  useEffect(() => {
    fetchPropiedades()
  }, [])

  const fetchPropiedades = async () => {
    const res = await fetch("/api/admin/properties")
    if (res.ok) {
      const data = await res.json()
      setPropiedades(data)
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.propiedad_id || !form.titulo || !form.descripcion || !form.categoria) return

    setIsSubmitting(true)

    const res = await fetch("/api/admin/repairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/dashboard/reparaciones/${data.id}`)
    }

    setIsSubmitting(false)
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/reparaciones">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Nueva reparación</h1>
          <p className="text-muted-foreground">Registrar un nuevo caso técnico</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del caso</CardTitle>
          <CardDescription>Completá la información del problema a resolver</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propiedad">Propiedad *</Label>
              <Select
                value={form.propiedad_id}
                onValueChange={(v) => setForm({ ...form, propiedad_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar propiedad" />
                </SelectTrigger>
                <SelectContent>
                  {propiedades.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.direccion}, {p.ciudad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Ej: Pérdida de agua en baño principal"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(v) => setForm({ ...form, categoria: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urgencia</Label>
                <Select
                  value={form.urgencia}
                  onValueChange={(v) => setForm({ ...form, urgencia: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                placeholder="Describí el problema con el mayor detalle posible..."
                rows={5}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" asChild className="flex-1 bg-transparent">
                <Link href="/dashboard/reparaciones">Cancelar</Link>
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !form.propiedad_id || !form.titulo || !form.descripcion || !form.categoria}
              >
                {isSubmitting ? "Creando..." : "Crear caso"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
