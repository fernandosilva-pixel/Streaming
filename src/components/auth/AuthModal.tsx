'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { X, Eye, EyeOff } from 'lucide-react'

export default function AuthModal() {
  const { modalVisible, hideModal, modalInitialView, login, register } = useAuth()
  const [view, setView] = useState<'login' | 'register'>('login')
  const [phone, setPhone] = useState('')
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
      setPhone('')
      setPassword('')
      setName('')
      setError('')
      setShowPass(false)
    }
  }, [modalVisible])

  if (!modalVisible) return null

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  function switchView(v: 'login' | 'register') {
    setView(v)
    setError('')
    setPassword('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim() || !password) return
    setLoading(true)
    setError('')
    const ok = await login(phone, password)
    setLoading(false)
    if (!ok) setError('Telefone ou senha incorretos.')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      await register(name.trim(), phone, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // font-size 16px prevents iOS Safari from auto-zooming on input focus
  const inputClass = "w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
  const inputStyle = { fontSize: '16px' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={hideModal}
      />

      {/* Modal — liquid glass */}
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
        {/* Close */}
        <button
          onClick={hideModal}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex justify-center pt-1 pb-1">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              width={160}
              height={40}
              style={{ height: 40, width: 'auto', maxWidth: 160, maxHeight: 40, objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <div className="h-10 w-28 rounded-lg bg-white/5" />
          )}
        </div>

        {view === 'login' ? (
          <>
            <div className="text-center">
              <h2 className="text-xl font-black text-white">Entrar</h2>
              <p className="text-white/40 text-sm mt-1">Acesse para assistir aos jogos ao vivo</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  required
                  autoFocus
                  placeholder="(11) 99999-9999"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              <div>
                <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`${inputClass} pr-11`}
                    style={{
                      ...inputStyle,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all mt-1"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => switchView('register')}
                className="text-white/40 text-sm hover:text-white transition-colors"
              >
                Não tem conta? <span className="text-orange-500 font-semibold">Criar agora</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-xl font-black text-white">Criar conta</h2>
              <p className="text-white/40 text-sm mt-1">Cadastre-se para assistir aos jogos ao vivo</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">Usuário (Apelido)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Como quer ser chamado"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              <div>
                <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  required
                  placeholder="(11) 99999-9999"
                  className={inputClass}
                  style={{
                    ...inputStyle,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              <div>
                <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`${inputClass} pr-11`}
                    style={{
                      ...inputStyle,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all mt-1"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => switchView('login')}
                className="text-white/40 text-sm hover:text-white transition-colors"
              >
                Já tem conta? <span className="text-orange-500 font-semibold">Entrar</span>
              </button>
            </div>
          </>
        )}

        <p className="text-white/20 text-xs text-center">
          Ao continuar você concorda com os termos de uso
        </p>
      </div>
    </div>
  )
}
