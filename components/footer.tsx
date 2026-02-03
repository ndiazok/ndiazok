import Link from "next/link"
import { Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-12 lg:py-16 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">Σ</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-lg tracking-tight text-foreground leading-none">Sigma</span>
                <span className="text-[10px] text-muted-foreground tracking-wide">INMOBILIARIA</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Venta, alquiler y administración de inmuebles en Río Cuarto y zona. Más de 15 años de experiencia.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Servicios</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#servicios"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Venta de propiedades
                </Link>
              </li>
              <li>
                <Link
                  href="#servicios"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Alquiler
                </Link>
              </li>
              <li>
                <Link
                  href="#servicios"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Administración de inmuebles
                </Link>
              </li>
              <li>
                <Link
                  href="#servicios"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tasaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Accesos</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#propiedades"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Propiedades
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Portal de clientes
                </Link>
              </li>
              <li>
                <Link
                  href="#nosotros"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Quiénes somos
                </Link>
              </li>
              <li>
                <Link
                  href="#contacto"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>25 de mayo 557, of. 1, Río Cuarto</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+54 358 6103333</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span>estudio@tamiozzoabogados.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2026 Sigma Inmobiliaria. Todos los derechos reservados.</p>
          <p className="text-xs text-muted-foreground">Matrícula CUCICBA Nº XXXX</p>
        </div>
      </div>
    </footer>
  )
}
