'use client'

import { useState, useRef } from 'react'
import { Check } from 'lucide-react'

interface Props {
  streamId: string
  userEmail: string
  userName: string
  amount: number
  onPaid: () => void
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

export default function IronPayCardForm({ streamId, userEmail, userName, amount, onPaid }: Props) {
  const [cardNumber, setCardNumber] = useState('')
  const [holderName, setHolderName] = useState(userName)
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function handleSubmit() {
    setError('')
    const rawNumber = cardNumber.replace(/\s/g, '')
    const expiryParts = expiry.split('/')
    const expMonth = parseInt(expiryParts[0] ?? '', 10)
    const expYear = parseInt(expiryParts[1] ?? '', 10)

    if (rawNumber.length < 13) { setError('Número do cartão inválido'); return }
    if (!holderName.trim()) { setError('Informe o nome do titular'); return }
    if (!expMonth || !expYear || expMonth < 1 || expMonth > 12) { setError('Validade inválida'); return }
    if (cvv.length < 3) { setError('CVV inválido'); return }

    setLoading(true)

    const res = await fetch('/api/ironpay/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stream_id: streamId,
        user_email: userEmail,
        user_name: userName,
        card: {
          number: rawNumber,
          holder_name: holderName.trim(),
          exp_month: String(expMonth).padStart(2, '0'),
          exp_year: expYear < 100 ? 2000 + expYear : expYear,
          cvv,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao processar pagamento')
      setLoading(false)
      return
    }

    console.log('IronPay response:', JSON.stringify(data))

    const initialStatus = (data.status ?? '').toLowerCase()
    if (initialStatus === 'paid' || initialStatus === 'approved') {
      setPaid(true)
      setTimeout(onPaid, 1500)
      return
    }
    if (initialStatus && initialStatus !== 'pending' && initialStatus !== 'processing' && initialStatus !== 'waiting_payment') {
      setError('Pagamento recusado. Verifique os dados do cartão e tente novamente.')
      setLoading(false)
      return
    }

    const hash = data.transaction_hash ?? data.hash ?? data.id ?? null

    if (hash) {
      setLoading(false)
      setPolling(true)
      let pollCount = 0
      pollRef.current = setInterval(async () => {
        pollCount++
        const statusRes = await fetch(
          `/api/ironpay/status?transaction_hash=${hash}&stream_id=${streamId}&user_email=${encodeURIComponent(userEmail)}`
        )
        const statusData = await statusRes.json()
        const s = (statusData.status ?? '').toLowerCase()
        if (s === 'paid' || s === 'approved') {
          clearInterval(pollRef.current!)
          setPolling(false)
          setPaid(true)
          setTimeout(onPaid, 1500)
        } else if (s !== 'pending' && s !== 'processing' && s !== 'waiting_payment') {
          clearInterval(pollRef.current!)
          setPolling(false)
          setError('Pagamento recusado. Verifique os dados do cartão e tente novamente.')
        } else if (pollCount >= 20) {
          clearInterval(pollRef.current!)
          setPolling(false)
          setError('Tempo esgotado. Verifique se o pagamento foi aprovado e tente novamente.')
        }
      }, 3000)
    } else {
      setError('Resposta inesperada do gateway. Tente novamente.')
      setLoading(false)
    }
  }

  if (paid) {
    return (
      <div className="py-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-white font-bold text-lg">Pagamento confirmado!</p>
        <p className="text-gray-500 text-sm">Liberando acesso...</p>
      </div>
    )
  }

  const inputClass = "w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-600"

  return (
    <div className="space-y-4">
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
        <span className="text-gray-400 text-sm">Total</span>
        <span className="text-green-400 font-bold text-lg">R$ {amount.toFixed(2).replace('.', ',')}</span>
      </div>

      <div>
        <p className="text-gray-400 text-xs mb-1.5">Número do cartão</p>
        <input
          type="text"
          inputMode="numeric"
          value={cardNumber}
          onChange={e => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="0000 0000 0000 0000"
          className={inputClass}
        />
      </div>

      <div>
        <p className="text-gray-400 text-xs mb-1.5">Nome no cartão</p>
        <input
          type="text"
          value={holderName}
          onChange={e => setHolderName(e.target.value)}
          placeholder="Nome como está no cartão"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-gray-400 text-xs mb-1.5">Validade</p>
          <input
            type="text"
            inputMode="numeric"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            className={inputClass}
          />
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-1.5">CVV</p>
          <input
            type="text"
            inputMode="numeric"
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-xs text-center">{error}</p>}

      {polling && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-center space-y-1">
          <p className="text-blue-400 text-sm font-semibold">Aguardando confirmação...</p>
          <p className="text-gray-500 text-xs">O pagamento está sendo processado. Aguarde alguns segundos.</p>
        </div>
      )}

      {!polling && (
        <button
          onClick={handleSubmit}
          disabled={loading || !holderName.trim()}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all"
        >
          {loading ? 'Processando...' : 'Pagar agora'}
        </button>
      )}

      <p className="text-gray-600 text-xs text-center">🔒 Pagamento seguro · Cartão internacional aceito</p>
    </div>
  )
}
