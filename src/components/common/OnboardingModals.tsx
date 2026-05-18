'use client'

import { useEffect, useState } from 'react'
import { useLanguage, Lang } from '@/contexts/LanguageContext'
import { useAuth, ContentPreference } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const LANGS: { lang: Lang; flag: string; label: string }[] = [
  { lang: 'pt', flag: '🇧🇷', label: 'Português' },
  { lang: 'en', flag: '🇺🇸', label: 'English' },
  { lang: 'es', flag: '🇪🇸', label: 'Español' },
]

const SPORTS: { value: ContentPreference; icon: string; label: string }[] = [
  { value: 'futebol',  icon: '⚽', label: 'Futebol' },
  { value: 'basquete', icon: '🏀', label: 'Basquete' },
  { value: 'hibrido',  icon: '🎮', label: 'Híbrido' },
]

type Step = 'lang' | 'sport' | 'done'

export default function OnboardingModals() {
  const { setLang } = useLanguage()
  const { user, updatePreference } = useAuth()
  const [step, setStep] = useState<Step>('done')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const hasLang = localStorage.getItem('futzone_lang')
    const hasSport = localStorage.getItem('futzone_sport')
    if (!hasLang) setStep('lang')
    else if (!hasSport) setStep('sport')

    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url)
    })
  }, [])

  function selectLang(lang: Lang) {
    setLang(lang)
    // Transition to sport step
    setAnimating(true)
    setTimeout(() => {
      setStep('sport')
      setAnimating(false)
    }, 250)
  }

  async function selectSport(pref: ContentPreference) {
    localStorage.setItem('futzone_sport', pref)
    if (user) {
      await updatePreference(pref)
    }
    setAnimating(true)
    setTimeout(() => setStep('done'), 250)
  }

  if (step === 'done') return null

  const overlayStyle = {
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  }

  const modalStyle = {
    background: 'rgba(18, 18, 28, 0.55)',
    backdropFilter: 'blur(48px) saturate(180%)',
    WebkitBackdropFilter: 'blur(48px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
    opacity: animating ? 0 : 1,
    transform: animating ? 'scale(0.97)' : 'scale(1)',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
  }

  const btnBase: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  }
  const btnHover: React.CSSProperties = {
    background: 'rgba(249,115,22,0.15)',
    border: '1px solid rgba(249,115,22,0.5)',
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" style={overlayStyle} />

      <div className="relative w-full max-w-xl rounded-3xl p-8 shadow-2xl" style={modalStyle}>

        {/* Logo */}
        <div className="flex justify-center mb-7">
          {logoUrl ? (
            <img src={logoUrl} alt="FutZone" style={{ height: 48, width: 'auto', maxWidth: 180, objectFit: 'contain' }} />
          ) : (
            <div className="h-12 w-32 rounded-lg bg-white/5" />
          )}
        </div>

        {/* Título */}
        <p className="text-center text-gray-400 text-sm mb-5">
          {step === 'lang' ? 'Escolha seu idioma' : 'O que você quer assistir?'}
        </p>

        {/* Opções */}
        <div className="flex items-center justify-center gap-4">
          {step === 'lang' && LANGS.map(({ lang, flag, label }) => (
            <button
              key={lang}
              onClick={() => selectLang(lang)}
              className="flex flex-col items-center gap-3 flex-1 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={btnBase}
              onMouseEnter={e => Object.assign(e.currentTarget.style, btnHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, btnBase)}
            >
              <span style={{ fontSize: 48, lineHeight: 1 }}>{flag}</span>
              <span className="text-white font-bold text-sm">{label}</span>
            </button>
          ))}

          {step === 'sport' && SPORTS.map(({ value, icon, label }) => (
            <button
              key={value}
              onClick={() => selectSport(value)}
              className="flex flex-col items-center gap-3 flex-1 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={btnBase}
              onMouseEnter={e => Object.assign(e.currentTarget.style, btnHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, btnBase)}
            >
              <span style={{ fontSize: 48, lineHeight: 1 }}>{icon}</span>
              <span className="text-white font-bold text-sm">{label}</span>
            </button>
          ))}
        </div>

        {/* Indicador de passo */}
        <div className="flex justify-center gap-2 mt-7">
          <span className={`w-2 h-2 rounded-full transition-all ${step === 'lang' ? 'bg-orange-500 w-5' : 'bg-white/20'}`} />
          <span className={`w-2 h-2 rounded-full transition-all ${step === 'sport' ? 'bg-orange-500 w-5' : 'bg-white/20'}`} />
        </div>
      </div>
    </div>
  )
}
