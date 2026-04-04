'use client'

const words = [
  'AI Agents',
  'Strategy',
  'Automation',
  'Intelligence',
  'Integration',
  'Innovation',
  'Growth',
  'Efficiency',
  'Transformation',
  'Excellence',
]

export default function Marquee() {
  return (
    <section className="py-8 bg-eden-forest overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...words, ...words].map((word, i) => (
          <span key={i} className="flex items-center">
            <span className="text-sm tracking-[0.3em] uppercase text-eden-cream/20 px-8">
              {word}
            </span>
            <span className="text-eden-gold/20 text-xs">&#x2726;</span>
          </span>
        ))}
      </div>
    </section>
  )
}
