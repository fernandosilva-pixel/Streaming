'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage, Lang } from '@/contexts/LanguageContext'
import { useAuth, ContentPreference } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const LANGS: { lang: Lang; flag: string; label: string }[] = [
  { lang: 'pt', flag: '🇧🇷', label: 'Português' },
  { lang: 'en', flag: '🇺🇸', label: 'English' },
  { lang: 'es', flag: '🇪🇸', label: 'Español' },
]

const SPORTS: { value: ContentPreference; icon: string; labelKey: 'sportFutebol' | 'sportBasquete' | 'sportLuta' }[] = [
  { value: 'futebol',  icon: '⚽', labelKey: 'sportFutebol' },
  { value: 'basquete', icon: '🏀', labelKey: 'sportBasquete' },
  { value: 'luta',     icon: '🥊', labelKey: 'sportLuta' },
]

type Step = 'lang' | 'sport' | 'plan' | 'done'

export default function OnboardingModals() {
  const router = useRouter()
  const { setLang, t, lang } = useLanguage()
  const { user, showModal, updatePreference } = useAuth()
  const [step, setStep] = useState<Step>('done')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [animating, setAnimating] = useState(false)
  const [usdRate, setUsdRate] = useState<number | null>(null)

  useEffect(() => {
    if (step !== 'plan' || lang === 'pt') return
    fetch('https://open.er-api.com/v6/latest/BRL')
      .then(r => r.json())
      .then(data => { if (data?.rates?.USD) setUsdRate(data.rates.USD) })
      .catch(() => {})
  }, [step, lang])

  useEffect(() => {
    const hasLang = localStorage.getItem('futzone_lang')
    const hasSport = localStorage.getItem('futzone_sport')
    const hasPlan = localStorage.getItem('futzone_plan_seen')
    if (!hasLang) setStep('lang')
    else if (!hasSport) setStep('sport')
    else if (!hasPlan) setStep('plan')

    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url)
    })
  }, [])

  function transition(next: Step) {
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 250)
  }

  function selectLang(lang: Lang) {
    setLang(lang)
    transition('sport')
  }

  async function selectSport(pref: ContentPreference) {
    localStorage.setItem('futzone_sport', pref)
    if (user) await updatePreference(pref)
    transition('plan')
  }

  // Quando o usuário faz login/cadastro após clicar num plano, redireciona pro /perfil
  useEffect(() => {
    if (!user) return
    const intent = localStorage.getItem('futzone_plan_intent')
    if (intent === 'semanal' || intent === 'mensal') {
      localStorage.removeItem('futzone_plan_intent')
      router.push('/perfil')
    }
  }, [user])

  function selectPlan(type: 'semanal' | 'mensal' | 'free') {
    localStorage.setItem('futzone_plan_seen', '1')
    transition('done')
    if (type !== 'free') {
      if (user) {
        setTimeout(() => router.push('/perfil'), 300)
      } else {
        localStorage.setItem('futzone_plan_intent', type)
        setTimeout(() => showModal('register'), 300)
      }
    }
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

  const steps: Step[] = ['lang', 'sport', 'plan']

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
          {step === 'lang' ? t('chooseLang') : step === 'sport' ? t('whatToWatch') : 'Escolha seu plano'}
        </p>

        {/* Opções — lang */}
        {step === 'lang' && (
          <div className="flex items-center justify-center gap-4">
            {LANGS.map(({ lang, flag, label }) => (
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
          </div>
        )}

        {/* Opções — sport */}
        {step === 'sport' && (
          <div className="flex items-center justify-center gap-4">
            {SPORTS.map(({ value, icon, labelKey }) => (
              <button
                key={value}
                onClick={() => selectSport(value)}
                className="flex flex-col items-center gap-3 flex-1 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={btnBase}
                onMouseEnter={e => Object.assign(e.currentTarget.style, btnHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, btnBase)}
              >
                <span style={{ fontSize: 48, lineHeight: 1 }}>{icon}</span>
                <span className="text-white font-bold text-sm">{t(labelKey)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Opções — plan */}
        {step === 'plan' && (() => {
          const usd = lang !== 'pt'
          function fmt(brl: number): string {
            if (!usd) return 'R$' + brl.toFixed(2).replace('.', ',')
            if (!usdRate) return '...'
            return '$' + (brl * usdRate).toFixed(2)
          }
          const fmtMensal = fmt(15.90)
          const fmtSemanal = fmt(7.90)
          return (
            <div className="flex flex-col gap-3">

              {/* Mensal — destaque */}
              <div className="relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="text-[11px] font-black text-white px-3 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#FF6A00,#FF8533)' }}>
                    {lang === 'en' ? 'MOST POPULAR' : lang === 'es' ? 'MÁS POPULAR' : 'MAIS POPULAR'}
                  </span>
                </div>
                <button
                  onClick={() => selectPlan('mensal')}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                  style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.45)' }}
                >
                  <div>
                    <p className="text-white font-black text-base">{lang === 'en' ? 'Monthly' : lang === 'es' ? 'Mensual' : 'Mensal'}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{lang === 'en' ? '30 days · access to all streams' : lang === 'es' ? '30 días · acceso a todas las transmisiones' : '30 dias · acesso a todas as transmissões'}</p>
                  </div>
                  <p className="text-orange-400 font-black text-xl shrink-0 ml-4">{fmtMensal}</p>
                </button>
              </div>

              {/* Semanal */}
              <button
                onClick={() => selectPlan('semanal')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                style={btnBase}
                onMouseEnter={e => Object.assign(e.currentTarget.style, btnHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, btnBase)}
              >
                <div>
                  <p className="text-white font-black text-base">{lang === 'en' ? 'Weekly' : lang === 'es' ? 'Semanal' : 'Semanal'}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{lang === 'en' ? '7 days · access to all streams' : lang === 'es' ? '7 días · acceso a todas las transmisiones' : '7 dias · acesso a todas as transmissões'}</p>
                </div>
                <p className="text-white font-black text-xl shrink-0 ml-4">{fmtSemanal}</p>
              </button>

              {/* Gratuito — centralizado */}
              <button
                onClick={() => selectPlan('free')}
                className="w-full flex flex-col items-center justify-center px-5 py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] text-center"
                style={btnBase}
                onMouseEnter={e => Object.assign(e.currentTarget.style, btnHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, btnBase)}
              >
                <p className="text-white font-black text-base">{lang === 'en' ? 'Free Plan' : lang === 'es' ? 'Plan Gratuito' : 'Plano Gratuito'}</p>
                <p className="text-gray-500 text-xs mt-0.5">{lang === 'en' ? 'Watch for free for a few minutes' : lang === 'es' ? 'Mira gratis por algunos minutos' : 'Assista gratuitamente por alguns minutos'}</p>
              </button>
            </div>
          )
        })()}

        {/* Indicador de passo */}
        <div className="flex justify-center gap-2 mt-7">
          {steps.map(s => (
            <span
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${step === s ? 'bg-orange-500 w-5' : 'bg-white/20 w-2'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
