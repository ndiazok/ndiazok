"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground text-balance leading-[1.1]">
            Comprá, vendé o alquilá con la tranquilidad de estar en buenas manos.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            En Sigma combinamos experiencia, transparencia y tecnología para brindarte el mejor servicio inmobiliario de
            Río Cuarto y zona.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#propiedades">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base">
                Ver propiedades
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="#contacto">
              <Button
                variant="outline"
                size="lg"
                className="px-8 h-12 text-base border-border text-foreground hover:bg-accent bg-transparent"
              >
                Quiero vender mi propiedad
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
