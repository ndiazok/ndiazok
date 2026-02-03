"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, User, Home, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"

export function ClientPortal() {
  return (
    <section id="clientes" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Portal de clientes
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Toda la información de tu propiedad, siempre disponible
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Como cliente de Sigma, accedés a un portal exclusivo donde podés ver el estado de tus propiedades,
              liquidaciones mensuales, contratos y solicitar reparaciones.
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Liquidaciones en tiempo real</p>
                  <p className="text-sm text-muted-foreground">Consultá ingresos, gastos y saldos de cada mes.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Documentación centralizada</p>
                  <p className="text-sm text-muted-foreground">Contratos, recibos y comprobantes siempre a mano.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Home className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Seguimiento de reparaciones</p>
                  <p className="text-sm text-muted-foreground">Pedí arreglos y seguí el estado desde la app.</p>
                </div>
              </li>
            </ul>

            <div className="mt-8">
              <Link href="/auth/login">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Ingresar al portal
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Portal preview mockup */}
          <div className="bg-card border border-border rounded-xl shadow-2xl shadow-primary/5 overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="w-3 h-3 rounded-full bg-border" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-background px-4 py-1 rounded-md text-xs text-muted-foreground">
                  portal.sigmainmobiliaria.com
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">María García</p>
                  <p className="text-xs text-muted-foreground">Propietaria - 2 inmuebles</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-foreground">Av. Libertador 1420</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">Alquilado</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Próximo cobro: 1 Feb 2026</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Liquidación Enero</span>
                    <span className="font-medium text-foreground">$1.250.000</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-foreground">Gorriti 4521</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">Disponible</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Publicado hace 5 días</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Consultas recibidas</span>
                    <span className="font-medium text-foreground">12</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
