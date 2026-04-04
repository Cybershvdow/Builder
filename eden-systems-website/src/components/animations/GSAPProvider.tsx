'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useGSAP() {
  return { gsap, ScrollTrigger }
}

export function useScrollReveal(
  options: {
    y?: number
    opacity?: number
    duration?: number
    delay?: number
    stagger?: number
    ease?: string
  } = {}
) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const {
      y = 60,
      opacity = 0,
      duration = 1,
      delay = 0,
      stagger = 0.15,
      ease = 'power3.out',
    } = options

    const children = ref.current.children.length > 0 ? ref.current.children : [ref.current]

    gsap.set(children, { y, opacity })

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(children, {
          y: 0,
          opacity: 1,
          duration,
          delay,
          stagger,
          ease,
        })
      },
    })

    return () => trigger.kill()
  }, [options])

  return ref
}

export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        if (ref.current) {
          const yPos = self.progress * speed * 100 - (speed * 50)
          gsap.set(ref.current, { y: yPos })
        }
      },
    })

    return () => trigger.kill()
  }, [speed])

  return ref
}

export function useTextReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const lines = ref.current.querySelectorAll('.split-line-inner')
    if (lines.length === 0) return

    gsap.set(lines, { yPercent: 100 })

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(lines, {
          yPercent: 0,
          duration: 1.2,
          stagger: 0.1,
          ease: 'power4.out',
        })
      },
    })

    return () => trigger.kill()
  }, [])

  return ref
}

export default function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ScrollTrigger.refresh()
  }, [])

  return <>{children}</>
}
