'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTextReveal } from '../animations/GSAPProvider'

gsap.registerPlugin(ScrollTrigger)

const caseStudies = [
  {
    tag: 'Healthcare',
    title: 'Autonomous Patient Triage System',
    description:
      'Built an AI-powered triage agent that reduced emergency department wait times by 40% and improved patient routing accuracy to 94%.',
    metrics: [
      { value: '40%', label: 'Faster Triage' },
      { value: '94%', label: 'Routing Accuracy' },
      { value: '3x', label: 'Throughput Increase' },
    ],
    color: 'from-eden-green/20 to-eden-sage/10',
    accentColor: 'bg-eden-green',
  },
  {
    tag: 'Financial Services',
    title: 'Intelligent Document Processing Pipeline',
    description:
      'Designed and deployed an AI system that processes 50,000+ financial documents monthly with 99.2% accuracy, replacing a team of 12 manual reviewers.',
    metrics: [
      { value: '50K+', label: 'Docs / Month' },
      { value: '99.2%', label: 'Accuracy Rate' },
      { value: '$2.1M', label: 'Annual Savings' },
    ],
    color: 'from-eden-gold/15 to-eden-cream',
    accentColor: 'bg-eden-gold',
  },
  {
    tag: 'E-Commerce',
    title: 'Conversational Commerce Agent',
    description:
      'Created a multi-modal AI shopping assistant that handles product discovery, recommendations, and checkout — increasing conversion rates by 28%.',
    metrics: [
      { value: '28%', label: 'Conversion Lift' },
      { value: '4.8/5', label: 'Customer Satisfaction' },
      { value: '65%', label: 'Support Deflection' },
    ],
    color: 'from-eden-sage/15 to-eden-mist',
    accentColor: 'bg-eden-green-light',
  },
]

export default function CaseStudies() {
  const titleRef = useTextReveal()
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardsRef.current) return

    const cards = cardsRef.current.querySelectorAll('.case-card')

    cards.forEach((card) => {
      gsap.fromTo(
        card,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      )

      // Parallax on the gradient bg
      const bg = card.querySelector('.case-bg')
      if (bg) {
        ScrollTrigger.create({
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            gsap.set(bg, { y: self.progress * 30 - 15 })
          },
        })
      }
    })
  }, [])

  return (
    <section id="case-studies" className="relative py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div ref={titleRef} className="mb-20 lg:mb-28">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-12 bg-eden-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-eden-gold">Selected Work</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-light tracking-tight text-eden-deep max-w-3xl">
            <span className="split-line">
              <span className="split-line-inner">Results that</span>
            </span>
            <span className="split-line">
              <span className="split-line-inner font-normal text-gradient-eden">speak for themselves</span>
            </span>
          </h2>
        </div>

        {/* Case study cards */}
        <div ref={cardsRef} className="space-y-8">
          {caseStudies.map((study, i) => (
            <div
              key={i}
              className="case-card group relative overflow-hidden rounded-2xl border border-eden-sage/10 bg-eden-white transition-all duration-700 hover:border-eden-green/15 hover:shadow-2xl hover:shadow-eden-green/5"
            >
              {/* Background gradient */}
              <div className={`case-bg absolute inset-0 bg-gradient-to-br ${study.color} opacity-40 transition-opacity duration-700 group-hover:opacity-60`} />

              <div className="relative p-8 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
                  {/* Content */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`h-1.5 w-1.5 rounded-full ${study.accentColor}`} />
                      <span className="text-xs tracking-[0.2em] uppercase text-eden-green/60">{study.tag}</span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-light text-eden-deep mb-4 tracking-tight leading-snug">
                      {study.title}
                    </h3>
                    <p className="text-eden-stone leading-relaxed max-w-xl">
                      {study.description}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="flex lg:flex-col gap-6 lg:gap-8">
                    {study.metrics.map((metric) => (
                      <div key={metric.label} className="text-center lg:text-right">
                        <div className="text-3xl lg:text-4xl font-light text-eden-deep tracking-tight">
                          {metric.value}
                        </div>
                        <div className="text-xs tracking-widest uppercase text-eden-stone/60 mt-1">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
