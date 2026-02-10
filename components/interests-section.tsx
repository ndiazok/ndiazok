import { Sprout, BarChart3, Map } from "lucide-react"

const interests = [
  {
    icon: Sprout,
    title: "Precision Agriculture",
    description:
      "Leveraging technology to optimize farming practices and improve crop yields through data-driven insights.",
  },
  {
    icon: BarChart3,
    title: "Database Management",
    description:
      "Designing and managing agricultural and urban databases for efficient data storage, retrieval, and analysis.",
  },
  {
    icon: Map,
    title: "Geographic Information Systems",
    description:
      "Using GIS tools like QGIS and SAGA to visualize, analyze, and interpret spatial data for informed decision-making.",
  },
]

export function InterestsSection() {
  return (
    <section id="interests" aria-label="Interests">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-primary">
        Interests
      </h2>
      <div className="flex flex-col gap-4">
        {interests.map((interest) => (
          <div
            key={interest.title}
            className="group flex gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <interest.icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium text-foreground">
                {interest.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {interest.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
