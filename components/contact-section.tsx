"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react"

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    type: "venta",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Form submitted:", formData)
  }

  return (
    <section id="contacto" className="py-20 lg:py-28 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contacto</span>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Hablemos de tu próxima operación
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Dejanos tus datos y un asesor se comunicará con vos en menos de 24 horas. También podés visitarnos en
              nuestra oficina o llamarnos directamente.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Oficina</p>
                  <p className="text-muted-foreground">25 de mayo 557, of. 1</p>
                  <p className="text-muted-foreground">CP 5800, Río Cuarto</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Teléfono</p>
                  <p className="text-muted-foreground">+54 358 6103333</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-muted-foreground">estudio@tamiozzoabogados.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Horario de atención</p>
                  <p className="text-muted-foreground">Lunes a Viernes: 9:00 - 15:00</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-6 lg:p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6">Envianos tu consulta</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-foreground mb-1.5 block">
                  Nombre completo
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-foreground mb-1.5 block">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="text-sm font-medium text-foreground mb-1.5 block">
                    Teléfono
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 358 6013333"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo de consulta</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "venta", label: "Quiero vender" },
                    { value: "compra", label: "Quiero comprar" },
                    { value: "alquiler", label: "Alquiler" },
                    { value: "administracion", label: "Administración" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: option.value })}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        formData.type === option.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="text-sm font-medium text-foreground mb-1.5 block">
                  Mensaje
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Contanos sobre tu propiedad o qué estás buscando..."
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Enviar consulta
                <Send className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
