'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { X } from 'lucide-react'

export default function AuthModal() {
  const { modalVisible, hideModal, register } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!modalVisible) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setLoading(true)
    setError('')
    try {
      await register(name.trim(), phone.trim())
    } catch {
      setError('Erro ao cadastrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
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

        <div>
          <h2 className="text-xl font-black text-white">Acesse o conteúdo</h2>
          <p className="text-gray-500 text-sm mt-1">Cadastre-se para assistir aos jogos ao vivo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar e assistir'}
          </button>
        </form>

        <p className="text-gray-600 text-xs text-center">
          Ao continuar você concorda com os termos de uso
        </p>
      </div>
    </div>
  )
}
