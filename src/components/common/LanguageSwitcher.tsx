'use client'

import { useState, useEffect } from 'react'
import { useLanguage, Lang } from '@/contexts/LanguageContext'

const langLabels: Record<Lang, { flag: string; label: string }> = {
  pt: { flag: '🇧🇷', label: 'PT' },
  en: { flag: '🇺🇸', label: 'EN' },
  es: { flag: '🇪🇸', label: 'ES' },
}

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [open])

  return (
    <div className="flex justify-center" onClick={e => e.stopPropagation()}>
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all hover:opacity-80"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.38)',
          }}
        >
          <span className="text-sm leading-none">{langLabels[lang].flag}</span>
          <span>{langLabels[lang].label}</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 rounded-2xl overflow-hidden z-50 min-w-[96px]"
            style={{
              background: 'rgba(8,15,28,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {(Object.entries(langLabels) as [Lang, { flag: string; label: string }][]).map(([code, { flag, label }]) => (
              <button
                key={code}
                onClick={() => { setLang(code); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors"
                style={{
                  color: lang === code ? '#E30613' : 'rgba(255,255,255,0.55)',
                  background: lang === code ? 'rgba(227,6,19,0.07)' : 'transparent',
                }}
              >
                <span className="text-sm">{flag}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
