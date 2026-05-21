'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import { Copy, Check, X, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  streamId: string
  amount: number
  paymentMethod: 'bspay' | 'fixed_qr'
  fixedQrUrl?: string | null
  couponEnabled?: boolean
  onSuccess: (user: { name: string; email: string }) => void
  onCouponSuccess?: (user: { name: string; email: string }) => void
  onClose: () => void
}

type Step = 'credentials' | 'confirm' | 'qr'
type Mode = 'register' | 'login'

export default function CombinedModal({ streamId, amount, paymentMethod, fixedQrUrl, couponEnabled, onSuccess, onCouponSuccess, onClose }: Props) {
  const { t } = useLanguage()
  const [step, setStep] = useState<Step>('credentials')
  const [mode, setMode] = useState<Mode>('register')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url)
    })
  }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null)
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [couponOpen, setCouponOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Plan selection state (easy to revert: remove these 3 lines + related JSX)
  const [selectedOption, setSelectedOption] = useState<'avulso' | 'semanal' | 'mensal'>('avulso')
  const [tooltipFor, setTooltipFor] = useState<'avulso' | 'semanal' | 'mensal' | null>(null)
  const [isPlanPayment, setIsPlanPayment] = useState(false)

  useEffect(() => {
    if (!transactionId) return
    pollRef.current = setInterval(async () => {
      if (isPlanPayment) {
        const { data } = await supabase.from('plan_payments').select('status').eq('transaction_id', transactionId).maybeSingle()
        if (data?.status === 'PAID') { clearInterval(pollRef.current!); handlePaid() }
      } else {
        const res = await fetch(`/api/pix/status?transaction_id=${transactionId}`)
        const data = await res.json()
        if (data.status === 'PAID') { clearInterval(pollRef.current!); handlePaid() }
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [transactionId, isPlanPayment])

  function handlePaid() {
    setPaid(true)
    setTimeout(() => { if (currentUser) onSuccess(currentUser) }, 1500)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    const normalizedEmail = email.trim().toLowerCase()

    try {
      let userObj: { name: string; email: string }

      if (mode === 'register') {
        if (!name.trim()) { setFormError(t('nicknameLabel')); setFormLoading(false); return }
        if (!normalizedEmail.includes('@')) { setFormError(t('emailLabel')); setFormLoading(false); return }
        if (password.length < 4) { setFormError(t('passwordLabel')); setFormLoading(false); return }

        const { data: existing } = await supabase.from('registrations').select('id').eq('email', normalizedEmail).maybeSingle()
        if (existing) { setFormError(t('emailAlreadyUsed')); setFormLoading(false); return }

        const { error } = await supabase.from('registrations').insert({ name: name.trim(), email: normalizedEmail, phone: normalizedEmail, password })
        if (error) { setFormError(error.message); setFormLoading(false); return }

        const refCode = localStorage.getItem('futzone_ref')
        if (refCode) {
          fetch('/api/affiliate/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_phone: normalizedEmail, user_name: name.trim(), referral_code: refCode }),
          })
        }

        userObj = { name: name.trim(), email: normalizedEmail }
      } else {
        const isPhone = !normalizedEmail.includes('@')
        // For phones, generate variant with/without country code 55
        const altPhone = isPhone
          ? (normalizedEmail.startsWith('55') ? normalizedEmail.slice(2) : '55' + normalizedEmail)
          : null
        let found: { name: string; email: string } | null = null
        // 1. Exact match on email column
        const { data: e1 } = await supabase.from('registrations').select('name, email').eq('email', normalizedEmail).eq('password', password).maybeSingle()
        found = e1
        // 2. Alt phone form on email column (with/without 55)
        if (!found && altPhone) {
          const { data: e2 } = await supabase.from('registrations').select('name, email').eq('email', altPhone).eq('password', password).maybeSingle()
          found = e2
        }
        // 3. Phone column
        if (!found && isPhone) {
          const { data: e3 } = await supabase.from('registrations').select('name, email').eq('phone', normalizedEmail).eq('password', password).maybeSingle()
          found = e3
        }
        // 4. phone@futzone.app (with 55 prefix — same as AuthModal)
        if (!found && isPhone) {
          const withCountry = normalizedEmail.startsWith('55') ? normalizedEmail : '55' + normalizedEmail
          const { data: e4 } = await supabase.from('registrations').select('name, email').eq('email', `${withCountry}@futzone.app`).eq('password', password).maybeSingle()
          found = e4
        }
        // 5. phone@futzone.app without 55 (fallback)
        if (!found && isPhone) {
          const { data: e5 } = await supabase.from('registrations').select('name, email').eq('email', `${normalizedEmail}@futzone.app`).eq('password', password).maybeSingle()
          found = e5
        }
        if (!found) { setFormError(t('wrongCredentials')); setFormLoading(false); return }
        userObj = { name: found.name, email: found.email }
      }

      setCurrentUser(userObj)

      // Check free access (try both phone forms)
      const freePhones = [userObj.email]
      if (!userObj.email.includes('@')) {
        const digits = userObj.email
        const withCountry = digits.startsWith('55') ? digits : '55' + digits
        const withoutCountry = digits.startsWith('55') ? digits.slice(2) : digits
        freePhones.push(withCountry, withoutCountry, `${withCountry}@futzone.app`, `${withoutCountry}@futzone.app`)
      } else if (userObj.email.endsWith('@futzone.app')) {
        const digits = userObj.email.split('@')[0]
        const withCountry = digits.startsWith('55') ? digits : '55' + digits
        const withoutCountry = digits.startsWith('55') ? digits.slice(2) : digits
        freePhones.push(digits, withCountry, withoutCountry)
      }
      const { data: freeAccess } = await supabase.from('free_access').select('id').in('user_phone', freePhones).maybeSingle()
      if (freeAccess) {
        setFormLoading(false)
        onSuccess(userObj)
        return
      }

      // Check prior payment
      const { data: priorPayment } = await supabase.from('payments').select('id').eq('stream_id', streamId).eq('user_phone', userObj.email).eq('status', 'PAID').maybeSingle()
      if (priorPayment) {
        setFormLoading(false)
        onSuccess(userObj)
        return
      }

      // Check prior coupon use
      const { data: priorCoupon } = await supabase.from('coupon_uses').select('id').eq('stream_id', streamId).eq('user_phone', userObj.email).maybeSingle()
      if (priorCoupon) {
        setFormLoading(false)
        if (onCouponSuccess) onCouponSuccess(userObj)
        else onSuccess(userObj)
        return
      }

      if (paymentMethod === 'fixed_qr') {
        setStep('qr')
        setFormLoading(false)
        return
      }

      setStep('confirm')
    } catch {
      setFormError(t('wrongCredentials'))
    }
    setFormLoading(false)
  }

  async function generateQr() {
    if (!currentUser) return
    setGenerating(true)
    setGenerateError('')
    try {
      const referralCode = localStorage.getItem('futzone_ref') ?? undefined
      let res: Response
      if (selectedOption === 'avulso') {
        res = await fetch('/api/pix/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stream_id: streamId, user_phone: currentUser.email, user_name: currentUser.name, amount: Number(amount), referral_code: referralCode }),
        })
        setIsPlanPayment(false)
      } else {
        const planAmount = selectedOption === 'semanal' ? 7.90 : 15.90
        res = await fetch('/api/plan/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_email: currentUser.email, user_name: currentUser.name, amount: planAmount, plan_type: selectedOption }),
        })
        setIsPlanPayment(true)
      }
      const data = await res.json()
      if (!res.ok) { setGenerateError(`Erro ao gerar PIX: ${data.detail ?? data.error ?? ''}`); return }
      setQrcode(data.qrcode)
      setTransactionId(data.transaction_id)
      setStep('qr')
    } catch {
      setGenerateError('Erro ao conectar. Tente novamente.')
    } finally {
      setGenerating(false)
    }
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
        body: JSON.stringify({ stream_id: streamId, user_phone: currentUser.email, referral_code: referralCode }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { setVerifyMsg('Pagamento não detectado. Verifique se o PIX foi enviado e tente novamente.'); setVerifying(false); return }
    } catch {
      setVerifyMsg('Erro ao verificar pagamento. Tente novamente.')
      setVerifying(false)
      return
    }
    handlePaid()
  }

  async function checkManually() {
    if (!transactionId) return
    setVerifying(true)
    setVerifyMsg('')
    let paid = false
    if (isPlanPayment) {
      const { data } = await supabase.from('plan_payments').select('status').eq('transaction_id', transactionId).maybeSingle()
      paid = data?.status === 'PAID'
    } else {
      const res = await fetch(`/api/pix/status?transaction_id=${transactionId}`)
      const data = await res.json()
      paid = data.status === 'PAID'
    }
    if (paid) {
      clearInterval(pollRef.current!)
      handlePaid()
    } else {
      setVerifyMsg('Pagamento não detectado. Verifique se o PIX foi enviado e tente novamente.')
    }
    setVerifying(false)
  }

  async function handleCoupon() {
    if (!currentUser) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_id: streamId, code: couponCode, user_phone: currentUser.email }),
      })
      const data = await res.json()
      if (!res.ok) { setCouponError(data.error ?? t('wrongCredentials')); return }
      if (onCouponSuccess) onCouponSuccess(currentUser)
      else onSuccess(currentUser)
    } finally {
      setCouponLoading(false)
    }
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
      <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90svh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        {paid ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-white font-bold text-lg">{t('paymentConfirmed')}</p>
            <p className="text-gray-500 text-sm">{t('releasingAccess')}</p>
          </div>
        ) : step === 'confirm' ? (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              {logoUrl && <img src={logoUrl} alt="FutZone" className="h-9 object-contain mx-auto" />}
              <p className="text-white font-black text-lg">Escolha seu acesso</p>
              <p className="text-gray-500 text-xs">Selecione um plano e gere seu QR Code PIX</p>
            </div>

            {/* Plan cards */}
            <div className="space-y-2">
              {([
                { id: 'avulso' as const, label: 'Ingresso Avulso', price: `R$ ${amount.toFixed(2).replace('.', ',')}`, desc: 'Apenas este jogo', popular: false, benefits: ['Acesso somente a este jogo', 'Válido por esta transmissão', 'Pague só o que assistir'] },
                { id: 'semanal' as const, label: 'Acesso Semanal', price: 'R$ 7,90', desc: '7 dias ilimitado', popular: false, benefits: ['7 dias de acesso completo', 'Assista todos os jogos', 'Qualquer esporte disponível', 'Cancele quando quiser'] },
                { id: 'mensal' as const, label: 'Acesso Mensal', price: 'R$ 15,90', desc: '30 dias ilimitado', popular: true, benefits: ['30 dias de acesso completo', 'Assista todos os jogos', 'Qualquer esporte disponível', 'Melhor custo-benefício'] },
              ]).map(opt => (
                <div key={opt.id}>
                  <button
                    onClick={() => setSelectedOption(opt.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${selectedOption === opt.id ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] bg-[#1A1A26] hover:border-[#3A3A4A]'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${selectedOption === opt.id ? 'text-white' : 'text-gray-200'}`}>{opt.label}</span>
                        {opt.popular && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#FF6A00,#FF8533)' }}>
                            POPULAR
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-[11px] mt-0.5">{opt.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`font-black text-sm ${selectedOption === opt.id ? 'text-orange-400' : 'text-gray-300'}`}>{opt.price}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setTooltipFor(tooltipFor === opt.id ? null : opt.id) }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${tooltipFor === opt.id ? 'text-orange-400 border-orange-400' : 'text-gray-500 border-gray-500 hover:text-orange-400 hover:border-orange-400'}`}
                        style={{ border: '1px solid currentColor' }}
                        title="Ver benefícios"
                      >
                        i
                      </button>
                    </div>
                  </button>
                  {tooltipFor === opt.id && (
                    <div className="mt-1 mx-1 rounded-xl px-3 py-2.5 space-y-1" style={{ background: 'rgba(255,106,0,0.07)', border: '1px solid rgba(255,106,0,0.2)' }}>
                      {opt.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                          <span className="text-orange-400 font-bold">✓</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {generateError && <p className="text-red-500 text-xs text-center">{generateError}</p>}
            <button
              onClick={generateQr}
              disabled={generating}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black rounded-xl py-3 transition-all"
            >
              {generating ? 'Gerando...' : 'Gerar QR Code PIX'}
            </button>

            {couponEnabled && (
              <div className="space-y-2 pt-1">
                {!couponOpen ? (
                  <button
                    onClick={() => { setCouponOpen(true); setCouponError(''); setCouponCode('') }}
                    className="w-full relative overflow-hidden font-black py-3 text-sm transition-all rounded-xl border-2 border-yellow-400 text-yellow-900 hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #f5c518 0%, #fde68a 40%, #f59e0b 60%, #f5c518 100%)' }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      🎟️ Código Exclusivo
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                      placeholder={t('codePlaceholder')}
                      className="w-full bg-[#0B0B0F] rounded-xl px-3 py-2.5 text-sm text-center font-mono tracking-widest focus:outline-none text-white placeholder-gray-600 border-2 border-yellow-400/80"
                    />
                    {couponError && <p className="text-red-400 text-xs text-center">{couponError}</p>}
                    <button
                      disabled={couponLoading || !couponCode.trim()}
                      onClick={handleCoupon}
                      className="w-full relative overflow-hidden font-black py-2.5 rounded-xl transition-all border-2 border-yellow-400 text-yellow-900 disabled:opacity-40 hover:brightness-110 text-sm"
                      style={{ background: 'linear-gradient(135deg, #f5c518 0%, #fde68a 40%, #f59e0b 60%, #f5c518 100%)' }}
                    >
                      {couponLoading ? t('verifying') : '🎟️ Confirmar código'}
                    </button>
                    <button onClick={() => setCouponOpen(false)} className="w-full text-gray-500 hover:text-white text-xs transition-colors">
                      {t('cancel')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : step === 'credentials' ? (
          <div className="space-y-5">
            <div className="text-center space-y-3">
              {logoUrl && <img src={logoUrl} alt="FutZone" className="h-10 object-contain mx-auto" />}
              <h2 className="text-2xl font-black text-white">{t('unlockGame')}</h2>
              <div className="inline-flex items-baseline gap-1.5 bg-green-500/15 border border-green-500/40 rounded-xl px-5 py-2">
                <span className="text-green-400 text-sm font-semibold">R$</span>
                <span className="text-green-400 text-3xl font-black">{amount.toFixed(2).replace('.', ',')}</span>
              </div>
              <p className="text-gray-500 text-xs">{t('immediateAccess')}</p>
            </div>

            <div className="flex rounded-xl overflow-hidden border border-[#2A2A3A]">
              <button onClick={() => { setMode('register'); setFormError('') }} className={`flex-1 py-2 text-sm font-bold transition-all ${mode === 'register' ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}>
                {t('createAccountTab')}
              </button>
              <button onClick={() => { setMode('login'); setFormError('') }} className={`flex-1 py-2 text-sm font-bold transition-all ${mode === 'login' ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}>
                {t('alreadyHaveAccountTab')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <input
                  className={inputClass} style={inputStyle}
                  placeholder={t('nicknamePlaceholder')}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="nickname"
                />
              )}
              <input
                type={mode === 'login' ? 'text' : 'email'}
                className={inputClass} style={inputStyle}
                placeholder={mode === 'login' ? 'Email ou telefone' : t('emailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                inputMode={mode === 'login' ? 'text' : 'email'}
                autoComplete="email"
              />
              <div className="relative">
                <input
                  className={inputClass} style={{ ...inputStyle, paddingRight: 44 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
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
                {formLoading ? '...' : t('continue')}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              {logoUrl && <img src={logoUrl} alt="FutZone" className="h-8 object-contain mx-auto mb-2" />}
              <p className="text-gray-500 text-sm">{t('immediateAccess')}</p>
            </div>

            {paymentMethod === 'fixed_qr' ? (
              <>
                {fixedQrUrl
                  ? <div className="bg-white rounded-xl p-4 flex items-center justify-center"><img src={fixedQrUrl} alt="QR Code PIX" className="w-48 h-48 object-contain" /></div>
                  : <p className="text-red-500 text-sm text-center">QR Code não configurado.</p>
                }
                <button onClick={handleFixedQrPaid} disabled={verifying} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all">
                  {verifying ? t('registering') : t('alreadyPaid')}
                </button>
              </>
            ) : (
              <>
                {!qrcode ? (
                  <div className="py-8 text-center"><p className="text-gray-500 text-sm">{t('generating')}</p></div>
                ) : (
                  <>
                    <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                      <QRCode value={qrcode} size={200} />
                    </div>
                    <button onClick={copy} className="w-full flex items-center justify-center gap-2 bg-[#1A1A26] hover:bg-[#2A2A3A] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm transition-all">
                      {copied ? <><Check className="w-4 h-4 text-green-500" /> {t('copied')}</> : <><Copy className="w-4 h-4" /> {t('copyPix')}</>}
                    </button>
                    <button onClick={checkManually} disabled={verifying} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all">
                      {verifying ? t('verifying') : t('alreadyPaid')}
                    </button>
                    {verifyMsg && <p className="text-yellow-500 text-xs text-center">{verifyMsg}</p>}
                    <p className="text-gray-600 text-xs text-center">{t('waitingConfirmation')}</p>
                  </>
                )}
              </>
            )}
            {verifyMsg && paymentMethod === 'fixed_qr' && <p className="text-red-500 text-xs text-center">{verifyMsg}</p>}

            {couponEnabled && (
              <div className="space-y-2 pt-1">
                {!couponOpen ? (
                  <button
                    onClick={() => { setCouponOpen(true); setCouponError(''); setCouponCode('') }}
                    className="w-full text-purple-400 font-bold border border-purple-500 rounded-full py-3 text-sm transition-all hover:bg-purple-500/10"
                  >
                    {t('haveCode')}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                      placeholder={t('codePlaceholder')}
                      className="w-full bg-[#0B0B0F] rounded-xl px-3 py-2.5 text-sm text-center font-mono tracking-widest focus:outline-none text-white placeholder-gray-600 border-2 border-yellow-400/80"
                    />
                    {couponError && <p className="text-red-400 text-xs text-center">{couponError}</p>}
                    <button
                      disabled={couponLoading || !couponCode.trim()}
                      onClick={handleCoupon}
                      className="w-full relative overflow-hidden font-black py-2.5 rounded-xl transition-all border-2 border-yellow-400 text-yellow-900 disabled:opacity-40 hover:brightness-110 text-sm"
                      style={{ background: 'linear-gradient(135deg, #f5c518 0%, #fde68a 40%, #f59e0b 60%, #f5c518 100%)' }}
                    >
                      {couponLoading ? t('verifying') : '🎟️ Confirmar código'}
                    </button>
                    <button onClick={() => setCouponOpen(false)} className="w-full text-gray-500 hover:text-white text-xs transition-colors">
                      {t('cancel')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
