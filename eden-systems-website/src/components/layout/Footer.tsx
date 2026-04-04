'use client'

import { useScrollReveal } from '../animations/GSAPProvider'

const footerLinks = {
  services: [
    { label: 'AI Agent Development', href: '#services' },
    { label: 'Strategy Consulting', href: '#services' },
    { label: 'AI Integration', href: '#services' },
    { label: 'Custom Development', href: '#services' },
  ],
  company: [
    { label: 'About', href: '#process' },
    { label: 'Case Studies', href: '#case-studies' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Contact', href: '#contact' },
  ],
  connect: [
    { label: 'LinkedIn', href: '#' },
    { label: 'Twitter / X', href: '#' },
    { label: 'GitHub', href: '#' },
  ],
}

export default function Footer() {
  const revealRef = useScrollReveal({ stagger: 0.1 })

  return (
    <footer className="bg-eden-forest text-eden-cream/80">
      {/* Top divider */}
      <div className="h-px bg-eden-green/20" />

      <div className="mx-auto max-w-7xl px-6 lg:px-12 py-20 lg:py-28">
        <div ref={revealRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-6">
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
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
                <line x1="24" y1="18" x2="24" y2="38" stroke="#C8A951" strokeWidth="1.5" opacity="0.6" />
              </svg>
              <span className="text-sm font-light tracking-[0.25em] uppercase text-eden-cream">
                EDEN Systems
              </span>
            </div>
            <p className="text-sm leading-relaxed text-eden-cream/50 max-w-xs">
              Cultivating intelligent solutions that grow with your business. Based in the future, built for today.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] uppercase text-eden-gold mb-6">
              Services
            </h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-eden-cream/50 hover:text-eden-cream transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] uppercase text-eden-gold mb-6">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-eden-cream/50 hover:text-eden-cream transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] uppercase text-eden-gold mb-6">
              Connect
            </h4>
            <ul className="space-y-3">
              {footerLinks.connect.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-eden-cream/50 hover:text-eden-cream transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a
                href="mailto:hello@edensystems.io"
                className="text-sm text-eden-cream/50 hover:text-eden-cream transition-colors duration-300"
              >
                hello@edensystems.io
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-20 pt-8 border-t border-eden-green/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-eden-cream/30">
            &copy; {new Date().getFullYear()} EDEN Systems AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-eden-cream/30 hover:text-eden-cream/60 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-eden-cream/30 hover:text-eden-cream/60 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
