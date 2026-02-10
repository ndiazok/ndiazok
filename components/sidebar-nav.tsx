"use client"

import { useState, useEffect } from "react"

const navItems = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Interests", href: "#interests" },
  { label: "Contact", href: "#contact" },
]

export function SidebarNav() {
  const [activeSection, setActiveSection] = useState("about")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    )

    for (const item of navItems) {
      const el = document.querySelector(item.href)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <nav aria-label="Page sections" className="hidden lg:flex lg:flex-col lg:gap-1">
      {navItems.map((item) => {
        const isActive = activeSection === item.href.slice(1)
        return (
          <a
            key={item.label}
            href={item.href}
            className={`group flex items-center gap-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className={`block h-px transition-all ${
                isActive
                  ? "w-16 bg-foreground"
                  : "w-8 bg-muted-foreground group-hover:w-16 group-hover:bg-foreground"
              }`}
            />
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
