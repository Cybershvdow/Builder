'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const stats = [
  { value: '50+', label: 'AI Systems Deployed' },
  { value: '98%', label: 'Client Retention' },
  { value: '$12M+', label: 'Client Savings Generated' },
  { value: '3x', label: 'Average ROI' },
]

export default function Stats() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const items = sectionRef.current.querySelectorAll('.stat-item')

    gsap.fromTo(
      items,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    )
  }, [])

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 border-y border-eden-sage/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-item text-center">
              <div className="text-4xl lg:text-5xl font-light text-eden-deep tracking-tight mb-2">
                {stat.value}
              </div>
              <div className="text-xs tracking-[0.2em] uppercase text-eden-stone/60">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
