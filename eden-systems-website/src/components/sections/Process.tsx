'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTextReveal } from '../animations/GSAPProvider'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    number: '01',
    title: 'Discover',
    subtitle: 'Understanding your landscape',
    description:
      'We immerse ourselves in your business — mapping workflows, identifying friction points, and uncovering where AI can create the most impact. No assumptions, just deep listening.',
    duration: '1-2 weeks',
  },
  {
    number: '02',
    title: 'Design',
    subtitle: 'Architecting the solution',
    description:
      'We craft a tailored AI strategy and technical architecture. Every decision is rooted in your specific context — your data, your team, your goals.',
    duration: '2-3 weeks',
  },
  {
    number: '03',
    title: 'Develop',
    subtitle: 'Building with precision',
    description:
      'Our engineers build in focused sprints, delivering working components you can test and validate. We iterate based on real feedback, not guesswork.',
    duration: '4-12 weeks',
  },
  {
    number: '04',
    title: 'Deploy & Evolve',
    subtitle: 'Growing together',
    description:
      'Launch is just the beginning. We monitor, optimize, and evolve your AI systems as your business grows — ensuring they compound value over time.',
    duration: 'Ongoing',
  },
]

export default function Process() {
  const titleRef = useTextReveal()
  const timelineRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!timelineRef.current || !progressRef.current) return

    const cards = timelineRef.current.querySelectorAll('.process-card')

    // Animate progress line
    ScrollTrigger.create({
      trigger: timelineRef.current,
      start: 'top 60%',
      end: 'bottom 40%',
      scrub: true,
      onUpdate: (self) => {
        if (progressRef.current) {
          gsap.set(progressRef.current, { scaleY: self.progress })
        }
      },
    })

    // Animate each card
    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { x: i % 2 === 0 ? -60 : 60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      )
    })
  }, [])

  return (
    <section id="process" className="relative py-32 lg:py-40 bg-eden-cream/40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div ref={titleRef} className="mb-20 lg:mb-28 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-eden-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-eden-gold">How We Work</span>
            <div className="h-px w-12 bg-eden-gold" />
          </div>
          <h2 className="text-4xl lg:text-6xl font-light tracking-tight text-eden-deep">
            <span className="split-line">
              <span className="split-line-inner">From seed to</span>
            </span>
            <span className="split-line">
              <span className="split-line-inner font-normal text-gradient-eden">sustainable system</span>
            </span>
          </h2>
        </div>

        {/* Timeline */}
        <div ref={timelineRef} className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-eden-sage/20 -translate-x-1/2 hidden lg:block">
            <div
              ref={progressRef}
              className="absolute top-0 left-0 w-full bg-eden-green origin-top"
              style={{ height: '100%', transform: 'scaleY(0)' }}
            />
          </div>

          <div className="space-y-12 lg:space-y-24">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`process-card relative lg:grid lg:grid-cols-2 lg:gap-20 items-center ${
                  i % 2 === 0 ? '' : 'lg:direction-rtl'
                }`}
              >
                {/* Dot on timeline */}
                <div className="absolute left-1/2 top-8 -translate-x-1/2 hidden lg:flex items-center justify-center z-10">
                  <div className="w-4 h-4 rounded-full bg-eden-green border-4 border-eden-cream" />
                </div>

                {/* Content */}
                <div className={`${i % 2 === 0 ? 'lg:text-right lg:pr-20' : 'lg:col-start-2 lg:pl-20'}`}>
                  <div className={`${i % 2 === 0 ? 'lg:ml-auto' : ''} max-w-md`}>
                    <div className={`flex items-center gap-3 mb-4 ${i % 2 === 0 ? 'lg:justify-end' : ''}`}>
                      <span className="text-xs tracking-widest text-eden-gold">{step.number}</span>
                      <span className="text-xs tracking-widest uppercase text-eden-stone/50">{step.duration}</span>
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-light text-eden-deep mb-2 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-eden-green/70 mb-4 tracking-wide">{step.subtitle}</p>
                    <p className="text-eden-stone leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Empty column for layout */}
                {i % 2 === 0 ? <div className="hidden lg:block" /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
