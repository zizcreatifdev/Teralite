'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  reponse: string
}

export default function FaqAccordion({ faqs }: { faqs: FAQItem[] }) {
  const [ouvert, setOuvert] = useState<string | null>(null)

  return (
    <div className="divide-y divide-border-main border border-border-main rounded-xl overflow-hidden bg-white">
      {faqs.map((faq) => (
        <div key={faq.id}>
          <button
            onClick={() => setOuvert(ouvert === faq.id ? null : faq.id)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-fond/50 transition-colors"
          >
            <span className="text-sm font-medium text-text-main pr-4 leading-snug">
              {faq.question}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-text-light flex-shrink-0 transition-transform duration-200 ${
                ouvert === faq.id ? 'rotate-180' : ''
              }`}
            />
          </button>
          {ouvert === faq.id && (
            <div className="px-5 pb-4">
              <p className="text-sm text-text-mid leading-relaxed">{faq.reponse}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
