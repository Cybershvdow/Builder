'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 1.6 })

    // Badge
    tl.fromTo(
      badgeRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )

    // Heading lines
    const lines = headingRef.current?.querySelectorAll('.hero-line')
    if (lines) {
      tl.fromTo(
        lines,
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.2, stagger: 0.12, ease: 'power4.out' },
        '-=0.4'
      )
    }

    // Subtitle
    tl.fromTo(
      subRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
      '-=0.6'
    )

    // CTA
    tl.fromTo(
      ctaRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.5'
    )

    // Visual element
    tl.fromTo(
      visualRef.current,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' },
      '-=0.8'
    )

    // Scroll indicator
    tl.fromTo(
      scrollIndicatorRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6 },
      '-=0.2'
    )

    // Parallax on scroll
    if (sectionRef.current) {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          if (headingRef.current) {
            gsap.set(headingRef.current, { y: self.progress * 80 })
          }
          if (visualRef.current) {
            gsap.set(visualRef.current, { y: self.progress * -40 })
          }
        },
      })
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2D5A3D" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-eden-sage/10 blur-[120px]" />
      <div className="absolute -bottom-20 -left-32 w-[400px] h-[400px] rounded-full bg-eden-gold/8 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12 py-32 lg:py-0 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left - Content */}
          <div>
            {/* Badge */}
            <div ref={badgeRef} className="inline-flex items-center gap-2 rounded-full border border-eden-sage/30 bg-eden-cream/50 px-4 py-1.5 mb-8 opacity-0">
              <span className="h-1.5 w-1.5 rounded-full bg-eden-green animate-pulse" />
              <span className="text-xs tracking-widest uppercase text-eden-green/80">
                AI Consulting &amp; Development
              </span>
            </div>

            {/* Heading */}
            <h1 ref={headingRef} className="text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.05] tracking-tight text-eden-deep">
              <span className="split-line overflow-hidden block">
                <span className="hero-line block">Cultivating</span>
              </span>
              <span className="split-line overflow-hidden block">
                <span className="hero-line block text-gradient-eden font-normal">Intelligence</span>
              </span>
              <span className="split-line overflow-hidden block">
                <span className="hero-line block text-eden-deep/60">for Growth</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p ref={subRef} className="mt-8 text-lg lg:text-xl leading-relaxed text-eden-stone max-w-lg opacity-0">
              We design, build, and integrate AI systems that transform how businesses operate
              — from autonomous agents to enterprise-scale automation.
            </p>

            {/* CTA */}
            <div ref={ctaRef} className="mt-10 flex flex-wrap items-center gap-4 opacity-0">
              <a
                href="#contact"
                className="group inline-flex items-center gap-3 rounded-full bg-eden-green px-8 py-4 text-sm text-eden-white tracking-wide transition-all duration-500 hover:bg-eden-deep hover:shadow-xl hover:shadow-eden-green/15 hover:gap-4"
              >
                Start a Conversation
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
              <a
                href="#case-studies"
                className="inline-flex items-center gap-2 px-6 py-4 text-sm text-eden-deep/70 tracking-wide hover:text-eden-deep transition-colors duration-300"
              >
                View Our Work
              </a>
            </div>
          </div>

          {/* Right - Visual */}
          <div ref={visualRef} className="relative opacity-0 hidden lg:block">
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Animated rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-full h-full rounded-full border border-eden-sage/20 animate-[spin_30s_linear_infinite]" />
                <div className="absolute w-[85%] h-[85%] rounded-full border border-eden-sage/15 animate-[spin_25s_linear_infinite_reverse]" />
                <div className="absolute w-[70%] h-[70%] rounded-full border border-eden-gold/15 animate-[spin_20s_linear_infinite]" />
                <div className="absolute w-[55%] h-[55%] rounded-full border border-eden-sage/10 animate-[spin_15s_linear_infinite_reverse]" />
              </div>

              {/* Center element */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-eden-green to-eden-deep flex items-center justify-center shadow-2xl shadow-eden-green/20">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path
                        d="M24 4C24 4 8 12 8 28C8 36.837 15.163 44 24 44C32.837 44 40 36.837 40 28C40 12 24 4 24 4Z"
                        fill="#3A7A52"
                        opacity="0.9"
                      />
                      <path
                        d="M24 12C24 12 16 18 16 28C16 32.418 19.582 36 24 36C28.418 36 32 32.418 32 28C32 18 24 12 24 12Z"
                        fill="#4A9A66"
                        opacity="0.7"
                      />
                      <line x1="24" y1="16" x2="24" y2="40" stroke="#C8A951" strokeWidth="1.5" opacity="0.5" />
                    </svg>
                  </div>
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-full bg-eden-green/20 animate-ping" style={{ animationDuration: '3s' }} />
                </div>
              </div>

              {/* Floating nodes */}
              <div className="absolute top-[10%] left-[15%] w-3 h-3 rounded-full bg-eden-gold/60 animate-leaf-float" />
              <div className="absolute top-[20%] right-[12%] w-2 h-2 rounded-full bg-eden-green/40 animate-leaf-float" style={{ animationDelay: '1s' }} />
              <div className="absolute bottom-[25%] left-[10%] w-2.5 h-2.5 rounded-full bg-eden-sage/50 animate-leaf-float" style={{ animationDelay: '2s' }} />
              <div className="absolute bottom-[15%] right-[20%] w-2 h-2 rounded-full bg-eden-gold/40 animate-leaf-float" style={{ animationDelay: '3s' }} />

              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <line x1="60" y1="40" x2="200" y2="200" stroke="#B8C9A3" strokeWidth="0.5" opacity="0.3" />
                <line x1="340" y1="80" x2="200" y2="200" stroke="#C8A951" strokeWidth="0.5" opacity="0.2" />
                <line x1="40" y1="300" x2="200" y2="200" stroke="#B8C9A3" strokeWidth="0.5" opacity="0.2" />
                <line x1="320" y1="340" x2="200" y2="200" stroke="#B8C9A3" strokeWidth="0.5" opacity="0.3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div ref={scrollIndicatorRef} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0">
        <span className="text-[10px] tracking-[0.3em] uppercase text-eden-stone/50">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-eden-stone/30 to-transparent relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-eden-green animate-[slideDown_2s_ease-in-out_infinite]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(0%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </section>
  )
}
