'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { X, Eye, EyeOff } from 'lucide-react'

export default function AuthModal() {
  const { modalVisible, hideModal, modalInitialView, login, register } = useAuth()
  const { t } = useLanguage()
  const [view, setView] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url)
    })
  }, [])

  useEffect(() => {
    if (modalVisible) {
      setView(modalInitialView)
      setEmail('')
      setPassword('')
      setName('')
      setError('')
      setShowPass(false)
    }
  }, [modalVisible])

  if (!modalVisible) return null

  function switchView(v: 'login' | 'register') {
    setView(v)
    setError('')
    setPassword('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    const ok = await login(email, password)
    setLoading(false)
    if (!ok) setError(t('wrongCredentials'))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      await register(name.trim(), email, password)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'email_taken') setError(t('emailAlreadyUsed'))
      else if (msg.startsWith('supabase:')) setError(msg.replace('supabase:', ''))
      else setError(t('wrongCredentials'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
  const inputStyle = { fontSize: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={hideModal}
      />
      <div
        className="relative w-full max-w-sm rounded-3xl p-7 space-y-5 shadow-2xl overflow-y-auto max-h-[90svh]"
        style={{
          background: 'rgba(18, 18, 28, 0.55)',
          backdropFilter: 'blur(48px) saturate(180%)',
          WebkitBackdropFilter: 'blur(48px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <button onClick={hideModal} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center pt-1 pb-1">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: 40, width: 'auto', maxWidth: 160, objectFit: 'contain', display: 'block' }} />
          ) : (
            <div className="h-10 w-28 rounded-lg bg-white/5" />
          )}
        </div>

        {view === 'login' ? (
          <>
            <div className="text-center">
              <h2 className="text-xl font-black text-white">{t('loginTitle')}</h2>
              <p className="text-white/40 text-sm mt-1">{t('loginSubtitle')}</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">{t('emailLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder={t('emailPlaceholder')}
                  className={inputClass}
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">{t('passwordLabel')}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder={t('passwordPlaceholder')}
                    className={`${inputClass} pr-11`}
                    style={inputStyle}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all mt-1">
                {loading ? t('signingIn') : t('loginTitle')}
              </button>
            </form>
            <div className="text-center">
              <button onClick={() => switchView('register')} className="text-white/40 text-sm hover:text-white transition-colors">
                {t('noAccount')} <span className="text-orange-500 font-semibold">{t('createNow')}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-xl font-black text-white">{t('registerTitle')}</h2>
              <p className="text-white/40 text-sm mt-1">{t('registerSubtitle')}</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">{t('nicknameLabel')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                  placeholder={t('nicknamePlaceholder')}
                  className={inputClass}
                  style={inputStyle}
                  autoComplete="nickname"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">{t('emailLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={t('emailPlaceholder')}
                  className={inputClass}
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">{t('passwordLabel')}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder={t('passwordPlaceholder')}
                    className={`${inputClass} pr-11`}
                    style={inputStyle}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all mt-1">
                {loading ? t('creatingAccount') : t('registerTitle')}
              </button>
            </form>
            <div className="text-center">
              <button onClick={() => switchView('login')} className="text-white/40 text-sm hover:text-white transition-colors">
                {t('alreadyHaveAccount')} <span className="text-orange-500 font-semibold">{t('enterNow')}</span>
              </button>
            </div>
          </>
        )}

        <p className="text-white/20 text-xs text-center">{t('terms')}</p>
      </div>
    </div>
  )
}
