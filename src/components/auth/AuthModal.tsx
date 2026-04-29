'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { X, Eye, EyeOff } from 'lucide-react'

export default function AuthModal() {
  const { modalVisible, hideModal, login, register } = useAuth()
  const [view, setView] = useState<'login' | 'register'>('login')

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={hideModal} />

      <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-5 shadow-2xl">
        <button
          onClick={hideModal}
          className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {view === 'login' ? (
          <>
            <div>
              <h2 className="text-xl font-black text-white">Entrar</h2>
              <p className="text-gray-500 text-sm mt-1">Acesse para assistir aos jogos ao vivo</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  required
                  autoFocus
                  placeholder="(11) 99999-9999"
                  className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => switchView('register')}
                className="text-gray-400 text-sm hover:text-white transition-colors"
              >
                Não tem conta? <span className="text-orange-500 font-semibold">Criar agora</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-black text-white">Criar conta</h2>
              <p className="text-gray-500 text-sm mt-1">Cadastre-se para assistir aos jogos ao vivo</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Seu nome"
                  className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  required
                  placeholder="(11) 99999-9999"
                  className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => switchView('login')}
                className="text-gray-400 text-sm hover:text-white transition-colors"
              >
                Já tem conta? <span className="text-orange-500 font-semibold">Entrar</span>
              </button>
            </div>
          </>
        )}

        <p className="text-gray-600 text-xs text-center">
          Ao continuar você concorda com os termos de uso
        </p>
      </div>
    </div>
  )
}
