'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTextReveal } from '../animations/GSAPProvider'

gsap.registerPlugin(ScrollTrigger)

export default function Contact() {
  const titleRef = useTextReveal()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return

    const elements = contentRef.current.querySelectorAll('.contact-reveal')

    gsap.fromTo(
      elements,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: contentRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      }
    )
  }, [])

  return (
    <section id="contact" className="relative py-32 lg:py-40 bg-eden-cream/40 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-eden-sage/5 blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-eden-gold/5 blur-[80px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div ref={titleRef} className="mb-16 lg:mb-24 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-eden-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-eden-gold">Get Started</span>
            <div className="h-px w-12 bg-eden-gold" />
          </div>
          <h2 className="text-4xl lg:text-6xl font-light tracking-tight text-eden-deep">
            <span className="split-line">
              <span className="split-line-inner">Ready to cultivate</span>
            </span>
            <span className="split-line">
              <span className="split-line-inner font-normal text-gradient-eden">something extraordinary?</span>
            </span>
          </h2>
        </div>

        <div ref={contentRef} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left - CTA */}
            <div className="contact-reveal">
              <h3 className="text-2xl font-light text-eden-deep mb-4 tracking-tight">
                Book a Discovery Call
              </h3>
              <p className="text-eden-stone leading-relaxed mb-8">
                30 minutes to explore how AI can transform your business.
                No pitch decks, no pressure — just an honest conversation about
                what&apos;s possible.
              </p>

              {/* Calendly placeholder button */}
              <a
                href="https://calendly.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-eden-green px-8 py-4 text-sm text-eden-white tracking-wide transition-all duration-500 hover:bg-eden-deep hover:shadow-xl hover:shadow-eden-green/15 hover:gap-4"
              >
                Schedule a Call
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transition-transform duration-500 group-hover:translate-x-1"
                >
                  <path d="M1 8H15M15 8L8 1M15 8L8 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>

              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3 text-sm text-eden-stone/70">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3 2.7L6 10L2.7 6.7" stroke="#2D5A3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Free 30-minute consultation
                </div>
                <div className="flex items-center gap-3 text-sm text-eden-stone/70">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3 2.7L6 10L2.7 6.7" stroke="#2D5A3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Custom AI opportunity assessment
                </div>
                <div className="flex items-center gap-3 text-sm text-eden-stone/70">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3 2.7L6 10L2.7 6.7" stroke="#2D5A3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  No commitment required
                </div>
              </div>
            </div>

            {/* Right - Contact form */}
            <div className="contact-reveal">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-xs tracking-[0.15em] uppercase text-eden-stone/60 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-eden-sage/30 pb-3 text-eden-deep placeholder-eden-stone/30 focus:border-eden-green focus:outline-none transition-colors duration-300"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-[0.15em] uppercase text-eden-stone/60 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-transparent border-b border-eden-sage/30 pb-3 text-eden-deep placeholder-eden-stone/30 focus:border-eden-green focus:outline-none transition-colors duration-300"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-[0.15em] uppercase text-eden-stone/60 mb-2">
                    Tell us about your project
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-transparent border-b border-eden-sage/30 pb-3 text-eden-deep placeholder-eden-stone/30 focus:border-eden-green focus:outline-none transition-colors duration-300 resize-none"
                    placeholder="What challenge are you looking to solve?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full border border-eden-green py-4 text-sm text-eden-green tracking-wide transition-all duration-500 hover:bg-eden-green hover:text-eden-white"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
