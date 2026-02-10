import { HeroSection } from "@/components/hero-section"
import { SidebarNav } from "@/components/sidebar-nav"
import { AboutSection } from "@/components/about-section"
import { SkillsSection } from "@/components/skills-section"
import { InterestsSection } from "@/components/interests-section"
import { ContactSection } from "@/components/contact-section"

export default function Home() {
  return (
    <div className="mx-auto min-h-screen max-w-screen-xl px-6 py-12 md:px-12 md:py-20 lg:px-24 lg:py-0">
      <div className="lg:flex lg:justify-between lg:gap-4">
        {/* Left Column - Sticky Header + Nav */}
        <header className="lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:w-1/2 lg:flex-col lg:justify-between lg:py-24">
          <div className="flex flex-col gap-10">
            <HeroSection />
            <SidebarNav />
          </div>
          <footer className="mt-8 hidden text-xs text-muted-foreground lg:block">
            <p>
              {"Built with Next.js and Tailwind CSS. Deployed on Vercel."}
            </p>
          </footer>
        </header>

        {/* Right Column - Content Sections */}
        <main className="flex flex-col gap-24 pt-16 lg:w-1/2 lg:py-24">
          <AboutSection />
          <SkillsSection />
          <InterestsSection />
          <ContactSection />
          <footer className="pb-8 text-xs text-muted-foreground lg:hidden">
            <p>
              {"Built with Next.js and Tailwind CSS. Deployed on Vercel."}
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
