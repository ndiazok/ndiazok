import { Mail, ArrowUpRight } from "lucide-react"

const contactLinks = [
  {
    label: "Email",
    value: "cnicolasdiaz@gmail.com",
    href: "mailto:cnicolasdiaz@gmail.com",
  },
  {
    label: "LinkedIn",
    value: "@ndiazok",
    href: "https://www.linkedin.com/in/ndiazok/",
  },
  {
    label: "GitHub",
    value: "@ndiazok",
    href: "https://github.com/ndiazok",
  },
  {
    label: "X / Twitter",
    value: "@ndiazOk",
    href: "https://x.com/ndiazOk",
  },
]

export function ContactSection() {
  return (
    <section id="contact" aria-label="Contact">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
        Contact
      </h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {"If you'd like to discuss a project or just say hi, feel free to reach out."}
      </p>
      <div className="flex flex-col gap-3">
        {contactLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-md border border-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              {link.label === "Email" && (
                <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              )}
              <div>
                <p className="text-xs text-muted-foreground">{link.label}</p>
                <p className="text-sm font-medium text-foreground">
                  {link.value}
                </p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
          </a>
        ))}
      </div>
    </section>
  )
}
