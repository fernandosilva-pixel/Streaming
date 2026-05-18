'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, X, LogOut, ShieldCheck, Clock, Zap } from 'lucide-react'
import { useAuth, isPlanActive, ContentPreference } from '@/contexts/AuthContext'
import QRCode from 'react-qr-code'

const PLAN_PRICE = 19.90

const PREFERENCES: { value: ContentPreference; icon: string; label: string; desc: string }[] = [
  { value: 'futebol',  icon: '⚽', label: 'Futebol',  desc: 'Só transmissões de futebol' },
  { value: 'basquete', icon: '🏀', label: 'Basquete', desc: 'Só transmissões de basquete' },
  { value: 'hibrido',  icon: '🎮', label: 'Híbrido',  desc: 'Todos os esportes' },
]

export default function PerfilPage() {
  const { user, logout, refreshUser, updatePreference, initialized } = useAuth()
  const router = useRouter()

  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paid, setPaid] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')
  const [prefSaving, setPrefSaving] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (initialized && !user) router.replace('/')
  }, [initialized, user, router])

  useEffect(() => {
    if (!transactionId) return
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/plan/status?transaction_id=${transactionId}`)
      const data = await res.json()
      if (data.status === 'PAID') {
        clearInterval(pollRef.current!)
        handlePaid()
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [transactionId])

  async function generateQr() {
    if (!user) return
    setGenerating(true)
    setVerifyMsg('')
    try {
      const res = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, user_name: user.name, amount: PLAN_PRICE }),
      })
      const data = await res.json()
      if (!res.ok) { setVerifyMsg('Erro ao gerar PIX. Tente novamente.'); return }
      setQrcode(data.qrcode)
      setTransactionId(data.transaction_id)
    } catch {
      setVerifyMsg('Erro de conexão. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  async function checkManually() {
    if (!transactionId) return
    setVerifying(true)
    setVerifyMsg('')
    const res = await fetch(`/api/plan/status?transaction_id=${transactionId}`)
    const data = await res.json()
    if (data.status === 'PAID') {
      clearInterval(pollRef.current!)
      handlePaid()
    } else {
      setVerifyMsg('Pagamento ainda não identificado. Aguarde alguns segundos e tente novamente.')
    }
    setVerifying(false)
  }

  async function handlePaid() {
    setPaid(true)
    await refreshUser()
    setTimeout(() => {
      setPlanModalOpen(false)
      setPaid(false)
      setQrcode(null)
      setTransactionId(null)
    }, 2000)
  }

  function copy() {
    if (!qrcode) return
    navigator.clipboard.writeText(qrcode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleUpdatePreference(pref: ContentPreference) {
    setPrefSaving(true)
    await updatePreference(pref)
    setPrefSaving(false)
  }

  function openPlanModal() {
    setQrcode(null)
    setTransactionId(null)
    setPaid(false)
    setVerifyMsg('')
    setPlanModalOpen(true)
    setTimeout(generateQr, 100)
  }

  if (!initialized || !user) return null

  const active = isPlanActive(user)
  const expired = user.plan === 'mensal' && !active
  const expiresAt = user.plan_expires_at ? new Date(user.plan_expires_at) : null
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null
  const expiringSoon = active && daysLeft !== null && daysLeft <= 7

  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8533)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-white truncate">{user.name}</h1>
          <p className="text-gray-500 text-sm truncate">{user.email}</p>
        </div>
        <button
          onClick={() => { logout(); router.push('/') }}
          className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>

      {/* Card do Plano */}
      <div className={`rounded-2xl p-6 border space-y-4 ${
        active
          ? 'bg-orange-500/10 border-orange-500/30'
          : expired
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-[#12121A] border-[#2A2A3A]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {active ? (
              <ShieldCheck className="w-6 h-6 text-orange-400" />
            ) : expired ? (
              <Clock className="w-6 h-6 text-red-400" />
            ) : (
              <Zap className="w-6 h-6 text-gray-500" />
            )}
            <div>
              <p className="text-white font-black text-lg">
                {active ? 'FutZone Pro' : expired ? 'Plano Vencido' : 'Plano Gratuito'}
              </p>
              <p className="text-sm mt-0.5">
                {active && expiresAt && (
                  <span className={expiringSoon ? 'text-yellow-400' : 'text-gray-400'}>
                    {expiringSoon ? `⚠️ Vence em ${daysLeft} dia${daysLeft === 1 ? '' : 's'}` : `Ativo até ${expiresAt.toLocaleDateString('pt-BR')}`}
                  </span>
                )}
                {expired && expiresAt && (
                  <span className="text-red-400">Venceu em {expiresAt.toLocaleDateString('pt-BR')}</span>
                )}
                {!active && !expired && (
                  <span className="text-gray-500">Acesso por transmissão avulsa</span>
                )}
              </p>
            </div>
          </div>
          {active && (
            <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full">PRO</span>
          )}
        </div>

        {active && (
          <div className="bg-black/20 rounded-xl px-4 py-3">
            <p className="text-orange-300 text-sm font-semibold">✓ Acesso ilimitado a todas as transmissões</p>
            <p className="text-orange-300 text-sm font-semibold">✓ Sem pagar por live individual</p>
            <p className="text-orange-300 text-sm font-semibold">✓ Renovação manual · 30 dias</p>
          </div>
        )}

        {(expired || !active) && (
          <button
            onClick={openPlanModal}
            className="w-full py-3 rounded-xl font-black text-white transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8533)', boxShadow: '0 0 20px rgba(255,106,0,0.3)' }}
          >
            {expired ? 'Renovar Plano — R$ 19,90/mês' : 'Assinar Plano — R$ 19,90/mês'}
          </button>
        )}

        {active && expiringSoon && (
          <button
            onClick={openPlanModal}
            className="w-full py-3 rounded-xl font-black text-white border border-orange-500/50 hover:bg-orange-500/10 transition-all text-sm"
          >
            Renovar agora
          </button>
        )}
      </div>

      {/* Preferência de conteúdo */}
      <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-white font-black text-lg">Conteúdo preferido</h2>
          <p className="text-gray-500 text-sm mt-0.5">Filtra as transmissões exibidas para você.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {PREFERENCES.map(p => {
            const selected = user.content_preference === p.value
            return (
              <button
                key={p.value}
                onClick={() => !prefSaving && handleUpdatePreference(p.value)}
                disabled={prefSaving}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                  selected
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#0B0B0F]'
                }`}
              >
                <span style={{ fontSize: 32 }}>{p.icon}</span>
                <span className={`font-bold text-sm ${selected ? 'text-orange-400' : 'text-gray-400'}`}>{p.label}</span>
                <span className="text-gray-600 text-xs text-center px-1">{p.desc}</span>
              </button>
            )
          })}
        </div>
        {prefSaving && <p className="text-gray-500 text-xs text-center">Salvando...</p>}
      </div>

      {/* Modal PIX do plano */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPlanModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-5 shadow-2xl">
            <button onClick={() => setPlanModalOpen(false)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            {paid ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-white font-black text-lg">Plano ativado!</p>
                <p className="text-gray-500 text-sm">Seu FutZone Pro está ativo por 30 dias.</p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-black text-white">FutZone Pro</h2>
                  <p className="text-gray-500 text-sm mt-1">Acesso ilimitado por 30 dias · PIX à vista</p>
                </div>

                <div className="inline-flex items-baseline gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2">
                  <span className="text-orange-400 text-sm font-semibold">R$</span>
                  <span className="text-orange-400 text-3xl font-black">19,90</span>
                  <span className="text-gray-500 text-sm">/mês</span>
                </div>

                {generating && (
                  <div className="py-8 text-center text-gray-500 text-sm">Gerando QR Code...</div>
                )}

                {qrcode && !generating && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                      <QRCode value={qrcode} size={192} />
                    </div>
                    <button onClick={copy} className="w-full flex items-center justify-center gap-2 bg-[#1A1A26] hover:bg-[#2A2A3A] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm transition-all">
                      {copied ? <><Check className="w-4 h-4 text-green-500" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar código PIX</>}
                    </button>
                    <button onClick={checkManually} disabled={verifying} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all">
                      {verifying ? 'Verificando...' : 'Já paguei'}
                    </button>
                    {verifyMsg && <p className="text-yellow-400 text-xs text-center">{verifyMsg}</p>}
                    <p className="text-gray-600 text-xs text-center">Aguardando confirmação automática do pagamento...</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
