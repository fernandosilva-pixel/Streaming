'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, X, LogOut, ShieldCheck, Clock, Zap, Camera } from 'lucide-react'
import { useAuth, isPlanActive, ContentPreference } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import QRCode from 'react-qr-code'


const PLAN_PRICE = 19.90

const PREFERENCES: { value: ContentPreference; icon: string; label: string; desc: string }[] = [
  { value: 'futebol',  icon: '⚽', label: 'Futebol',  desc: 'Só transmissões de futebol' },
  { value: 'basquete', icon: '🏀', label: 'Basquete', desc: 'Só transmissões de basquete' },
  { value: 'luta',     icon: '🥊', label: 'Luta',     desc: 'Todos os esportes' },
]

export default function PerfilPage() {
  const { user, logout, refreshUser, updatePreference, updateAvatar, initialized } = useAuth()
  const { lang } = useLanguage()
  const router = useRouter()

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [idCopied, setIdCopied] = useState(false)
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [selectedPlanType, setSelectedPlanType] = useState<'semanal' | 'mensal'>('mensal')
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

  async function generateQr(planType: 'semanal' | 'mensal') {
    if (!user) return
    setGenerating(true)
    setVerifyMsg('')
    const amount = planType === 'semanal' ? 9.90 : PLAN_PRICE
    try {
      const res = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, user_name: user.name, amount, plan_type: planType }),
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

  async function handleAvatarFile(file: File) {
    if (!user || !file.type.startsWith('image/')) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `avatar-${user.email.replace(/[^a-z0-9]/gi, '_')}.${ext}`
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType: file.type })
    if (error) { alert('Erro no upload.'); setAvatarUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    await updateAvatar(publicUrl)
    setAvatarUploading(false)
  }

  function copyUserId() {
    if (!user) return
    navigator.clipboard.writeText(user.email)
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 2000)
  }

  function openPlanModal(planType: 'semanal' | 'mensal') {
    setSelectedPlanType(planType)
    setQrcode(null)
    setTransactionId(null)
    setPaid(false)
    setVerifyMsg('')
    setPlanModalOpen(true)
    setTimeout(() => generateQr(planType), 100)
  }

  if (!initialized || !user) return null

  const active = isPlanActive(user)
  const expired = user.plan === 'mensal' && !active
  const expiresAt = user.plan_expires_at ? new Date(user.plan_expires_at) : null
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null
  const expiringSoon = active && daysLeft !== null && daysLeft <= 7

  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const flagEmoji = lang === 'en' ? '🇺🇸' : lang === 'es' ? '🇪🇸' : '🇧🇷'
  const shortId = user.email.length > 16 ? user.email.slice(0, 14) + '…' : user.email

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Cabeçalho — card estilo perfil */}
      <div className="rounded-2xl overflow-hidden border border-[#2A2A3A]">
        {/* Cover */}
        <div
          className="relative h-28"
          style={{ background: 'linear-gradient(135deg, #1A1020 0%, #0B0B0F 50%, #1A1A26 100%)' }}
        >
          {/* Grade decorativa sutil */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,.05) 24px,rgba(255,255,255,.05) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,.05) 24px,rgba(255,255,255,.05) 25px)' }} />

          {/* Botão sair */}
          <button
            onClick={() => { logout(); router.push('/') }}
            className="absolute top-4 right-4 flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>

          {/* Avatar sobrepondo o cover — centralizado */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full border-4 border-orange-500 overflow-hidden bg-[#1A1A26] flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : avatarUploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <span className="text-2xl font-black text-white" style={{ background: 'linear-gradient(135deg,#FF6A00,#FF8533)', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {initials}
                  </span>
                )}
              </div>
              {/* Botão câmera para upload */}
              <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/50 transition-all group">
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleAvatarFile(e.target.files[0])} />
              </label>
            </div>
          </div>

        </div>

        {/* Informações abaixo do cover */}
        <div className="bg-[#12121A] pt-12 pb-5 px-6 space-y-1.5 flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <span>{flagEmoji}</span>
            <h1 className="text-white font-black text-xl">{user.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span>ID: {shortId}</span>
            <button onClick={copyUserId} className="hover:text-white transition-colors">
              {idCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Seção de Planos */}
      <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-black text-lg">Seu plano</h2>

        {/* Plano atual */}
        <div className={`rounded-xl p-4 border flex items-start justify-between gap-3 ${
          active ? 'bg-orange-500/10 border-orange-500/30' : expired ? 'bg-red-500/10 border-red-500/20' : 'bg-[#0B0B0F] border-[#2A2A3A]'
        }`}>
          <div className="flex items-center gap-3">
            {active && <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0" />}
            {expired && <Clock className="w-5 h-5 text-red-400 shrink-0" />}
            <div>
              <p className={`font-black ${active ? 'text-orange-400' : expired ? 'text-red-400' : 'text-white'}`}>
                {active ? (user.plan === 'semanal' ? 'Plano Semanal' : 'Plano Mensal') : expired ? 'Plano Vencido' : 'Plano Gratuito'}
              </p>
              {active && expiresAt && (
                <p className={`text-xs mt-0.5 ${expiringSoon ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {expiringSoon ? `⚠️ Vence em ${daysLeft} dia${daysLeft === 1 ? '' : 's'}` : `Ativo até ${expiresAt.toLocaleDateString('pt-BR')}`}
                </p>
              )}
              {expired && expiresAt && <p className="text-xs mt-0.5 text-red-400">Venceu em {expiresAt.toLocaleDateString('pt-BR')}</p>}
              {!active && !expired && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">❌ Paga por cada transmissão avulsa</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">❌ Preview limitado de 5 min antes de pagar</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">❌ Sem continuidade — paga toda vez que quiser assistir</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">❌ Sem badge PRO na conta</p>
                </div>
              )}
              {active && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-orange-300">✓ Acesso ilimitado a todas as transmissões</p>
                  <p className="text-xs text-orange-300">✓ Sem pagar por live individual</p>
                  <p className="text-xs text-orange-300">✓ Badge PRO na conta</p>
                </div>
              )}
            </div>
          </div>
          {active && <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">PRO</span>}
        </div>

        {/* Planos disponíveis */}
        {(!active || expiringSoon) && (
          <div className="space-y-3">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">
              {active ? 'Renovar plano' : 'Escolha um plano'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Semanal */}
              <div className="relative rounded-2xl border border-[#2A2A3A] bg-[#0B0B0F] p-5 flex flex-col gap-4">
                <div>
                  <p className="text-white font-black text-lg">Semanal</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-white">R$9,90</span>
                    <span className="text-gray-500 text-sm">/semana</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-gray-400 text-sm">✓ Todos os jogos da semana</p>
                  <p className="text-gray-400 text-sm">✓ Sem pagamento avulso</p>
                  <p className="text-gray-400 text-sm">✓ Conteúdo personalizado</p>
                  <p className="text-gray-400 text-sm">✓ Badge PRO na conta</p>
                </div>
                <button
                  onClick={() => openPlanModal('semanal')}
                  className="w-full py-3 rounded-xl font-black text-white text-sm border border-orange-500/40 hover:bg-orange-500/10 transition-all"
                >
                  Assinar
                </button>
              </div>

              {/* Mensal — destaque */}
              <div className="relative rounded-2xl border border-orange-500/50 bg-orange-500/5 p-5 flex flex-col gap-4 mt-4 sm:mt-0">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap">MAIS POPULAR</span>
                </div>
                <div>
                  <p className="text-white font-black text-lg">Mensal</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-orange-400">R$19,90</span>
                    <span className="text-gray-500 text-sm">/mês</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-orange-300 text-sm">✓ 30 dias corridos sem interrupção</p>
                  <p className="text-orange-300 text-sm">✓ Todos os campeonatos do mês</p>
                  <p className="text-orange-300 text-sm">✓ Sem pagamento avulso</p>
                  <p className="text-orange-300 text-sm">✓ Economia vs pagar por live</p>
                  <p className="text-orange-300 text-sm">✓ Badge PRO na conta</p>
                  <p className="text-orange-300 text-sm">✓ Conteúdo personalizado</p>
                </div>
                <button
                  onClick={() => openPlanModal('mensal')}
                  className="w-full py-3 rounded-xl font-black text-white text-sm transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8533)', boxShadow: '0 0 16px rgba(255,106,0,0.3)' }}
                >
                  Assinar
                </button>
              </div>

            </div>
          </div>
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
                  <h2 className="text-xl font-black text-white">
                    {selectedPlanType === 'semanal' ? 'Plano Semanal' : 'Plano Mensal'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {selectedPlanType === 'semanal' ? 'Acesso ilimitado por 7 dias · PIX à vista' : 'Acesso ilimitado por 30 dias · PIX à vista'}
                  </p>
                </div>

                <div className="inline-flex items-baseline gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2">
                  <span className="text-orange-400 text-sm font-semibold">R$</span>
                  <span className="text-orange-400 text-3xl font-black">{selectedPlanType === 'semanal' ? '9,90' : '19,90'}</span>
                  <span className="text-gray-500 text-sm">/{selectedPlanType === 'semanal' ? 'sem' : 'mês'}</span>
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
