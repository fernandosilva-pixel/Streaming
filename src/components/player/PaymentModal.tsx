'use client'

import { useEffect, useState, useRef } from 'react'
import QRCode from 'react-qr-code'
import { Copy, Check, X, ChevronLeft } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'

interface Props {
  streamId: string
  streamTitle?: string
  userEmail: string
  userName: string
  amount: number
  paymentMethod: 'bspay' | 'fixed_qr'
  fixedQrUrl?: string | null
  couponEnabled?: boolean
  onPaid: () => void
  onCouponSuccess?: () => void
  onClose: () => void
}

export default function PaymentModal({ streamId, streamTitle, userEmail, userName, amount, paymentMethod, fixedQrUrl, couponEnabled, onPaid, onCouponSuccess, onClose }: Props) {
  const { t } = useLanguage()
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [paid, setPaid] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [couponOpen, setCouponOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Plan selection state
  const [selectedOption, setSelectedOption] = useState<'avulso' | 'semanal' | 'mensal'>('avulso')
  const [tooltipFor, setTooltipFor] = useState<'avulso' | 'semanal' | 'mensal' | null>(null)
  const [isPlanPayment, setIsPlanPayment] = useState(false)

  async function generateQr() {
    setGenerating(true)
    setError('')
    try {
      const referralCode = localStorage.getItem('futzone_ref') ?? undefined
      let res: Response
      if (selectedOption === 'avulso') {
        res = await fetch('/api/pix/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stream_id: streamId, stream_title: streamTitle, user_phone: userEmail, user_name: userName, amount: Number(amount), referral_code: referralCode }),
        })
        setIsPlanPayment(false)
      } else {
        const planAmount = selectedOption === 'semanal' ? 7.90 : 15.90
        res = await fetch('/api/plan/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_email: userEmail, user_name: userName, amount: planAmount, plan_type: selectedOption }),
        })
        setIsPlanPayment(true)
      }
      const data = await res.json()
      if (!res.ok) { setError(`Erro: ${data.detail ?? data.error ?? JSON.stringify(data)}`); return }
      setQrcode(data.qrcode)
      setTransactionId(data.transaction_id)
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    if (!transactionId) return
    pollRef.current = setInterval(async () => {
      if (isPlanPayment) {
        const { data } = await supabase.from('plan_payments').select('status').eq('transaction_id', transactionId).maybeSingle()
        if (data?.status === 'PAID') { clearInterval(pollRef.current!); setPaid(true); setTimeout(onPaid, 1500) }
      } else {
        const res = await fetch(`/api/pix/status?transaction_id=${transactionId}`)
        const data = await res.json()
        if (data.status === 'PAID') { clearInterval(pollRef.current!); setPaid(true); setTimeout(onPaid, 1500) }
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [transactionId, isPlanPayment])

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
      setPaid(true)
      setTimeout(onPaid, 1500)
    } else {
      setVerifyMsg('Pagamento não identificado ainda. Verifique se o PIX foi enviado e tente novamente.')
    }
    setVerifying(false)
  }

  async function handleFixedQrPaid() {
    setVerifying(true)
    setVerifyMsg('')
    const referralCode = localStorage.getItem('futzone_ref') ?? undefined
    try {
      const res = await fetch('/api/pix/fixed-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_id: streamId, stream_title: streamTitle, user_phone: userEmail, referral_code: referralCode }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { setVerifyMsg('Erro ao registrar. Tente novamente.'); setVerifying(false); return }
    } catch {
      setVerifyMsg('Erro ao conectar. Tente novamente.')
      setVerifying(false)
      return
    }
    setPaid(true)
    setTimeout(onPaid, 1500)
  }

  async function handleCoupon() {
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_id: streamId, code: couponCode, user_phone: userEmail }),
      })
      const data = await res.json()
      if (!res.ok) { setCouponError(data.error ?? t('wrongCredentials')); return }
      if (onCouponSuccess) onCouponSuccess()
      else onPaid()
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90svh]">
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
        ) : (
          <>
            <div>
              <h2 className="text-xl font-black text-white">Escolha seu acesso</h2>
              <p className="text-gray-500 text-sm mt-1">Selecione um plano e gere seu QR Code PIX</p>
            </div>

            {paymentMethod === 'fixed_qr' ? (
              <div className="space-y-4">
                {fixedQrUrl ? (
                  <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                    <img src={fixedQrUrl} alt="QR Code PIX" className="w-48 h-48 object-contain" />
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-red-500 text-sm">QR Code não configurado.</p>
                  </div>
                )}
                <button onClick={handleFixedQrPaid} disabled={verifying} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl px-4 py-3 text-sm transition-all">
                  {verifying ? t('registering') : t('alreadyPaid')}
                </button>
                {verifyMsg && <p className="text-red-500 text-xs text-center">{verifyMsg}</p>}
              </div>
            ) : (
              <>
                {!qrcode && !generating && (
                  <div className="space-y-4">
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
                                {opt.popular && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#FF6A00,#FF8533)' }}>POPULAR</span>}
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
                              >i</button>
                            </div>
                          </button>
                          {tooltipFor === opt.id && (
                            <div className="mt-1 mx-1 rounded-xl px-3 py-2.5 space-y-1" style={{ background: 'rgba(255,106,0,0.07)', border: '1px solid rgba(255,106,0,0.2)' }}>
                              {opt.benefits.map((b, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                                  <span className="text-orange-400 font-bold">✓</span><span>{b}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                    <button onClick={generateQr} className="w-full bg-green-600 hover:bg-green-500 text-white font-black rounded-xl py-3 transition-all">
                      Gerar QR Code PIX
                    </button>
                  </div>
                )}
                {generating && <div className="py-10 text-center"><p className="text-gray-500 text-sm">{t('generating')}</p></div>}
                {qrcode && !error && (
                  <div className="space-y-4">
                    <button
                      onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setQrcode(null); setTransactionId(null); setVerifyMsg(''); setError('') }}
                      className="flex items-center gap-1 text-gray-500 hover:text-white text-sm transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Voltar e trocar opção
                    </button>
                    <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                      <QRCode value={qrcode} size={200} />
                    </div>
                    <button onClick={copy} className="w-full flex items-center justify-center gap-2 bg-[#1A1A26] hover:bg-[#2A2A3A] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm transition-all">
                      {copied ? <><Check className="w-4 h-4 text-green-500" /> {t('copied')}</> : <><Copy className="w-4 h-4" /> {t('copyPix')}</>}
                    </button>
                    <button onClick={checkManually} disabled={verifying} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl px-4 py-3 text-sm transition-all">
                      {verifying ? t('verifying') : t('alreadyPaid')}
                    </button>
                    {verifyMsg && <p className="text-yellow-500 text-xs text-center">{verifyMsg}</p>}
                    <p className="text-gray-600 text-xs text-center">{t('waitingPayment')}</p>

                    {couponEnabled && (
                      <div className="space-y-2 pt-1">
                        {!couponOpen ? (
                          <button
                            onClick={() => { setCouponOpen(true); setCouponError(''); setCouponCode('') }}
                            className="w-full relative overflow-hidden font-black py-3 text-sm transition-all rounded-xl border-2 border-yellow-400 text-yellow-900 hover:brightness-110"
                            style={{ background: 'linear-gradient(135deg, #f5c518 0%, #fde68a 40%, #f59e0b 60%, #f5c518 100%)' }}
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              🎟️ {t('haveCode')}
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
                              {couponLoading ? t('verifying') : '🎟️ ' + t('confirmCode')}
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
