'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import { Copy, Check, X, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  streamId: string
  amount: number
  paymentMethod: 'bspay' | 'fixed_qr'
  fixedQrUrl?: string | null
  onSuccess: (user: { name: string; phone: string }) => void
  onClose: () => void
}

type Step = 'credentials' | 'qr'
type Mode = 'register' | 'login'

function fmt(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function CombinedModal({ streamId, amount, paymentMethod, fixedQrUrl, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<Step>('credentials')
  const [mode, setMode] = useState<Mode>('register')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url)
    })
  }, [])

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [currentUser, setCurrentUser] = useState<{ name: string; phone: string } | null>(null)
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!transactionId) return
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/pix/status?transaction_id=${transactionId}`)
      const data = await res.json()
      if (data.status === 'PAID') {
        clearInterval(pollRef.current!)
        handlePaid()
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [transactionId])

  function handlePaid() {
    setPaid(true)
    setTimeout(() => { if (currentUser) onSuccess(currentUser) }, 1500)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    const digits = phone.replace(/\D/g, '')

    try {
      let userObj: { name: string; phone: string }

      if (mode === 'register') {
        if (!name.trim()) { setFormError('Informe seu nome.'); setFormLoading(false); return }
        if (digits.length < 10) { setFormError('Telefone inválido.'); setFormLoading(false); return }
        if (password.length < 4) { setFormError('Senha deve ter ao menos 4 caracteres.'); setFormLoading(false); return }

        const { data: existing } = await supabase.from('registrations').select('id').eq('phone', digits).maybeSingle()
        if (existing) { setFormError('Telefone já cadastrado. Clique em "Já tenho conta".'); setFormLoading(false); return }

        const { error } = await supabase.from('registrations').insert({ name: name.trim(), phone: digits, password })
        if (error) { setFormError('Erro ao cadastrar. Tente novamente.'); setFormLoading(false); return }

        const refCode = localStorage.getItem('futzone_ref')
        if (refCode) {
          fetch('/api/affiliate/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_phone: digits, user_name: name.trim(), referral_code: refCode }),
          })
        }

        userObj = { name: name.trim(), phone: digits }
      } else {
        const { data } = await supabase.from('registrations').select('name, phone').eq('phone', digits).eq('password', password).single()
        if (!data) { setFormError('Telefone ou senha incorretos.'); setFormLoading(false); return }
        userObj = { name: data.name, phone: data.phone }
      }

      setCurrentUser(userObj)

      if (paymentMethod === 'fixed_qr') {
        setStep('qr')
        setFormLoading(false)
        return
      }

      // BSPay — generate QR
      const referralCode = localStorage.getItem('futzone_ref') ?? undefined
      const res = await fetch('/api/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_id: streamId, user_phone: userObj.phone, user_name: userObj.name, amount: Number(amount), referral_code: referralCode }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(`Erro ao gerar PIX: ${data.detail ?? data.error ?? ''}`); setFormLoading(false); return }
      setQrcode(data.qrcode)
      setTransactionId(data.transaction_id)
      setStep('qr')
    } catch {
      setFormError('Erro de conexão. Tente novamente.')
    }
    setFormLoading(false)
  }

  async function handleFixedQrPaid() {
    if (!currentUser) return
    setVerifying(true)
    setVerifyMsg('')
    const referralCode = localStorage.getItem('futzone_ref') ?? undefined
    try {
      const res = await fetch('/api/pix/fixed-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_id: streamId, user_phone: currentUser.phone, referral_code: referralCode }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { setVerifyMsg('Erro ao registrar. Tente novamente.'); setVerifying(false); return }
    } catch {
      setVerifyMsg('Erro ao conectar. Tente novamente.')
      setVerifying(false)
      return
    }
    handlePaid()
  }

  async function checkManually() {
    if (!transactionId) return
    setVerifying(true)
    setVerifyMsg('')
    const res = await fetch(`/api/pix/status?transaction_id=${transactionId}`)
    const data = await res.json()
    if (data.status === 'PAID') {
      clearInterval(pollRef.current!)
      handlePaid()
    } else {
      setVerifyMsg('Pagamento não identificado ainda. Tente novamente.')
    }
    setVerifying(false)
  }

  function copy() {
    if (!qrcode) return
    navigator.clipboard.writeText(qrcode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass = "w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors text-base"
  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        {paid ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-white font-bold text-lg">Pagamento confirmado!</p>
            <p className="text-gray-500 text-sm">Liberando acesso...</p>
          </div>
        ) : step === 'credentials' ? (
          <div className="space-y-5">
            <div className="text-center space-y-3">
              {logoUrl && (
                <img src={logoUrl} alt="FutZone" className="h-10 object-contain mx-auto" />
              )}
              <h2 className="text-2xl font-black text-white">Liberar Jogo Completo</h2>
              <div className="inline-flex items-baseline gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-xl px-5 py-2">
                <span className="text-orange-400 text-sm font-semibold">R$</span>
                <span className="text-orange-400 text-3xl font-black">{amount.toFixed(2).replace('.', ',')}</span>
                <span className="text-orange-400/70 text-sm">via PIX</span>
              </div>
              <p className="text-gray-500 text-xs">Acesso imediato após confirmação</p>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden border border-[#2A2A3A]">
              <button onClick={() => { setMode('register'); setFormError('') }} className={`flex-1 py-2 text-sm font-bold transition-all ${mode === 'register' ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}>
                Criar conta
              </button>
              <button onClick={() => { setMode('login'); setFormError('') }} className={`flex-1 py-2 text-sm font-bold transition-all ${mode === 'login' ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}>
                Já tenho conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <input
                  className={inputClass} style={inputStyle}
                  placeholder="Seu nome"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              )}
              <input
                className={inputClass} style={inputStyle}
                placeholder="Telefone (WhatsApp)"
                value={phone}
                onChange={e => setPhone(fmt(e.target.value))}
                inputMode="tel"
                autoComplete="tel"
              />
              <div className="relative">
                <input
                  className={inputClass} style={{ ...inputStyle, paddingRight: 44 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formError && <p className="text-red-500 text-xs">{formError}</p>}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-black rounded-xl py-3 transition-all"
              >
                {formLoading ? 'Aguarde...' : paymentMethod === 'fixed_qr' ? 'Ver QR Code →' : 'Gerar PIX →'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              {logoUrl && <img src={logoUrl} alt="FutZone" className="h-8 object-contain mx-auto mb-2" />}
              <h2 className="text-xl font-black text-white">Pague via PIX</h2>
              <p className="text-gray-500 text-sm">R$ {amount.toFixed(2).replace('.', ',')} • acesso imediato após confirmação</p>
            </div>

            {paymentMethod === 'fixed_qr' ? (
              <>
                {fixedQrUrl
                  ? <div className="bg-white rounded-xl p-4 flex items-center justify-center"><img src={fixedQrUrl} alt="QR Code PIX" className="w-48 h-48 object-contain" /></div>
                  : <p className="text-red-500 text-sm text-center">QR Code não configurado.</p>
                }
                <button onClick={handleFixedQrPaid} disabled={verifying} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all">
                  {verifying ? 'Registrando...' : 'Já paguei'}
                </button>
              </>
            ) : (
              <>
                {!qrcode ? (
                  <div className="py-8 text-center"><p className="text-gray-500 text-sm">Gerando QR Code...</p></div>
                ) : (
                  <>
                    <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                      <QRCode value={qrcode} size={200} />
                    </div>
                    <button onClick={copy} className="w-full flex items-center justify-center gap-2 bg-[#1A1A26] hover:bg-[#2A2A3A] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm transition-all">
                      {copied ? <><Check className="w-4 h-4 text-green-500" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar código PIX</>}
                    </button>
                    <button onClick={checkManually} disabled={verifying} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all">
                      {verifying ? 'Verificando...' : 'Já paguei'}
                    </button>
                    {verifyMsg && <p className="text-yellow-500 text-xs text-center">{verifyMsg}</p>}
                    <p className="text-gray-600 text-xs text-center">Aguardando confirmação automática...</p>
                  </>
                )}
              </>
            )}
            {verifyMsg && paymentMethod === 'fixed_qr' && <p className="text-red-500 text-xs text-center">{verifyMsg}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
