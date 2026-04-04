'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Work', href: '#case-studies' },
  { label: 'Testimonials', href: '#testimonials' },
]

export default function Navigation() {
  const navRef = useRef<HTMLElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!navRef.current) return
    gsap.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 1.8, ease: 'power3.out' }
    )
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setMobileOpen(false)
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 opacity-0 ${
          isScrolled
            ? 'bg-eden-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(45,90,61,0.1)]'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 group">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none" className="transition-transform duration-500 group-hover:rotate-12">
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
              <span className={`text-sm font-light tracking-[0.25em] uppercase transition-colors duration-300 ${
                isScrolled ? 'text-eden-deep' : 'text-eden-deep'
              }`}>
                EDEN Systems
              </span>
            </a>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`animated-underline text-sm tracking-wide transition-colors duration-300 ${
                    isScrolled
                      ? 'text-eden-deep/70 hover:text-eden-deep'
                      : 'text-eden-deep/70 hover:text-eden-deep'
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, '#contact')}
                className="ml-4 inline-flex items-center gap-2 rounded-full bg-eden-green px-6 py-2.5 text-sm text-eden-white tracking-wide transition-all duration-300 hover:bg-eden-deep hover:shadow-lg hover:shadow-eden-green/20"
              >
                Book a Call
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2"
              aria-label="Toggle menu"
            >
              <span className={`block h-px w-6 bg-eden-deep transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[3.5px]' : ''}`} />
              <span className={`block h-px w-6 bg-eden-deep transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[3.5px]' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[99] bg-eden-white transition-all duration-500 md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-3xl font-light text-eden-deep tracking-wide"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-eden-green px-8 py-3 text-eden-white tracking-wide"
          >
            Book a Call
          </a>
        </div>
      </div>
    </>
  )
}
