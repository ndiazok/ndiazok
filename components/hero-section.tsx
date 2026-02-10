import { Github, Linkedin, Twitter, Mail } from "lucide-react"

const socialLinks = [
  {
    href: "https://github.com/ndiazok",
    icon: Github,
    label: "GitHub",
  },
  {
    href: "https://www.linkedin.com/in/ndiazok/",
    icon: Linkedin,
    label: "LinkedIn",
  },
  {
    href: "https://x.com/ndiazOk",
    icon: Twitter,
    label: "X / Twitter",
  },
  {
    href: "mailto:cnicolasdiaz@gmail.com",
    icon: Mail,
    label: "Email",
  },
]

export function HeroSection() {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
          Nicolas Diaz
        </h1>
        <p className="text-lg font-medium text-primary md:text-xl">
          Software Developer & Precision Agriculture
        </p>
      </div>

      <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
        I build innovative solutions at the intersection of software development
        and precision agriculture. Focused on GIS, data management, and
        creating tools that transform how we work with agricultural and urban
        databases.
      </p>

      <nav aria-label="Social links" className="flex items-center gap-4">
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label={link.label}
          >
            <link.icon className="h-5 w-5" />
            <span className="sr-only">{link.label}</span>
          </a>
        ))}
      </nav>
    </header>
  )
}
