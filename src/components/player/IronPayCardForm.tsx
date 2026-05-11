'use client'

import { useState, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Check } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_IRONPAY_STRIPE_PK!)

interface Props {
  streamId: string
  userEmail: string
  userName: string
  amount: number
  onPaid: () => void
}

function CardForm({ streamId, userEmail, userName, amount, onPaid }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardName, setCardName] = useState(userName)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function handleSubmit() {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) { setLoading(false); return }

    const { token, error: stripeError } = await stripe.createToken(cardElement, { name: cardName })
    if (stripeError || !token) {
      setError(stripeError?.message ?? 'Erro ao processar cartão')
      setLoading(false)
      return
    }

    const res = await fetch('/api/ironpay/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stream_id: streamId, user_email: userEmail, user_name: userName, card_token: token.id }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao processar pagamento')
      setLoading(false)
      return
    }

    console.log('IronPay response:', JSON.stringify(data))

    if (data.status === 'paid' || data.status === 'approved') {
      setPaid(true)
      setTimeout(onPaid, 1500)
      return
    }

    const hash = data.transaction_hash ?? data.hash ?? data.id ?? null

    if (hash) {
      setLoading(false)
      setPolling(true)
      pollRef.current = setInterval(async () => {
        const statusRes = await fetch(
          `/api/ironpay/status?transaction_hash=${hash}&stream_id=${streamId}&user_email=${encodeURIComponent(userEmail)}`
        )
        const statusData = await statusRes.json()
        if (statusData.status === 'paid' || statusData.status === 'approved') {
          clearInterval(pollRef.current!)
          setPolling(false)
          setPaid(true)
          setTimeout(onPaid, 1500)
        } else if (statusData.status === 'canceled' || statusData.status === 'failed' || statusData.status === 'refused') {
          clearInterval(pollRef.current!)
          setPolling(false)
          setError('Pagamento recusado. Verifique os dados do cartão e tente novamente.')
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

  return (
    <div className="space-y-4">
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
        <span className="text-gray-400 text-sm">Total</span>
        <span className="text-green-400 font-bold text-lg">R$ {amount.toFixed(2).replace('.', ',')}</span>
      </div>

      <div>
        <p className="text-gray-400 text-xs mb-1.5">Nome no cartão</p>
        <input
          type="text"
          value={cardName}
          onChange={e => setCardName(e.target.value)}
          placeholder="Nome como está no cartão"
          className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      <div>
        <p className="text-gray-400 text-xs mb-1.5">Dados do cartão</p>
        <div className="bg-[#0B0B0F] border border-[#2A2A3A] rounded-xl px-3 py-3 focus-within:border-orange-500 transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#ffffff',
                  fontFamily: 'inherit',
                  '::placeholder': { color: '#6b7280' },
                },
                invalid: { color: '#ef4444' },
              },
            }}
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
          disabled={loading || !stripe || !cardName.trim()}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all"
        >
          {loading ? 'Processando...' : 'Pagar agora'}
        </button>
      )}

      <p className="text-gray-600 text-xs text-center">🔒 Pagamento seguro · Cartão internacional aceito</p>
    </div>
  )
}

export default function IronPayCardForm(props: Props) {
  return (
    <Elements stripe={stripePromise}>
      <CardForm {...props} />
    </Elements>
  )
}
