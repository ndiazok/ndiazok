"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Trash2, Star, Loader2 } from "lucide-react"

interface Image {
  id: string
  url: string
  titulo?: string
  descripcion?: string
  es_principal: boolean
  orden: number
}

interface SortableImagesProps {
  images: Image[]
  propertyId: string
  onUpdate: () => void
}

function toggleCover(imageId: string, isCover: boolean) {
  // Placeholder function to toggle cover
}

export function SortableImages({ images, propertyId, onUpdate }: SortableImagesProps) {
  const [sortedImages, setSortedImages] = useState<Image[]>(images)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...sortedImages]
    const [draggedItem] = newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedItem)
    setSortedImages(newImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    setDraggedIndex(null)

    // Save new order to backend
    setSaving(true)
    try {
      const updates = sortedImages.map((img, idx) => ({
        id: img.id,
        orden: idx,
      }))

      await fetch(`/api/admin/properties/${propertyId}/images/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: updates }),
      })
      onUpdate()
    } catch (err) {
      console.error("Error saving order:", err)
    } finally {
      setSaving(false)
    }
  }

  const setCover = async (imageId: string) => {
    setSaving(true)
    try {
      await fetch(`/api/admin/properties/${propertyId}/images/${imageId}/cover`, {
        method: "PUT",
      })
      onUpdate()
    } catch (err) {
      console.error("Error setting cover:", err)
    } finally {
      setSaving(false)
    }
  }

  const deleteImage = async (imageId: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return
    setDeletingId(imageId)
    try {
      await fetch(`/api/admin/properties/${propertyId}/images?imageId=${imageId}`, {
        method: "DELETE",
      })
      setSortedImages((prev) => prev.filter((img) => img.id !== imageId))
      onUpdate()
    } catch (err) {
      console.error("Error deleting image:", err)
    } finally {
      setDeletingId(null)
    }
  }

  if (sortedImages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">No hay imágenes. Agregá una usando el botón arriba.</div>
    )
  }

  return (
    <div className="space-y-4">
      {saving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando cambios...
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedImages.map((image, index) => (
          <Card
            key={image.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group cursor-move transition-all ${
              draggedIndex === index ? "opacity-50 scale-95" : ""
            } ${image.es_principal ? "ring-2 ring-primary" : ""}`}
          >
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
              <img
                src={image.url || "/placeholder.svg"}
                alt={image.titulo || image.descripcion || "Imagen de propiedad"}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant={image.es_principal ? "default" : "secondary"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCover(image.id)}
                  title={image.es_principal ? "Es la portada actual" : "Establecer como portada"}
                >
                  <Star className={`h-4 w-4 ${image.es_principal ? "fill-current" : ""}`} />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteImage(image.id)}
                  disabled={deletingId === image.id}
                >
                  {deletingId === image.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="absolute top-2 left-2 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
              </div>
              {image.es_principal && (
                <Badge className="absolute top-2 right-2" variant="default">
                  Portada
                </Badge>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs text-muted-foreground truncate">{image.titulo || image.descripcion || `Imagen ${index + 1}`}</p>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Arrastrá las imágenes para reordenarlas. La primera será la principal en el listado.
      </p>
    </div>
  )
}
