'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTextReveal } from '../animations/GSAPProvider'

gsap.registerPlugin(ScrollTrigger)

const testimonials = [
  {
    quote:
      "EDEN didn't just build us an AI system — they fundamentally changed how we think about our operations. The triage agent they developed has become indispensable to our emergency department.",
    author: 'Dr. Sarah Chen',
    role: 'Chief Medical Officer',
    company: 'Pacific Health Network',
  },
  {
    quote:
      "What sets EDEN apart is their depth of understanding. They spent weeks learning our business before writing a single line of code. The result was a solution that felt like it was built from the inside out.",
    author: 'Marcus Rivera',
    role: 'VP of Engineering',
    company: 'Nexus Financial Group',
  },
  {
    quote:
      "We've worked with several AI consultancies. EDEN is the only one that delivered on time, on budget, and above expectations. Their team operates with a rare combination of technical brilliance and genuine care.",
    author: 'Amara Okafor',
    role: 'CEO',
    company: 'Bloom Commerce',
  },
]

export default function Testimonials() {
  const titleRef = useTextReveal()
  const [active, setActive] = useState(0)
  const quoteRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    gsap.fromTo(
      sectionRef.current.querySelector('.testimonial-container'),
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      }
    )
  }, [])

  useEffect(() => {
    if (!quoteRef.current) return
    gsap.fromTo(
      quoteRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    )
  }, [active])

  // Auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="relative py-32 lg:py-40 bg-eden-forest overflow-hidden"
    >
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#B8C9A3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div ref={titleRef} className="mb-16 lg:mb-24 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-eden-gold/50" />
            <span className="text-xs tracking-[0.3em] uppercase text-eden-gold/70">Testimonials</span>
            <div className="h-px w-12 bg-eden-gold/50" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-eden-cream">
            <span className="split-line">
              <span className="split-line-inner">Trusted by teams</span>
            </span>
            <span className="split-line">
              <span className="split-line-inner text-eden-sage">building the future</span>
            </span>
          </h2>
        </div>

        {/* Testimonial card */}
        <div className="testimonial-container max-w-4xl mx-auto">
          <div ref={quoteRef} className="text-center">
            {/* Quote mark */}
            <div className="text-eden-gold/30 text-7xl font-serif leading-none mb-8">&ldquo;</div>

            <blockquote className="text-xl lg:text-2xl font-light leading-relaxed text-eden-cream/90 mb-10">
              {testimonials[active].quote}
            </blockquote>

            <div className="space-y-1">
              <p className="text-sm font-medium text-eden-cream tracking-wide">
                {testimonials[active].author}
              </p>
              <p className="text-xs text-eden-cream/40 tracking-widest uppercase">
                {testimonials[active].role}, {testimonials[active].company}
              </p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-3 mt-12">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`transition-all duration-500 rounded-full ${
                  i === active
                    ? 'w-8 h-2 bg-eden-gold'
                    : 'w-2 h-2 bg-eden-cream/20 hover:bg-eden-cream/40'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
