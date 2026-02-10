const skillCategories = [
  {
    title: "Languages",
    skills: ["Python", "JavaScript", "HTML5", "CSS3", "Arduino"],
  },
  {
    title: "Databases",
    skills: ["MySQL", "PostgreSQL", "SQLite"],
  },
  {
    title: "Technologies",
    skills: ["GIS", "QGIS", "SAGA GIS", "Precision Ag"],
  },
]

export function SkillsSection() {
  return (
    <section id="skills" aria-label="Skills">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-primary">
        Skills
      </h2>
      <div className="flex flex-col gap-6">
        {skillCategories.map((category) => (
          <div key={category.title}>
            <h3 className="mb-3 text-sm font-medium text-foreground">
              {category.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
