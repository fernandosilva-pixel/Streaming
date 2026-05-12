'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ExternalLink } from 'lucide-react'

const CHECKOUT_URL = 'https://go.ironpayapp.com.br/ondjhpeeag'

interface Props {
  streamId: string
  userEmail: string
  userName: string
  amount: number
  onPaid: () => void
}

export default function IronPayCardForm({ streamId, userEmail, amount, onPaid }: Props) {
  const [polling, setPolling] = useState(false)
  const [paid, setPaid] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  function handleRedirect() {
    const url = `${CHECKOUT_URL}?utm_source=${streamId}&utm_campaign=${encodeURIComponent(userEmail)}`
    window.open(url, '_blank')
    setPolling(true)

    let count = 0
    pollRef.current = setInterval(async () => {
      count++
      const res = await fetch(
        `/api/ironpay/paid?stream_id=${streamId}&user_email=${encodeURIComponent(userEmail)}`
      )
      const data = await res.json()
      if (data.paid) {
        clearInterval(pollRef.current!)
        setPolling(false)
        setPaid(true)
        setTimeout(onPaid, 1500)
      } else if (count >= 40) {
        clearInterval(pollRef.current!)
        setPolling(false)
      }
    }, 3000)
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

      {!polling ? (
        <>
          <p className="text-gray-400 text-sm text-center">
            Você será redirecionado para a página de pagamento seguro. Após concluir, volte aqui — o acesso será liberado automaticamente.
          </p>
          <button
            onClick={handleRedirect}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Ir para pagamento seguro
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-4 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-blue-400 text-sm font-semibold">Aguardando confirmação do pagamento...</p>
            <p className="text-gray-500 text-xs">Conclua o pagamento na aba que foi aberta e volte aqui.</p>
          </div>
          <button
            onClick={handleRedirect}
            className="w-full bg-[#1a1a2e] border border-[#2A2A3A] hover:border-orange-500 text-gray-400 text-sm py-2.5 rounded-xl transition-all"
          >
            Abrir novamente
          </button>
        </div>
      )}

      <p className="text-gray-600 text-xs text-center">🔒 Pagamento seguro via IronPay · Cartão internacional aceito</p>
    </div>
  )
}
