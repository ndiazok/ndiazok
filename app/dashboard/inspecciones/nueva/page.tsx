"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"

interface Property {
  id: string
  direccion: string
  ciudad: string
  tipo: string
}

interface Collaborator {
  id: string
  full_name: string
  email: string
}

// Template de checklist por defecto
const defaultChecklist = [
  { categoria: "Cocina", nombre: "Estado de mesada", descripcion: "Verificar superficie, manchas, grietas" },
  { categoria: "Cocina", nombre: "Funcionamiento de hornallas", descripcion: "Probar cada hornalla" },
  { categoria: "Cocina", nombre: "Estado de horno", descripcion: "Verificar funcionamiento y limpieza" },
  { categoria: "Cocina", nombre: "Grifería", descripcion: "Verificar funcionamiento y pérdidas" },
  { categoria: "Baño", nombre: "Estado de sanitarios", descripcion: "Inodoro, bidet, lavatorio" },
  { categoria: "Baño", nombre: "Grifería", descripcion: "Verificar funcionamiento y pérdidas" },
  { categoria: "Baño", nombre: "Estado de ducha/bañera", descripcion: "Verificar funcionamiento y desagüe" },
  { categoria: "Baño", nombre: "Ventilación", descripcion: "Verificar extractor o ventana" },
  { categoria: "Electricidad", nombre: "Funcionamiento de llaves", descripcion: "Probar todas las llaves de luz" },
  { categoria: "Electricidad", nombre: "Estado de tomacorrientes", descripcion: "Verificar funcionamiento" },
  { categoria: "Electricidad", nombre: "Tablero eléctrico", descripcion: "Verificar estado y etiquetado" },
  { categoria: "Aberturas", nombre: "Puertas interiores", descripcion: "Verificar cierre y estado" },
  { categoria: "Aberturas", nombre: "Ventanas", descripcion: "Verificar cierre, vidrios y herrajes" },
  { categoria: "Aberturas", nombre: "Puerta de entrada", descripcion: "Verificar cerradura y estado" },
  { categoria: "Pisos", nombre: "Estado general de pisos", descripcion: "Verificar manchas, roturas, despegues" },
  { categoria: "Paredes", nombre: "Estado de pintura", descripcion: "Verificar manchas, descascarado, humedad" },
  { categoria: "General", nombre: "Limpieza general", descripcion: "Estado de limpieza del inmueble" },
  { categoria: "General", nombre: "Servicios", descripcion: "Verificar medidores de luz, gas, agua" },
]

export default function NuevaInspeccionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [checklist, setChecklist] = useState(defaultChecklist)

  const [formData, setFormData] = useState({
    propiedad_id: "",
    contrato_id: "",
    tipo: "entrada" as "entrada" | "salida" | "periodica",
    fecha_programada: new Date().toISOString().split("T")[0],
    hora_programada: "10:00",
    inspector_id: "",
    notas_previas: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesRes, collaboratorsRes] = await Promise.all([
          fetch("/api/admin/properties"),
          fetch("/api/admin/collaborators"),
        ])

        if (propertiesRes.ok) {
          const data = await propertiesRes.json()
          setProperties(Array.isArray(data) ? data : data.data || [])
        }

        if (collaboratorsRes.ok) {
          const data = await collaboratorsRes.json()
          setCollaborators(Array.isArray(data) ? data : data.data || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.propiedad_id) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          checklist_template: checklist,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/inspecciones/${data.id}`)
      }
    } catch (error) {
      console.error("Error creating inspection:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addChecklistItem = () => {
    setChecklist([...checklist, { categoria: "General", nombre: "", descripcion: "" }])
  }

  const removeChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index))
  }

  const updateChecklistItem = (index: number, field: string, value: string) => {
    const updated = [...checklist]
    updated[index] = { ...updated[index], [field]: value }
    setChecklist(updated)
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Inspección</h1>
          <p className="text-muted-foreground">Programa una nueva inspección de inmueble</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Inspección</CardTitle>
            <CardDescription>Información básica sobre la inspección</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Propiedad *</Label>
                <Select
                  value={formData.propiedad_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, propiedad_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.direccion}, {property.ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Inspección *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: "entrada" | "salida" | "periodica") =>
                    setFormData((prev) => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada (Inicio de contrato)</SelectItem>
                    <SelectItem value="salida">Salida (Fin de contrato)</SelectItem>
                    <SelectItem value="periodica">Periódica (Control rutinario)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha Programada *</Label>
                <Input
                  type="date"
                  value={formData.fecha_programada}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fecha_programada: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={formData.hora_programada}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hora_programada: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Inspector Asignado</Label>
                <Select
                  value={formData.inspector_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, inspector_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar inspector" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborators.map((collab) => (
                      <SelectItem key={collab.id} value={collab.id}>
                        {collab.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas Previas</Label>
              <Textarea
                value={formData.notas_previas}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notas_previas: e.target.value }))
                }
                placeholder="Instrucciones especiales, acceso, contacto del inquilino..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Checklist de Inspección</CardTitle>
                <CardDescription>
                  Items a verificar durante la inspección. Podés personalizar la lista.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <Checkbox checked className="mt-1" />
                  <div className="flex-1 grid gap-2 md:grid-cols-3">
                    <Input
                      placeholder="Categoría"
                      value={item.categoria}
                      onChange={(e) => updateChecklistItem(index, "categoria", e.target.value)}
                    />
                    <Input
                      placeholder="Nombre del item"
                      value={item.nombre}
                      onChange={(e) => updateChecklistItem(index, "nombre", e.target.value)}
                    />
                    <Input
                      placeholder="Descripción (opcional)"
                      value={item.descripcion}
                      onChange={(e) => updateChecklistItem(index, "descripcion", e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChecklistItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !formData.propiedad_id}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Inspección"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
