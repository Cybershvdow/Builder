'use client'

import GSAPProvider from '@/components/animations/GSAPProvider'
import LoadingScreen from '@/components/animations/LoadingScreen'
import CursorGlow from '@/components/animations/CursorGlow'
import Navigation from '@/components/layout/Navigation'
import Hero from '@/components/sections/Hero'
import Stats from '@/components/sections/Stats'
import Services from '@/components/sections/Services'
import Process from '@/components/sections/Process'
import CaseStudies from '@/components/sections/CaseStudies'
import Marquee from '@/components/sections/Marquee'
import Testimonials from '@/components/sections/Testimonials'
import Contact from '@/components/sections/Contact'
import Footer from '@/components/layout/Footer'

export default function Home() {
  return (
    <GSAPProvider>
      <LoadingScreen />
      <CursorGlow />
      <Navigation />
      <main>
        <Hero />
        <Stats />
        <Services />
        <Process />
        <CaseStudies />
        <Marquee />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </GSAPProvider>
  )
}
