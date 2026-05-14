'use client'

import { useEffect, useState } from 'react'
import { useLanguage, Lang } from '@/contexts/LanguageContext'

const options: { lang: Lang; flag: string; label: string }[] = [
  { lang: 'pt', flag: '🇧🇷', label: 'Português' },
  { lang: 'en', flag: '🇺🇸', label: 'English' },
  { lang: 'es', flag: '🇪🇸', label: 'Español' },
]

export default function LanguageSelectModal() {
  const { setLang } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('futzone_lang')
    if (!saved) setVisible(true)
  }, [])

  function select(lang: Lang) {
    setLang(lang)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Overlay com blur */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      />

      {/* Modal horizontal */}
      <div
        className="relative w-full max-w-xl rounded-3xl p-8 shadow-2xl"
        style={{
          background: 'rgba(18, 18, 28, 0.55)',
          backdropFilter: 'blur(48px) saturate(180%)',
          WebkitBackdropFilter: 'blur(48px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="text-center mb-7">
          <h2 className="text-xl font-black text-white">Choose your language</h2>
          <p className="text-white/40 text-sm mt-1">Selecione o idioma / Elige el idioma</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          {options.map(({ lang, flag, label }) => (
            <button
              key={lang}
              onClick={() => select(lang)}
              className="flex flex-col items-center gap-3 flex-1 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.15)', e.currentTarget.style.border = '1px solid rgba(249,115,22,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)', e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)')}
            >
              <span style={{ fontSize: 48, lineHeight: 1 }}>{flag}</span>
              <span className="text-white font-bold text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
