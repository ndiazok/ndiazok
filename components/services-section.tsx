import { Building2, KeyRound, Home, FileText, Wrench, BarChart3, Shield, Users, TrendingUp } from "lucide-react"

const services = [
  {
    category: "Venta de propiedades",
    icon: Building2,
    description: "Maximizamos el valor de tu propiedad con una estrategia de comercialización profesional.",
    features: [
      { icon: TrendingUp, text: "Tasación de mercado precisa" },
      { icon: Users, text: "Red de compradores calificados" },
      { icon: FileText, text: "Asesoramiento legal completo" },
      { icon: Shield, text: "Operaciones seguras y transparentes" },
    ],
  },
  {
    category: "Alquiler",
    icon: KeyRound,
    description: "Conectamos propietarios con inquilinos verificados. Gestión integral del proceso.",
    features: [
      { icon: Users, text: "Verificación de antecedentes" },
      { icon: FileText, text: "Contratos ajustados a ley" },
      { icon: Shield, text: "Garantías y seguros" },
      { icon: BarChart3, text: "Ajustes por ICL/IPC automáticos" },
    ],
  },
  {
    category: "Administración de inmuebles",
    icon: Home,
    description: "Tu propiedad en las mejores manos. Nos ocupamos de todo para que vos no te preocupes.",
    features: [
      { icon: BarChart3, text: "Liquidaciones mensuales claras" },
      { icon: Wrench, text: "Gestión de reparaciones" },
      { icon: FileText, text: "Cobranza de alquileres" },
      { icon: Shield, text: "Portal online para seguimiento" },
    ],
  },
]

export function ServicesSection() {
  return (
    <section id="servicios" className="py-20 lg:py-28 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Nuestros servicios</span>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Soluciones inmobiliarias integrales
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Más de 15 años acompañando a propietarios e inquilinos en cada etapa.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <div
              key={i}
              className="bg-background border border-border rounded-xl p-8 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <service.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">{service.category}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{service.description}</p>

              <ul className="mt-6 space-y-3">
                {service.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm">
                    <feature.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
