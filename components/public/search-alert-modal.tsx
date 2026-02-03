"use client"

import type React from "react"

import { useState } from "react"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SearchAlertModalProps {
  currentFilters: {
    operacion?: string
    tipo?: string
    ciudad?: string
    dormitorios?: string
    precioMin?: string
    precioMax?: string
  }
}

export function SearchAlertModal({ currentFilters }: SearchAlertModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [nombre, setNombre] = useState("")
  const [frecuencia, setFrecuencia] = useState("diaria")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/public/search-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          nombre,
          frecuencia,
          operacion: currentFilters.operacion,
          tipo: currentFilters.tipo,
          ciudad: currentFilters.ciudad,
          dormitorios_min: currentFilters.dormitorios ? Number.parseInt(currentFilters.dormitorios) : null,
          precio_min: currentFilters.precioMin ? Number.parseInt(currentFilters.precioMin) : null,
          precio_max: currentFilters.precioMax ? Number.parseInt(currentFilters.precioMax) : null,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
          setEmail("")
          setNombre("")
        }, 2000)
      }
    } catch (error) {
      console.error("Error creating alert:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasFilters = currentFilters ? Object.values(currentFilters).some((v) => v && v !== "todas") : false

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Crear alerta</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Alerta creada</h3>
            <p className="text-muted-foreground">
              Te avisaremos cuando haya propiedades que coincidan con tu búsqueda.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Crear alerta de búsqueda</DialogTitle>
              <DialogDescription>
                Te notificaremos cuando haya nuevas propiedades que coincidan con tus criterios de búsqueda.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {hasFilters && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-2">Criterios actuales:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {currentFilters.operacion && currentFilters.operacion !== "todas" && (
                      <li>Operación: {currentFilters.operacion}</li>
                    )}
                    {currentFilters.tipo && <li>Tipo: {currentFilters.tipo}</li>}
                    {currentFilters.ciudad && <li>Ciudad: {currentFilters.ciudad}</li>}
                    {currentFilters.dormitorios && <li>Dormitorios: {currentFilters.dormitorios}+</li>}
                    {(currentFilters.precioMin || currentFilters.precioMax) && (
                      <li>
                        Precio: {currentFilters.precioMin || "0"} - {currentFilters.precioMax || "sin límite"}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre (opcional)</Label>
                <Input id="nombre" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frecuencia">Frecuencia de notificación</Label>
                <Select value={frecuencia} onValueChange={setFrecuencia}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inmediata">Inmediata</SelectItem>
                    <SelectItem value="diaria">Diaria</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear alerta"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
