'use client'

import { useScrollReveal, useTextReveal } from '../animations/GSAPProvider'

const services = [
  {
    number: '01',
    title: 'AI Agent Development',
    description:
      'Custom autonomous agents that handle complex workflows — from customer interactions to internal operations. Built to think, adapt, and execute.',
    capabilities: ['Conversational AI', 'Task Automation', 'Multi-Agent Systems', 'Voice Assistants'],
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 24C8 20 11.6 17 16 17C20.4 17 24 20 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M22 8L26 4M26 4V7M26 4H23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Strategy Consulting',
    description:
      'We map your operations, identify high-impact AI opportunities, and build a roadmap that delivers measurable ROI — not just buzzwords.',
    capabilities: ['AI Readiness Assessment', 'ROI Modeling', 'Technology Roadmap', 'Change Management'],
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 24L12 16L18 20L28 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 8H28V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'AI Integration',
    description:
      'Seamlessly embed AI capabilities into your existing tech stack. We connect models, APIs, and data pipelines so intelligence flows through every process.',
    capabilities: ['API Integration', 'Data Pipeline Design', 'LLM Orchestration', 'Legacy System Modernization'],
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="18" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="4" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="18" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 9H18M9 14V18M23 14V18M14 23H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Custom Development',
    description:
      'Full-stack engineering for AI-native products. From MVPs to enterprise platforms, we build software that puts intelligence at its core.',
    capabilities: ['SaaS Development', 'AI-Powered Apps', 'Cloud Architecture', 'Performance Engineering'],
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M12 8L4 16L12 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 8L28 16L20 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 4L14 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Services() {
  const titleRef = useTextReveal()
  const cardsRef = useScrollReveal({ stagger: 0.15, y: 80 })

  return (
    <section id="services" className="relative py-32 lg:py-40">
      {/* Section bg accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-eden-sage/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div ref={titleRef} className="mb-20 lg:mb-28">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-12 bg-eden-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-eden-gold">What We Do</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-light tracking-tight text-eden-deep max-w-3xl">
            <span className="split-line">
              <span className="split-line-inner">AI solutions designed to</span>
            </span>
            <span className="split-line">
              <span className="split-line-inner font-normal text-gradient-eden">take root and flourish</span>
            </span>
          </h2>
        </div>

        {/* Service cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service) => (
            <div
              key={service.number}
              className="service-card group relative rounded-2xl border border-eden-sage/15 bg-eden-white p-8 lg:p-10 hover:border-eden-green/20"
            >
              {/* Number */}
              <div className="flex items-start justify-between mb-8">
                <span className="text-xs tracking-widest text-eden-stone/40">{service.number}</span>
                <div className="text-eden-green/60 group-hover:text-eden-green transition-colors duration-500">
                  {service.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-2xl lg:text-3xl font-light text-eden-deep mb-4 tracking-tight">
                {service.title}
              </h3>
              <p className="text-eden-stone leading-relaxed mb-8">
                {service.description}
              </p>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-2">
                {service.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded-full border border-eden-sage/20 px-3 py-1 text-xs text-eden-green/70 tracking-wide"
                  >
                    {cap}
                  </span>
                ))}
              </div>

              {/* Hover accent line */}
              <div className="absolute bottom-0 left-8 right-8 h-px bg-eden-green scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
