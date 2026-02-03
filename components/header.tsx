"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">Σ</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tight text-foreground leading-none">Sigma</span>
              <span className="text-[10px] text-muted-foreground tracking-wide">INMOBILIARIA</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#servicios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Servicios
            </Link>
            <Link href="#propiedades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Propiedades
            </Link>
            <Link href="#nosotros" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Por qué Sigma
            </Link>
            <Link href="#clientes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Portal Clientes
            </Link>
            <Link href="#contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contacto
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Ingresar
              </Button>
            </Link>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Phone className="w-4 h-4 mr-2" />
              Contactar
            </Button>
          </div>

          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link href="#servicios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Servicios
              </Link>
              <Link
                href="#propiedades"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Propiedades
              </Link>
              <Link href="#nosotros" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Por qué Sigma
              </Link>
              <Link href="#clientes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Portal Clientes
              </Link>
              <Link href="#contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contacto
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="justify-start text-muted-foreground w-full">
                    Ingresar
                  </Button>
                </Link>
                <Button size="sm" className="bg-primary text-primary-foreground">
                  <Phone className="w-4 h-4 mr-2" />
                  Contactar
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
