'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Copy, Check, Users, DollarSign, MousePointer, ChevronLeft, Clock, XCircle, Link as LinkIcon } from 'lucide-react'

type PageState = 'loading' | 'unauthenticated' | 'not_applied' | 'pending' | 'rejected' | 'approved_no_code' | 'approved'

type Affiliate = {
  id: string
  name: string
  phone: string
  referral_code: string | null
  status: string
  clicks: number
  created_at: string
}

type Referral = {
  user_phone: string
  user_name: string
  registered_at: string
}

type Payment = {
  id: string
  user_phone: string
  stream_id: string
  amount: number
  status: string
  created_at: string
}

function fmtPhone(p: string) {
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return p
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value.toLocaleString('pt-BR')}</p>
        <p className="text-gray-500 text-xs">{label}</p>
      </div>
    </div>
  )
}

export default function AffiliatesPage() {
  const { user, initialized, showModal } = useAuth()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)

  const [formName, setFormName] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const [linkSlug, setLinkSlug] = useState('')
  const [linkError, setLinkError] = useState('')
  const [linkSaving, setLinkSaving] = useState(false)

  const [referrals, setReferrals] = useState<Referral[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [streamTitles, setStreamTitles] = useState<Map<string, string>>(new Map())
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!initialized) return
    if (!user) { setPageState('unauthenticated'); return }
    checkStatus()
  }, [initialized, user])

  async function checkStatus() {
    setPageState('loading')
    const { data } = await supabase.from('affiliates').select('*').eq('phone', user!.phone).maybeSingle()
    if (!data) { setPageState('not_applied'); return }
    setAffiliate(data)
    if (data.status === 'pending') { setPageState('pending'); return }
    if (data.status === 'rejected') { setPageState('rejected'); return }
    if (!data.referral_code) { setPageState('approved_no_code'); return }
    setPageState('approved')
    loadDashboard(data.referral_code, data)
  }

  async function loadDashboard(code: string, aff: Affiliate) {
    const [refRes, payRes] = await Promise.all([
      supabase.from('referrals').select('*').eq('referral_code', code).order('registered_at', { ascending: false }),
      supabase.from('payments').select('*').eq('referral_code', code).order('created_at', { ascending: false }),
    ])
    const refs: Referral[] = refRes.data ?? []
    const pays: Payment[] = payRes.data ?? []
    setReferrals(refs)
    setPayments(pays)

    const ids = [...new Set(pays.map(p => p.stream_id).filter(Boolean))]
    if (ids.length > 0) {
      const { data: streams } = await supabase.from('streams').select('id, title').in('id', ids)
      setStreamTitles(new Map((streams ?? []).map((s: { id: string; title: string }) => [s.id, s.title])))
    }

    // Refresh clicks count
    const { data: fresh } = await supabase.from('affiliates').select('clicks').eq('phone', user!.phone).single()
    if (fresh) setAffiliate({ ...aff, clicks: fresh.clicks })
  }

  async function submitApplication() {
    if (!formName.trim()) return
    setFormSubmitting(true)
    setFormError('')
    const { error } = await supabase.from('affiliates').insert({ name: formName.trim(), phone: user!.phone })
    if (error) { setFormError('Erro ao enviar. Tente novamente.'); setFormSubmitting(false); return }
    checkStatus()
  }

  async function createLink() {
    const slug = linkSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (slug.length < 3) { setLinkError('Mínimo 3 caracteres (letras, números, - ou _).'); return }
    setLinkSaving(true)
    setLinkError('')
    const { data: taken } = await supabase.from('affiliates').select('id').eq('referral_code', slug).maybeSingle()
    if (taken) { setLinkError('Esse apelido já está em uso. Escolha outro.'); setLinkSaving(false); return }
    const { error } = await supabase.from('affiliates').update({ referral_code: slug }).eq('phone', user!.phone)
    if (error) { setLinkError('Erro ao salvar. Tente novamente.'); setLinkSaving(false); return }
    const updated = { ...affiliate!, referral_code: slug }
    setAffiliate(updated)
    setPageState('approved')
    loadDashboard(slug, updated)
  }

  function copyLink() {
    const url = `${window.location.origin}?ref=${affiliate!.referral_code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const nameMap = new Map(referrals.map(r => [r.user_phone, r.user_name]))
  const qrPayments = payments.filter(p => p.status === 'PENDING')
  const paidPayments = payments.filter(p => p.status === 'PAID')
  const origin = typeof window !== 'undefined' ? window.location.origin : 'futzone.com'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Início
      </Link>

      {pageState === 'loading' && (
        <div className="flex items-center justify-center py-32">
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      )}

      {pageState === 'unauthenticated' && (
        <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-10 text-center space-y-4">
          <p className="text-4xl">🤝</p>
          <h1 className="text-2xl font-black text-white">Programa de Afiliados</h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Divulgue a Futzone e acompanhe em tempo real quantos usuários e pagamentos você gerou.
          </p>
          <button onClick={() => showModal('register')} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-xl transition-all">
            Criar conta e se candidatar
          </button>
          <p className="text-gray-600 text-xs">
            Já tem conta?{' '}
            <button onClick={() => showModal('login')} className="text-orange-500 hover:underline">Entrar</button>
          </p>
        </div>
      )}

      {pageState === 'not_applied' && (
        <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-8 space-y-5 max-w-lg mx-auto">
          <div className="text-center space-y-1">
            <p className="text-3xl">🤝</p>
            <h1 className="text-xl font-black text-white">Candidatura de Afiliado</h1>
            <p className="text-gray-400 text-sm">Preencha seu nome completo para enviar a candidatura. O admin irá analisar e aprovar.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">Seu nome completo</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Como o admin vai te identificar"
                className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
                style={{ fontSize: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">Telefone (conta logada)</label>
              <input
                disabled
                value={fmtPhone(user?.phone ?? '')}
                className="w-full rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                style={{ fontSize: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>
            {formError && <p className="text-red-400 text-sm">{formError}</p>}
            <button
              onClick={submitApplication}
              disabled={formSubmitting || !formName.trim()}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
            >
              {formSubmitting ? 'Enviando...' : 'Enviar candidatura'}
            </button>
          </div>
        </div>
      )}

      {pageState === 'pending' && (
        <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-10 text-center space-y-3">
          <Clock className="w-12 h-12 text-orange-500 mx-auto" />
          <h1 className="text-xl font-black text-white">Candidatura em análise</h1>
          <p className="text-gray-400 text-sm">Seu cadastro foi enviado e está aguardando aprovação do administrador. Volte em breve!</p>
        </div>
      )}

      {pageState === 'rejected' && (
        <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-10 text-center space-y-3">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-black text-white">Candidatura recusada</h1>
          <p className="text-gray-400 text-sm">Sua candidatura não foi aprovada. Entre em contato com o administrador para mais informações.</p>
        </div>
      )}

      {pageState === 'approved_no_code' && (
        <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-8 space-y-5 max-w-lg mx-auto">
          <div className="text-center space-y-1">
            <p className="text-3xl">🎉</p>
            <h1 className="text-xl font-black text-white">Candidatura aprovada!</h1>
            <p className="text-gray-400 text-sm">Agora crie o apelido do seu link de divulgação. Use apenas letras, números, hífen ou underline.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide">Seu apelido</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-gray-500 text-sm shrink-0">{origin}?ref=</span>
                <input
                  type="text"
                  value={linkSlug}
                  onChange={e => setLinkSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="meuapelido"
                  className="flex-1 bg-transparent text-white focus:outline-none"
                  style={{ fontSize: 16 }}
                />
              </div>
              {linkSlug && (
                <p className="text-gray-500 text-xs mt-1">
                  Seu link: <span className="text-orange-400">{origin}?ref={linkSlug}</span>
                </p>
              )}
            </div>
            {linkError && <p className="text-red-400 text-sm">{linkError}</p>}
            <button
              onClick={createLink}
              disabled={linkSaving || linkSlug.length < 3}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
            >
              {linkSaving ? 'Salvando...' : 'Criar meu link'}
            </button>
          </div>
        </div>
      )}

      {pageState === 'approved' && affiliate?.referral_code && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black text-white">Painel de Afiliado</h1>
            <p className="text-gray-500 text-sm mt-0.5">Olá, {affiliate.name}! Aqui estão suas métricas.</p>
          </div>

          {/* Link */}
          <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-orange-500 shrink-0" />
            <span className="text-orange-400 font-mono text-sm flex-1 truncate">{origin}?ref={affiliate.referral_code}</span>
            <button
              onClick={copyLink}
              className="shrink-0 flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Cliques no link" value={affiliate.clicks} icon={<MousePointer className="w-5 h-5" />} />
            <StatCard label="Cadastros" value={referrals.length} icon={<Users className="w-5 h-5" />} />
            <StatCard label="QR gerados" value={qrPayments.length} icon={<DollarSign className="w-5 h-5" />} />
            <StatCard label="Pagamentos" value={paidPayments.length} icon={<Check className="w-5 h-5" />} />
          </div>

          {/* Registrations table */}
          <div className="space-y-2">
            <h2 className="text-white font-bold">Cadastros via link <span className="text-gray-500 font-normal text-sm">({referrals.length})</span></h2>
            {referrals.length === 0 ? (
              <p className="text-gray-600 text-sm py-4 text-center bg-[#12121A] border border-[#2A2A3A] rounded-xl">Nenhum cadastro ainda.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#2A2A3A]">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[#2A2A3A] bg-[#12121A]">
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Nome</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Telefone</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Data</th>
                  </tr></thead>
                  <tbody>
                    {referrals.map((r, i) => (
                      <tr key={r.user_phone} className={`border-b border-[#1A1A26] ${i % 2 === 0 ? 'bg-[#0B0B0F]' : 'bg-[#12121A]'}`}>
                        <td className="px-4 py-2.5 text-white">{r.user_name}</td>
                        <td className="px-4 py-2.5 text-gray-400">{fmtPhone(r.user_phone)}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{fmtDate(r.registered_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* QR generated table */}
          <div className="space-y-2">
            <h2 className="text-white font-bold">Geraram QR (tentaram pagar) <span className="text-gray-500 font-normal text-sm">({qrPayments.length})</span></h2>
            {qrPayments.length === 0 ? (
              <p className="text-gray-600 text-sm py-4 text-center bg-[#12121A] border border-[#2A2A3A] rounded-xl">Nenhum QR gerado ainda.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#2A2A3A]">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[#2A2A3A] bg-[#12121A]">
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Nome</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Telefone</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Transmissão</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Data</th>
                  </tr></thead>
                  <tbody>
                    {qrPayments.map((p, i) => (
                      <tr key={p.id} className={`border-b border-[#1A1A26] ${i % 2 === 0 ? 'bg-[#0B0B0F]' : 'bg-[#12121A]'}`}>
                        <td className="px-4 py-2.5 text-white">{nameMap.get(p.user_phone) ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-400">{fmtPhone(p.user_phone)}</td>
                        <td className="px-4 py-2.5 text-gray-300">{streamTitles.get(p.stream_id) ?? p.stream_id?.slice(0, 8)}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{fmtDate(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paid table */}
          <div className="space-y-2">
            <h2 className="text-white font-bold">Pagamentos confirmados <span className="text-gray-500 font-normal text-sm">({paidPayments.length})</span></h2>
            {paidPayments.length === 0 ? (
              <p className="text-gray-600 text-sm py-4 text-center bg-[#12121A] border border-[#2A2A3A] rounded-xl">Nenhum pagamento confirmado ainda.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#2A2A3A]">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[#2A2A3A] bg-[#12121A]">
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Nome</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Telefone</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Transmissão</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Valor</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Data</th>
                  </tr></thead>
                  <tbody>
                    {paidPayments.map((p, i) => (
                      <tr key={p.id} className={`border-b border-[#1A1A26] ${i % 2 === 0 ? 'bg-[#0B0B0F]' : 'bg-[#12121A]'}`}>
                        <td className="px-4 py-2.5 text-white">{nameMap.get(p.user_phone) ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-400">{fmtPhone(p.user_phone)}</td>
                        <td className="px-4 py-2.5 text-gray-300">{streamTitles.get(p.stream_id) ?? p.stream_id?.slice(0, 8)}</td>
                        <td className="px-4 py-2.5 text-green-400 font-bold">R$ {p.amount?.toFixed(2).replace('.', ',') ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{fmtDate(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
