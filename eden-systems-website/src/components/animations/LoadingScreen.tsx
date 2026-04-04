'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

export default function LoadingScreen() {
  const screenRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => setIsVisible(false),
    })

    tl.to(logoRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'power2.out',
    })
      .to(logoRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.4,
        delay: 0.5,
        ease: 'power2.in',
      })
      .to(screenRef.current, {
        yPercent: -100,
        duration: 0.8,
        ease: 'power4.inOut',
      })
  }, [])

  if (!isVisible) return null

  return (
    <div ref={screenRef} className="loader-screen">
      <div ref={logoRef} className="opacity-0 scale-105 text-center">
        <div className="flex items-center gap-3">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="animate-leaf-float">
            <path
              d="M24 4C24 4 8 12 8 28C8 36.837 15.163 44 24 44C32.837 44 40 36.837 40 28C40 12 24 4 24 4Z"
              fill="#2D5A3D"
              opacity="0.9"
            />
            <path
              d="M24 12C24 12 16 18 16 28C16 32.418 19.582 36 24 36C28.418 36 32 32.418 32 28C32 18 24 12 24 12Z"
              fill="#3A7A52"
              opacity="0.7"
            />
            <line x1="24" y1="18" x2="24" y2="38" stroke="#C8A951" strokeWidth="1.5" opacity="0.6" />
          </svg>
          <span className="text-eden-cream text-2xl font-light tracking-[0.2em] uppercase">
            EDEN
          </span>
        </div>
      </div>
    </div>
  )
}
