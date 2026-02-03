import { Shield, Clock, Users, Award } from "lucide-react"

const reasons = [
  {
    icon: Shield,
    title: "Transparencia total",
    description:
      "En tu portal personal accedés a la información de tu propiedad: operaciones documentadas, contratos, liquidaciones y más.",
  },
  {
    icon: Clock,
    title: "Respuesta rápida",
    description: "Atención personalizada y seguimiento constante. Resolvemos consultas en menos de 24 horas.",
  },
  {
    icon: Users,
    title: "Equipo profesional",
    description: "Corredores Públicos Inmobiliarios (CPI) matriculados, abogados y contadores. Un equipo completo para cada operación.",
  },
  {
    icon: Award,
    title: "Trayectoria comprobada",
    description: "Miles de operaciones cerradas al año y cientos de propiedades administradas con éxito.",
  },
]

export function WhyChooseUs() {
  return (
    <section id="nosotros" className="py-20 lg:py-28 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Por qué Sigma</span>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Una inmobiliaria que hace las cosas bien
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              En Sigma trabajamos con una mirada profesional y estructurada del mercado inmobiliario. Apostamos a la
              tecnología, a procesos claros y a un equipo capacitado para ofrecer una experiencia consistente y de
              calidad.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Ya sea para vender, comprar, alquilar o delegar la administración de tu propiedad, vas a encontrar un
              servicio ordenado, transparente y orientado a resultados, pensado para acompañarte en cada etapa de la
              operación.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {reasons.map((reason, i) => (
              <div key={i} className="bg-background border border-border rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <reason.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{reason.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
