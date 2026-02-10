export function AboutSection() {
  return (
    <section id="about" aria-label="About me">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
        About
      </h2>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          My work focuses on{" "}
          <span className="font-medium text-foreground">
            precision agriculture
          </span>{" "}
          and the management of{" "}
          <span className="font-medium text-foreground">
            agricultural and urban databases
          </span>
          . I use diverse technologies and programming languages to develop
          solutions that bring real value to the field.
        </p>
        <p>
          Currently studying at{" "}
          <span className="font-medium text-foreground">
            Universidad Nacional de Rio Cuarto
          </span>{" "}
          and{" "}
          <span className="font-medium text-foreground">
            Instituto Tecnologico Rio Cuarto
          </span>
          , while collaborating with the{" "}
          <span className="font-medium text-foreground">
            Ministerio de Educacion de Cordoba
          </span>
          .
        </p>
        <p>
          I enjoy working across the full stack, from building interactive web
          interfaces to designing database schemas and integrating geographic
          information systems into practical workflows.
        </p>
      </div>
    </section>
  )
}
