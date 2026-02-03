import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ServicesSection } from "@/components/services-section"
import { WhyChooseUs } from "@/components/why-choose-us"
import { FeaturedProperties } from "@/components/featured-properties"
import { ClientPortal } from "@/components/client-portal"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ServicesSection />
      <FeaturedProperties />
      <WhyChooseUs />
      <ClientPortal />
      <ContactSection />
      <Footer />
    </main>
  )
}
