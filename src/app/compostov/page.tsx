'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Radio, Plus, Pencil, X, Megaphone, ImageIcon, Users, ChevronUp, ChevronDown, UserCheck, BarChart2, RefreshCw, CalendarDays, Headphones } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AdminSupport from '@/components/admin/AdminSupport'

type Fixture = {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
  }
  league: { id: number; name: string; country: string; logo: string }
  teams: {
    home: { name: string; logo: string }
    away: { name: string; logo: string }
  }
  goals: { home: number | null; away: number | null }
}

type Banner = {
  id: string
  image_url: string
  game_id: number | null
  stream_id: string | null
  display_order: number
}

type Stream = {
  id: string
  title: string
  stream_source: 'kick' | 'soop' | 'hls' | 'youtube'
  kick_channel: string | null
  soop_channel: string | null
  soop_broad_no: string | null
  hls_url: string | null
  youtube_url: string | null
  is_active: boolean
  is_live: boolean
  crop_enabled: boolean
  charge_enabled: boolean
  charge_amount: number
  payment_method: 'bspay' | 'fixed_qr' | 'ironpay' | null
  fixed_qr_url: string | null
  chat_enabled: boolean
  coupon_enabled: boolean
  coupon_code: string | null
  coupon_quantity: number
}

function FixtureRow({ f, selected, onSelect }: { f: Fixture; selected: boolean; onSelect: () => void }) {
  const isLive = ['1H', '2H', 'HT'].includes(f.fixture.status.short)
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
        selected ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] bg-[#12121A] hover:border-orange-500/30'
      }`}
    >
      <img src={f.league.logo} alt="" className="w-6 h-6 object-contain shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{f.teams.home.name} vs {f.teams.away.name}</p>
        <p className="text-gray-500 text-xs truncate">{f.league.name}</p>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        {isLive ? (
          <>
            <p className="text-white text-xs font-bold tabular-nums">{f.goals.home ?? 0} - {f.goals.away ?? 0}</p>
            <p className="text-orange-500 text-[10px] font-bold">{f.fixture.status.elapsed}' AO VIVO</p>
          </>
        ) : f.fixture.status.short === 'FT' ? (
          <p className="text-gray-500 text-xs">Encerrado</p>
        ) : (
          <p className="text-gray-400 text-xs">
            {new Date(f.fixture.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </button>
  )
}

export default function AdminPage() {
  const router = useRouter()

  // Banner principal
  const [banner, setBanner] = useState<Banner | null>(null)
  const [extraBanners, setExtraBanners] = useState<Banner[]>([])
  const [extraUploading, setExtraUploading] = useState(false)
  const [movingBanner, setMovingBanner] = useState<string | null>(null)

  // Próximos Jogos (carousel_banners)
  const [carouselBanners, setCarouselBanners] = useState<{ id: string; image_url: string; mobile_image_url: string | null; display_order: number }[]>([])
  const [carouselUploading, setCarouselUploading] = useState(false)
  const [isCarouselDragging, setIsCarouselDragging] = useState(false)

  // Fixtures / jogo em destaque
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [loadingFixtures, setLoadingFixtures] = useState(false)

  // Auth / misc
  const [authChecked, setAuthChecked] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [onlineList, setOnlineList] = useState<{ name: string; phone: string; country: string; flag: string; stream_id: string }[]>([])
  const [viewersByStream, setViewersByStream] = useState<Record<string, number>>({})
  const [showOnlineList, setShowOnlineList] = useState(false)
  const [chargedUsersByStream, setChargedUsersByStream] = useState<Record<string, string[]>>({})
  const [newChargedEmail, setNewChargedEmail] = useState<Record<string, string>>({})
  const [expandedViewers, setExpandedViewers] = useState<Set<string>>(new Set())
  const [chargeModal, setChargeModal] = useState<{ streamId: string; email: string } | null>(null)
  const [chargeModalMethod, setChargeModalMethod] = useState<'ironpay' | 'bspay' | 'fixed_qr'>('ironpay')
  const [chargeModalAmount, setChargeModalAmount] = useState('10.00')

  // Notificações de novos cadastros
  const [toasts, setToasts] = useState<{ id: string; name: string; phone: string }[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [isLogoDragging, setIsLogoDragging] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [logoSaved, setLogoSaved] = useState(false)
  const [homeChatEnabled, setHomeChatEnabled] = useState(true)

  // Favicon
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [faviconUploading, setFaviconUploading] = useState(false)
  const [isFaviconDragging, setIsFaviconDragging] = useState(false)
  const [faviconSaved, setFaviconSaved] = useState(false)

  // Acesso gratuito
  const [freeUsers, setFreeUsers] = useState<{ id: string; user_phone: string }[]>([])
  const [newFreePhone, setNewFreePhone] = useState('')
  const [addingFreeUser, setAddingFreeUser] = useState(false)

  // Streams
  const [streams, setStreams] = useState<Stream[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newSource, setNewSource] = useState<'kick' | 'soop' | 'hls' | 'youtube'>('kick')
  const [newChannel, setNewChannel] = useState('')
  const [newSoopChannel, setNewSoopChannel] = useState('')
  const [newSoopBroadNo, setNewSoopBroadNo] = useState('')
  const [newHlsUrl, setNewHlsUrl] = useState('')
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('')
  const [addingStream, setAddingStream] = useState(false)
  const [editTitles, setEditTitles] = useState<Record<string, string>>({})
  const [editChannels, setEditChannels] = useState<Record<string, string>>({})
  const [editSources, setEditSources] = useState<Record<string, 'kick' | 'soop' | 'hls' | 'youtube'>>({})
  const [editSoopChannels, setEditSoopChannels] = useState<Record<string, string>>({})
  const [editSoopBroadNos, setEditSoopBroadNos] = useState<Record<string, string>>({})
  const [editHlsUrls, setEditHlsUrls] = useState<Record<string, string>>({})
  const [editYoutubeUrls, setEditYoutubeUrls] = useState<Record<string, string>>({})
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({})
  const [chargeAmountModal, setChargeAmountModal] = useState<{ id: string } | null>(null)
  const [chargeAmountInput, setChargeAmountInput] = useState('')
  const [chargeAmountSaving, setChargeAmountSaving] = useState(false)
  const [chargeGateway, setChargeGateway] = useState<'bspay' | 'ironpay'>('bspay')
  const [savingChannel, setSavingChannel] = useState<string | null>(null)
  const [detectingBroad, setDetectingBroad] = useState<string | null>(null)
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null)

  // Pop-up para usuários
  const [popupMessage, setPopupMessage] = useState('')
  const [activePopup, setActivePopup] = useState<{ id: string; message: string } | null>(null)
  const [sendingPopup, setSendingPopup] = useState(false)
  const [closingPopup, setClosingPopup] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<{ label: string; text: string }[]>([])
  const [addingTemplate, setAddingTemplate] = useState(false)
  const [newTplLabel, setNewTplLabel] = useState('')
  const [newTplText, setNewTplText] = useState('')

  // CTA cards
  const [ctaCards, setCtaCards] = useState<{ id: string; slot: number; image_url: string | null; mobile_image_url: string | null; link_url: string | null }[]>([])
  const [ctaLinks, setCtaLinks] = useState<Record<number, string>>({})
  const [ctaDragging, setCtaDragging] = useState<number | null>(null)
  const [ctaUploading, setCtaUploading] = useState<number | null>(null)
  const [ctaMobileDragging, setCtaMobileDragging] = useState<number | null>(null)
  const [ctaMobileUploading, setCtaMobileUploading] = useState<number | null>(null)
  const [ctaLocalPreviews, setCtaLocalPreviews] = useState<Record<number, string>>({})
  const [ctaMobileLocalPreviews, setCtaMobileLocalPreviews] = useState<Record<number, string>>({})
  const [ctaLinkSaving, setCtaLinkSaving] = useState<Record<number, boolean>>({})

  // Moderadores do chat
  const [adminUsers, setAdminUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [newAdminPhone, setNewAdminPhone] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)

  // Aba ativa
  const [activeTab, setActiveTab] = useState<'visual' | 'transmissao' | 'acesso' | 'notificar' | 'afiliados' | 'dashboard' | 'admins' | 'agenda' | 'suporte'>('visual')

  // Permissões do admin logado (null = superadmin, array = abas permitidas)
  const [allowedTabs, setAllowedTabs] = useState<string[] | null>(null)

  // Gestão de sub-admins
  type SubAdmin = { email: string; name: string; allowed_tabs: string[]; created_at: string }
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
  const [subAdminsLoading, setSubAdminsLoading] = useState(false)
  const [newSubName, setNewSubName] = useState('')
  const [newSubEmail, setNewSubEmail] = useState('')
  const [newSubPassword, setNewSubPassword] = useState('')
  const [newSubTabs, setNewSubTabs] = useState<string[]>([])
  const [creatingSubAdmin, setCreatingSubAdmin] = useState(false)
  const [subAdminError, setSubAdminError] = useState('')

  // Agenda (schedule_notification)
  type ScheduleGame = { id: string; team1: string; team2: string; logo1: string; logo2: string; league: string; league_logo: string; datetime: string }
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [scheduleTitle, setScheduleTitle] = useState('Próximos Jogos')
  const [scheduleActive, setScheduleActive] = useState(false)
  const [scheduleGames, setScheduleGames] = useState<ScheduleGame[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [showAddGameForm, setShowAddGameForm] = useState(false)
  const [logo1Uploading, setLogo1Uploading] = useState(false)
  const [logo2Uploading, setLogo2Uploading] = useState(false)
  const [newGame, setNewGame] = useState<Omit<ScheduleGame, 'id'>>({ team1: '', team2: '', logo1: '', logo2: '', league: '', league_logo: '', datetime: '' })

  async function loadSchedule() {
    setScheduleLoading(true)
    const { data } = await supabase.from('schedule_notification').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle()
    if (data) {
      setScheduleId(data.id)
      setScheduleTitle(data.title || 'Próximos Jogos')
      setScheduleActive(data.is_active ?? false)
      setScheduleGames(data.games ?? [])
    }
    setScheduleLoading(false)
  }

  async function persistSchedule(games: ScheduleGame[], isActive: boolean, sid: string | null) {
    const payload = { title: scheduleTitle, is_active: isActive, games, updated_at: new Date().toISOString() }
    if (sid) {
      await supabase.from('schedule_notification').update(payload).eq('id', sid)
    } else {
      const { data } = await supabase.from('schedule_notification').insert(payload).select().single()
      if (data) setScheduleId(data.id)
    }
  }

  async function uploadTeamLogo(file: File, team: 1 | 2) {
    const setter = team === 1 ? setLogo1Uploading : setLogo2Uploading
    setter(true)
    const ext = file.name.split('.').pop() ?? 'png'
    const fileName = `team-logos/${Date.now()}-${team}.${ext}`
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType: file.type || 'image/png' })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
      setNewGame(p => ({ ...p, [team === 1 ? 'logo1' : 'logo2']: publicUrl }))
    }
    setter(false)
  }

  async function addGameToSchedule() {
    if (!newGame.team1.trim() || !newGame.team2.trim() || !newGame.datetime) return
    const game: ScheduleGame = { ...newGame, id: Date.now().toString(36) + Math.random().toString(36).slice(2) }
    const updated = [...scheduleGames, game]
    setScheduleGames(updated)
    setNewGame({ team1: '', team2: '', logo1: '', logo2: '', league: '', league_logo: '', datetime: '' })
    setShowAddGameForm(false)
    await persistSchedule(updated, scheduleActive, scheduleId)
  }

  async function removeGameFromSchedule(id: string) {
    const updated = scheduleGames.filter(g => g.id !== id)
    setScheduleGames(updated)
    await persistSchedule(updated, scheduleActive, scheduleId)
  }

  async function toggleScheduleActive() {
    const next = !scheduleActive
    setScheduleActive(next)
    await persistSchedule(scheduleGames, next, scheduleId)
  }

  useEffect(() => { if (activeTab === 'agenda') loadSchedule() }, [activeTab])

  // Dashboard
  type DashRegistration = { id?: string; name: string; phone: string; created_at?: string; whatsapp_added_at?: string | null }
  type DashPayment = { id: string; stream_id: string; user_phone: string; amount?: number; status: string; referral_code?: string | null; created_at?: string }
  const [dashLoading, setDashLoading] = useState(false)
  const [dashRegistrations, setDashRegistrations] = useState<DashRegistration[]>([])
  const [dashPayments, setDashPayments] = useState<DashPayment[]>([])
  const [dashStreamFilter, setDashStreamFilter] = useState<string>('all')
  const [dashDateFilter, setDashDateFilter] = useState<string>('all')
  const [regLimit, setRegLimit] = useState(5)
  const [payLimit, setPayLimit] = useState(5)
  const [waBatch, setWaBatch] = useState<{ running: boolean; total: number; done: number; skipped: number; errors: number } | null>(null)
  const waBatchStopRef = useRef(false)

  function stopWaBatch() {
    waBatchStopRef.current = true
    setWaBatch(prev => prev ? { ...prev, running: false } : null)
  }

  async function runWaBatch() {
    waBatchStopRef.current = false
    setWaBatch({ running: true, total: 0, done: 0, skipped: 0, errors: 0 })

    // Always reload all registrations from DB (no limit) to catch all BR numbers
    const { data } = await supabase
      .from('registrations')
      .select('phone, name, whatsapp_added_at')
      .is('whatsapp_added_at', null)
    const regs = (data ?? []) as DashRegistration[]

    // Accept any phone with 10+ digits (not an email)
    const pending = regs
      .map(r => ({ raw: r.phone ?? '', digits: r.phone?.replace(/\D/g, '') ?? '' }))
      .filter(({ digits }) => digits.length >= 10)

    setWaBatch({ running: true, total: pending.length, done: 0, skipped: 0, errors: 0 })
    let done = 0; let skipped = 0; let errors = 0
    for (const { digits } of pending) {
      try {
        const r = await fetch('/api/whatsapp/add-to-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: digits }),
        })
        const d = await r.json()
        if (d.ok) done++
        else if (d.detail?.value === false) skipped++ // sem WhatsApp
        else errors++
      } catch { errors++ }
      setWaBatch(prev => prev ? { ...prev, done, skipped, errors } : null)
      if (waBatchStopRef.current) break
      await new Promise(resolve => setTimeout(resolve, 300000))
      if (waBatchStopRef.current) break
    }
    setWaBatch({ running: false, total: pending.length, done, skipped, errors })
    loadAdminDashboard()
  }

  async function loadAdminDashboard() {
    setDashLoading(true)
    const [regRes, payRes] = await Promise.all([
      supabase.from('registrations').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(1000),
    ])
    setDashRegistrations(regRes.data ?? [])
    setDashPayments(payRes.data ?? [])
    setDashLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'dashboard') loadAdminDashboard()
  }, [activeTab])

  // Afiliados
  type AffiliateRecord = { id: string; name: string; phone: string; referral_code: string | null; status: string; clicks: number; created_at: string }
  const [affiliatesList, setAffiliatesList] = useState<AffiliateRecord[]>([])
  const [affiliatesLoading, setAffiliatesLoading] = useState(false)
  const [affiliateStats, setAffiliateStats] = useState<Record<string, { registrations: number; qrGenerated: number; qrPaid: number }>>({})


  // Modal de método de pagamento

  // Modal de código de acesso
  const [couponModal, setCouponModal] = useState<{ id: string } | null>(null)
  const [couponModalCode, setCouponModalCode] = useState('')
  const [couponModalQty, setCouponModalQty] = useState('50')
  const [couponModalSaving, setCouponModalSaving] = useState(false)
  const [couponUsedCounts, setCouponUsedCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/compostov/login'); return }
      const res = await fetch('/api/admin/permissions', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const { allowed_tabs } = await res.json()
        setAllowedTabs(allowed_tabs) // null = superadmin
      }
      setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    if (authChecked) {
      loadAllBanners()
      loadCarouselBanners()
      loadLogo()
      loadStreams()
      loadFreeAccess()
      loadAdminUsers()
      loadActivePopup()
      loadCtaCards()
      loadAffiliates()
      if (allowedTabs === null) loadSubAdmins()
    }
  }, [authChecked])

  async function loadAffiliates() {
    setAffiliatesLoading(true)
    const [{ data: affs }, { data: payments }, { data: referrals }] = await Promise.all([
      supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('referral_code, status').not('referral_code', 'is', null),
      supabase.from('referrals').select('referral_code'),
    ])
    setAffiliatesList(affs ?? [])
    const stats: Record<string, { registrations: number; qrGenerated: number; qrPaid: number }> = {}
    for (const p of payments ?? []) {
      if (!p.referral_code) continue
      if (!stats[p.referral_code]) stats[p.referral_code] = { registrations: 0, qrGenerated: 0, qrPaid: 0 }
      stats[p.referral_code].qrGenerated++
      if (p.status === 'PAID') stats[p.referral_code].qrPaid++
    }
    for (const r of referrals ?? []) {
      if (!r.referral_code) continue
      if (!stats[r.referral_code]) stats[r.referral_code] = { registrations: 0, qrGenerated: 0, qrPaid: 0 }
      stats[r.referral_code].registrations++
    }
    setAffiliateStats(stats)
    setAffiliatesLoading(false)
  }

  async function approveAffiliate(id: string) {
    await supabase.from('affiliates').update({ status: 'approved' }).eq('id', id)
    setAffiliatesList(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a))
  }

  async function rejectAffiliate(id: string) {
    await supabase.from('affiliates').update({ status: 'rejected' }).eq('id', id)
    setAffiliatesList(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a))
  }

  async function deleteAffiliate(id: string) {
    await supabase.from('affiliates').delete().eq('id', id)
    setAffiliatesList(prev => prev.filter(a => a.id !== id))
  }

  useEffect(() => { if (authChecked) loadFixtures() }, [date, authChecked])

  useEffect(() => {
    const channel = supabase.channel('site-presence')
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users = Object.values(state).flatMap((arr: unknown[]) =>
        arr.map((p: unknown) => {
          const presence = p as { name?: string; phone?: string; stream_id?: string; country?: string; flag?: string }
          return { name: presence.name ?? 'Usuário', phone: presence.phone ?? '', stream_id: presence.stream_id ?? '', country: presence.country ?? '', flag: presence.flag ?? '' }
        })
      )
      setOnlineUsers(users.length)
      setOnlineList(users)
      const counts: Record<string, number> = {}
      users.forEach(u => { if (u.stream_id) counts[u.stream_id] = (counts[u.stream_id] ?? 0) + 1 })
      setViewersByStream(counts)
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Realtime: novos cadastros
  useEffect(() => {
    if (!authChecked) return
    const channel = supabase
      .channel('new-registrations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registrations' }, payload => {
        const reg = payload.new as { id: string; name?: string; phone?: string; created_at?: string }
        const id = reg.id ?? String(Date.now())
        const name = reg.name ?? 'Novo usuário'
        const phone = reg.phone ?? ''
        setToasts(prev => [...prev, { id, name, phone }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000)
        setUnreadCount(prev => prev + 1)
        // Atualiza a tabela do dashboard em tempo real
        setDashRegistrations(prev => [{ ...reg, id, name, phone }, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [authChecked])

  // Favicon badge + título quando há notificações não lidas
  useEffect(() => {
    const base = 'Painel Admin'
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base
    updateFaviconBadge(unreadCount)
  }, [unreadCount])

  // Limpa ao focar na aba
  useEffect(() => {
    const onFocus = () => { setUnreadCount(0) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('futzone_popup_templates')
    if (saved) setCustomTemplates(JSON.parse(saved))
  }, [])

  function saveTemplate() {
    if (!newTplLabel.trim() || !newTplText.trim()) return
    const updated = [...customTemplates, { label: newTplLabel.trim(), text: newTplText.trim() }]
    setCustomTemplates(updated)
    localStorage.setItem('futzone_popup_templates', JSON.stringify(updated))
    setNewTplLabel('')
    setNewTplText('')
    setAddingTemplate(false)
  }

  function deleteTemplate(i: number) {
    const updated = customTemplates.filter((_, idx) => idx !== i)
    setCustomTemplates(updated)
    localStorage.setItem('futzone_popup_templates', JSON.stringify(updated))
  }

  function updateFaviconBadge(count: number) {
    const canvas = document.createElement('canvas')
    canvas.width = 32; canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const draw = (base?: HTMLImageElement) => {
      ctx.clearRect(0, 0, 32, 32)
      if (base) ctx.drawImage(base, 0, 0, 32, 32)
      if (count > 0) {
        ctx.fillStyle = '#ef4444'
        ctx.beginPath(); ctx.arc(24, 8, 9, 0, 2 * Math.PI); ctx.fill()
        ctx.fillStyle = 'white'
        ctx.font = 'bold 11px Arial'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(count > 9 ? '9+' : String(count), 24, 8)
      }
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") ?? Object.assign(document.createElement('link'), { rel: 'icon' })
      link.href = canvas.toDataURL()
      document.head.appendChild(link)
    }
    const img = new Image()
    img.onload = () => draw(img)
    img.onerror = () => draw()
    img.src = '/favicon.ico'
  }

  async function loadAllBanners() {
    const { data } = await supabase.from('banner').select('*').order('display_order')
    if (!data || data.length === 0) { setBanner(null); setExtraBanners([]); return }
    const [first, ...rest] = data
    setBanner(first)
    setSelectedGameId(first.game_id)
    setExtraBanners(rest)
  }

  async function moveBanner(id: string, direction: 'up' | 'down') {
    const all = [banner, ...extraBanners].filter(Boolean) as Banner[]
    const idx = all.findIndex(b => b.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= all.length) return
    setMovingBanner(id)
    const newOrder = [...all]
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    await Promise.all(newOrder.map((b, i) =>
      supabase.from('banner').update({ display_order: i }).eq('id', b!.id)
    ))
    await loadAllBanners()
    setMovingBanner(null)
  }

  async function loadStreams() {
    const { data } = await supabase.from('streams').select('*').order('created_at', { ascending: false })
    const list = data ?? []
    setStreams(list)
    const initial: Record<string, string> = {}
    const initialSources: Record<string, 'kick' | 'soop' | 'hls' | 'youtube'> = {}
    const initialSoopChannels: Record<string, string> = {}
    const initialSoopBroadNos: Record<string, string> = {}
    const initialHlsUrls: Record<string, string> = {}
    const initialYoutubeUrls: Record<string, string> = {}
    const initialAmounts: Record<string, string> = {}
    list.forEach((s: Stream) => {
      initial[s.id] = s.kick_channel ?? ''
      initialSources[s.id] = s.stream_source ?? 'kick'
      initialSoopChannels[s.id] = s.soop_channel ?? ''
      initialSoopBroadNos[s.id] = s.soop_broad_no ?? ''
      initialHlsUrls[s.id] = s.hls_url ?? ''
      initialYoutubeUrls[s.id] = s.youtube_url ?? ''
      initialAmounts[s.id] = String(s.charge_amount ?? '10.00')
    })
    setEditChannels(initial)
    setEditSources(initialSources)
    setEditSoopChannels(initialSoopChannels)
    setEditSoopBroadNos(initialSoopBroadNos)
    setEditHlsUrls(initialHlsUrls)
    setEditYoutubeUrls(initialYoutubeUrls)
    setEditAmounts(initialAmounts)
    loadCouponUsedCounts(list.map((s: Stream) => s.id))
    // Load individually charged users for all streams
    const { data: charged } = await supabase.from('stream_charged_users').select('stream_id, user_email')
    if (charged) {
      const map: Record<string, string[]> = {}
      charged.forEach((r: { stream_id: string; user_email: string }) => {
        if (!map[r.stream_id]) map[r.stream_id] = []
        map[r.stream_id].push(r.user_email)
      })
      setChargedUsersByStream(map)
    }
  }

  function addChargedUser(streamId: string) {
    const email = (newChargedEmail[streamId] ?? '').trim().toLowerCase()
    if (!email) return
    setChargeModal({ streamId, email })
    setChargeModalMethod('ironpay')
    setChargeModalAmount('10.00')
  }

  async function confirmChargedUser() {
    if (!chargeModal) return
    const { streamId, email } = chargeModal
    await supabase.from('stream_charged_users').upsert(
      { stream_id: streamId, user_email: email, payment_method: chargeModalMethod, charge_amount: parseFloat(chargeModalAmount) },
      { onConflict: 'stream_id,user_email' }
    )
    setChargedUsersByStream(prev => ({
      ...prev,
      [streamId]: [...new Set([...(prev[streamId] ?? []), email])],
    }))
    setNewChargedEmail(prev => ({ ...prev, [streamId]: '' }))
    setChargeModal(null)
  }

  async function removeChargedUser(streamId: string, email: string) {
    await supabase.from('stream_charged_users').delete().eq('stream_id', streamId).eq('user_email', email)
    setChargedUsersByStream(prev => ({
      ...prev,
      [streamId]: (prev[streamId] ?? []).filter(e => e !== email),
    }))
  }

  function extractYoutubeId(input: string): string {
    const s = input.trim()
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
    try {
      const url = new URL(s)
      if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('?')[0]
      if (url.pathname.startsWith('/live/')) return url.pathname.split('/live/')[1].split('?')[0]
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/embed/')[1].split('?')[0]
      return url.searchParams.get('v') ?? s
    } catch {
      return s
    }
  }

  async function addStream() {
    if (!newTitle.trim()) return
    if (newSource === 'kick' && !newChannel.trim()) return
    if (newSource === 'soop' && !newSoopChannel.trim()) return
    if (newSource === 'hls' && !newHlsUrl.trim()) return
    if (newSource === 'youtube' && !newYoutubeUrl.trim()) return
    setAddingStream(true)
    const { error } = await supabase.from('streams').insert({
      title: newTitle.trim(),
      stream_source: newSource,
      kick_channel: newSource === 'kick' ? newChannel.trim().replace(/\s/g, '') : null,
      soop_channel: newSource === 'soop' ? newSoopChannel.trim().replace(/\s/g, '') : null,
      soop_broad_no: newSource === 'soop' && newSoopBroadNo.trim() ? newSoopBroadNo.trim() : null,
      hls_url: newSource === 'hls' ? newHlsUrl.trim() : null,
      youtube_url: newSource === 'youtube' ? extractYoutubeId(newYoutubeUrl) : null,
    })
    if (error) { alert('Erro ao adicionar transmissão: ' + error.message); setAddingStream(false); return }
    setNewTitle(''); setNewChannel(''); setNewSoopChannel(''); setNewSoopBroadNo(''); setNewHlsUrl(''); setNewYoutubeUrl('')
    await loadStreams()
    setAddingStream(false)
  }

  async function detectSoopBroadcast(id: string) {
    const channel = editSoopChannels[id]
    if (!channel) return
    setDetectingBroad(id)
    const res = await fetch(`/api/soop/broadcast?bjid=${channel}`)
    const data = await res.json()
    if (data.broad_no) setEditSoopBroadNos(prev => ({ ...prev, [id]: String(data.broad_no) }))
    else alert('Canal não encontrado ao vivo na Sooplive')
    setDetectingBroad(null)
  }

  async function toggleChat(id: string, value: boolean) {
    const { error } = await supabase.from('streams').update({ chat_enabled: value }).eq('id', id)
    if (!error) setStreams(prev => prev.map(s => s.id === id ? { ...s, chat_enabled: value } : s))
  }

  async function toggleCharge(id: string, value: boolean) {
    const update = value
      ? { charge_enabled: true, payment_method: 'bspay' as const, fixed_qr_url: null }
      : { charge_enabled: false }
    const { error } = await supabase.from('streams').update(update).eq('id', id)
    if (error) { alert('Erro ao salvar cobrança: ' + error.message); return }
    setStreams(prev => prev.map(s => s.id === id ? { ...s, ...update } : s))
  }

  async function saveAmount(id: string) {
    const amount = parseFloat(editAmounts[id])
    if (isNaN(amount) || amount <= 0) return
    await supabase.from('streams').update({ charge_amount: amount }).eq('id', id)
    setStreams(prev => prev.map(s => s.id === id ? { ...s, charge_amount: amount } : s))
  }

  async function saveChannel(id: string) {
    const source = editSources[id] ?? 'kick'
    const current = streams.find(s => s.id === id)
    setSavingChannel(id)
    const title = editTitles[id]?.trim()
    const baseUpdate: Record<string, unknown> = title ? { title } : {}
    if (source === 'kick') {
      const channel = editChannels[id]?.trim().replace(/\s/g, '') || current?.kick_channel || ''
      if (!channel) { setSavingChannel(null); return }
      await supabase.from('streams').update({ ...baseUpdate, stream_source: 'kick', kick_channel: channel, soop_channel: null, soop_broad_no: null, hls_url: null }).eq('id', id)
    } else if (source === 'soop') {
      const soopChannel = editSoopChannels[id]?.trim().replace(/\s/g, '') || current?.soop_channel || ''
      const soopBroadNo = editSoopBroadNos[id]?.trim() || current?.soop_broad_no || null
      if (!soopChannel) { setSavingChannel(null); return }
      await supabase.from('streams').update({ ...baseUpdate, stream_source: 'soop', kick_channel: null, soop_channel: soopChannel, soop_broad_no: soopBroadNo, hls_url: null }).eq('id', id)
    } else if (source === 'hls') {
      const hlsUrl = editHlsUrls[id]?.trim() || current?.hls_url || ''
      if (!hlsUrl) { setSavingChannel(null); return }
      await supabase.from('streams').update({ ...baseUpdate, stream_source: 'hls', kick_channel: null, soop_channel: null, soop_broad_no: null, hls_url: hlsUrl, youtube_url: null }).eq('id', id)
    } else {
      const youtubeId = extractYoutubeId(editYoutubeUrls[id] ?? current?.youtube_url ?? '')
      if (!youtubeId) { setSavingChannel(null); return }
      await supabase.from('streams').update({ ...baseUpdate, stream_source: 'youtube', kick_channel: null, soop_channel: null, soop_broad_no: null, hls_url: null, youtube_url: youtubeId }).eq('id', id)
    }
    await loadStreams()
    setSavingChannel(null)
  }

  async function deleteStream(id: string) {
    await supabase.from('streams').delete().eq('id', id)
    setStreams(prev => prev.filter(s => s.id !== id))
  }

  async function loadFixtures() {
    setLoadingFixtures(true)
    try {
      const res = await fetch(`/api/football/fixtures?date=${date}`)
      const data = await res.json()
      setFixtures(data.response ?? [])
    } finally {
      setLoadingFixtures(false)
    }
  }

  function isImageFile(file: File) {
    return file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg')
  }

  function getContentType(file: File) {
    return file.type || (file.name.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream')
  }


  // Carrossel extra: upload direto, salva como nova linha
  async function handleExtraFile(file: File) {
    if (!isImageFile(file)) return
    setExtraUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `banner-extra-${Date.now()}.${ext}`
    const contentType = getContentType(file)
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType })
    if (error) { alert('Erro no upload: ' + error.message); setExtraUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    const nextOrder = [banner, ...extraBanners].filter(Boolean).length
    await supabase.from('banner').insert({ image_url: publicUrl, game_id: null, display_order: nextOrder })
    await loadAllBanners()
    setExtraUploading(false)
  }

  async function deleteExtraBanner(id: string) {
    await supabase.from('banner').delete().eq('id', id)
    setExtraBanners(prev => prev.filter(b => b.id !== id))
  }

  async function deleteMainBanner() {
    if (!banner) return
    if (!confirm('Remover o banner principal? A página inicial ficará sem banner.')) return
    await supabase.from('banner').delete().eq('id', banner.id)
    setBanner(null)
  }

  async function loadCarouselBanners() {
    const { data } = await supabase.from('carousel_banners').select('*').order('display_order')
    setCarouselBanners(data ?? [])
  }

  async function handleCarouselFile(file: File) {
    if (!isImageFile(file)) return
    setCarouselUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `carousel-${Date.now()}.${ext}`
    const contentType = getContentType(file)
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType })
    if (error) { alert('Erro no upload: ' + error.message); setCarouselUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    await supabase.from('carousel_banners').insert({ image_url: publicUrl, display_order: carouselBanners.length })
    await loadCarouselBanners()
    setCarouselUploading(false)
  }

  async function handleCarouselMobileFile(bannerId: string, file: File) {
    if (!isImageFile(file)) return
    const ext = file.name.split('.').pop()
    const fileName = `carousel-mobile-${Date.now()}.${ext}`
    const contentType = getContentType(file)
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType })
    if (error) { alert('Erro no upload: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    await supabase.from('carousel_banners').update({ mobile_image_url: publicUrl }).eq('id', bannerId)
    await loadCarouselBanners()
  }

  async function deleteCarouselBanner(id: string) {
    await supabase.from('carousel_banners').delete().eq('id', id)
    setCarouselBanners(prev => prev.filter(b => b.id !== id))
  }

  async function loadLogo() {
    const { data } = await supabase.from('site_settings').select('*').maybeSingle()
    if (data) {
      setSettingsId(data.id)
      if (data.logo_url) setLogoUrl(data.logo_url)
      if (data.favicon_url) setFaviconUrl(data.favicon_url)
      setHomeChatEnabled(data.home_chat_enabled !== false)
    }
  }

  async function loadCtaCards() {
    const { data } = await supabase.from('cta_cards').select('*').order('slot')
    const loaded = data ?? []
    // Inicializa slots ausentes sem depender de colunas opcionais
    const existingSlots = loaded.map(c => c.slot)
    const missing = [0, 1, 2, 3, 4].filter(s => !existingSlots.includes(s))
    if (missing.length > 0) {
      const { error: insertErr } = await supabase.from('cta_cards').insert(
        missing.map(s => ({ slot: s, image_url: null, link_url: null }))
      )
      if (insertErr) console.error('Erro ao inicializar slots CTA:', insertErr.message)
      const { data: fresh } = await supabase.from('cta_cards').select('*').order('slot')
      const rows = fresh ?? loaded
      setCtaCards(rows)
      const links: Record<number, string> = {}
      rows.forEach(c => { links[c.slot] = c.link_url ?? '' })
      setCtaLinks(links)
    } else {
      setCtaCards(loaded)
      const links: Record<number, string> = {}
      loaded.forEach(c => { links[c.slot] = c.link_url ?? '' })
      setCtaLinks(links)
    }
  }

  async function ctaUpsert(slot: number, patch: Record<string, unknown>) {
    const exists = ctaCards.some(c => c.slot === slot)
    if (exists) {
      return supabase.from('cta_cards').update(patch).eq('slot', slot)
    }
    return supabase.from('cta_cards').insert({ slot, image_url: null, link_url: null, ...patch })
  }

  async function handleCtaCardUpload(slot: number, file: File) {
    if (!isImageFile(file)) return
    setCtaLocalPreviews(p => ({ ...p, [slot]: URL.createObjectURL(file) }))
    setCtaUploading(slot)
    const ext = file.name.split('.').pop()
    const fileName = `cta-${slot}-${Date.now()}.${ext}`
    const contentType = getContentType(file)
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType })
    if (error) { alert('Erro no upload: ' + error.message); setCtaUploading(null); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    const { error: dbErr } = await ctaUpsert(slot, { image_url: publicUrl })
    if (dbErr) { alert('Erro ao salvar imagem: ' + dbErr.message); setCtaUploading(null); return }
    await loadCtaCards()
    setCtaUploading(null)
  }

  async function handleCtaMobileUpload(slot: number, file: File) {
    if (!isImageFile(file)) return
    setCtaMobileLocalPreviews(p => ({ ...p, [slot]: URL.createObjectURL(file) }))
    setCtaMobileUploading(slot)
    const ext = file.name.split('.').pop()
    const fileName = `cta-mobile-${slot}-${Date.now()}.${ext}`
    const contentType = getContentType(file)
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType })
    if (error) { alert('Erro no upload: ' + error.message); setCtaMobileUploading(null); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    const { error: dbErr } = await ctaUpsert(slot, { mobile_image_url: publicUrl })
    if (dbErr) { alert('Erro ao salvar imagem mobile: ' + dbErr.message); setCtaMobileUploading(null); return }
    await loadCtaCards()
    setCtaMobileUploading(null)
  }

  async function handleCtaLinkSave(slot: number) {
    setCtaLinkSaving(p => ({ ...p, [slot]: true }))
    const { error } = await ctaUpsert(slot, { link_url: ctaLinks[slot] || null })
    if (error) { alert('Erro ao salvar link: ' + error.message) }
    else await loadCtaCards()
    setCtaLinkSaving(p => ({ ...p, [slot]: false }))
  }

  async function deleteCtaImage(slot: number, type: 'desktop' | 'mobile') {
    const field = type === 'mobile' ? 'mobile_image_url' : 'image_url'
    const { error } = await ctaUpsert(slot, { [field]: null })
    if (error) { alert('Erro ao remover imagem: ' + error.message); return }
    if (type === 'mobile') setCtaMobileLocalPreviews(p => { const n = { ...p }; delete n[slot]; return n })
    else setCtaLocalPreviews(p => { const n = { ...p }; delete n[slot]; return n })
    await loadCtaCards()
  }

  async function toggleLive(id: string, value: boolean) {
    const { error } = await supabase.from('streams').update({ is_live: value }).eq('id', id)
    if (error) { alert('Erro ao atualizar status ao vivo: ' + error.message); return }
    setStreams(prev => prev.map(s => s.id === id ? { ...s, is_live: value } : s))
  }

  const [refreshing, setRefreshing] = useState(false)
  async function forceRefreshViewers() {
    setRefreshing(true)
    const { error } = await supabase.from('streams')
      .update({ force_refresh_at: new Date().toISOString() })
      .not('id', 'is', null)
    if (error) alert('Erro ao enviar: ' + error.message)
    setRefreshing(false)
  }

  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  async function syncPayments() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/pix/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) { setSyncResult('Erro: ' + data.error) }
      else { setSyncResult(`✓ ${data.updated} pagamento(s) atualizado(s) de ${data.checked} verificado(s)`) }
    } catch { setSyncResult('Erro de conexão.') }
    setSyncing(false)
    setTimeout(() => setSyncResult(null), 8000)
  }

  async function handleLogoFile(file: File) {
    if (!isImageFile(file)) return
    setLogoUploading(true); setLogoSaved(false)
    const ext = file.name.split('.').pop()
    const fileName = `logo-${Date.now()}.${ext}`
    const contentType = getContentType(file)
    const { error: storageError } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType })
    if (storageError) { alert('Erro no upload: ' + storageError.message); setLogoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    const { error: dbError } = settingsId
      ? await supabase.from('site_settings').update({ logo_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', settingsId)
      : await supabase.from('site_settings').insert({ logo_url: publicUrl })
    if (dbError) { alert('Erro ao salvar: ' + dbError.message); setLogoUploading(false); return }
    setLogoUrl(publicUrl); setLogoUploading(false); setLogoSaved(true)
  }

  async function handleFaviconFile(file: File) {
    const allowed = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowed.includes(file.type) && !file.name.endsWith('.ico')) {
      alert('Formato inválido. Use .ico, .png, .svg ou .webp')
      return
    }
    setFaviconUploading(true); setFaviconSaved(false)
    const ext = file.name.split('.').pop() ?? 'ico'
    const fileName = `site-favicon.${ext}`
    const contentType = file.type || 'image/x-icon'
    const { error: storageError } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType })
    if (storageError) { alert('Erro no upload: ' + storageError.message); setFaviconUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    const payload = { favicon_url: publicUrl, updated_at: new Date().toISOString() }
    const { error: dbError } = settingsId
      ? await supabase.from('site_settings').update(payload).eq('id', settingsId)
      : await supabase.from('site_settings').insert({ ...payload })
    if (dbError) { alert('Erro ao salvar: ' + dbError.message); setFaviconUploading(false); return }
    if (!settingsId) {
      const { data } = await supabase.from('site_settings').select('id').maybeSingle()
      if (data) setSettingsId(data.id)
    }
    setFaviconUrl(publicUrl); setFaviconUploading(false); setFaviconSaved(true)
  }

  async function toggleHomeChat() {
    const next = !homeChatEnabled
    setHomeChatEnabled(next)
    const payload = { home_chat_enabled: next, updated_at: new Date().toISOString() }
    if (settingsId) {
      await supabase.from('site_settings').update(payload).eq('id', settingsId)
    } else {
      const { data } = await supabase.from('site_settings').insert(payload).select('id').single()
      if (data) setSettingsId(data.id)
    }
  }

  async function loadFreeAccess() {
    const { data } = await supabase.from('free_access').select('*').order('created_at')
    setFreeUsers(data ?? [])
  }

  async function addFreeAccess() {
    const email = newFreePhone.trim().toLowerCase()
    if (!email) return
    setAddingFreeUser(true)
    const { error } = await supabase.from('free_access').insert({ user_phone: email })
    if (error) { alert('Erro: ' + (error.message.includes('unique') ? 'Esse e-mail já tem acesso gratuito.' : error.message)); setAddingFreeUser(false); return }
    setNewFreePhone('')
    await loadFreeAccess()
    setAddingFreeUser(false)
  }

  async function deleteFreeAccess(id: string) {
    await supabase.from('free_access').delete().eq('id', id)
    setFreeUsers(prev => prev.filter(u => u.id !== id))
  }

  async function loadAdminUsers() {
    const { data } = await supabase
      .from('registrations')
      .select('id, name, email')
      .eq('is_admin', true)
      .order('name')
    setAdminUsers(data ?? [])
  }

  async function addAdminUser() {
    const email = newAdminPhone.trim().toLowerCase()
    if (!email) return
    setAddingAdmin(true)
    const { data, error } = await supabase
      .from('registrations')
      .update({ is_admin: true })
      .eq('email', email)
      .select('id, name, email')
      .single()
    if (error || !data) {
      alert(error ? 'Erro: ' + error.message : 'E-mail não encontrado.')
      setAddingAdmin(false)
      return
    }
    setNewAdminPhone('')
    await loadAdminUsers()
    setAddingAdmin(false)
  }

  async function removeAdminUser(id: string) {
    await supabase.from('registrations').update({ is_admin: false }).eq('id', id)
    setAdminUsers(prev => prev.filter(u => u.id !== id))
  }

  async function loadActivePopup() {
    const { data } = await supabase
      .from('popup_messages')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setActivePopup(data ?? null)
  }

  async function sendPopup(overrideText?: string) {
    const text = overrideText ?? popupMessage
    if (!text.trim()) return
    setSendingPopup(true)
    await supabase.from('popup_messages').update({ active: false }).eq('active', true)
    const { data } = await supabase
      .from('popup_messages')
      .insert({ message: text.trim(), active: true })
      .select()
      .single()
    if (data) setActivePopup(data)
    setPopupMessage('')
    setSendingPopup(false)
  }

  async function closePopup() {
    if (!activePopup) return
    setClosingPopup(true)
    await supabase.from('popup_messages').update({ active: false }).eq('id', activePopup.id)
    setActivePopup(null)
    setClosingPopup(false)
  }

  async function confirmChargeAmountModal() {
    if (!chargeAmountModal) return
    const amount = parseFloat(chargeAmountInput.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) { alert('Digite um valor válido'); return }
    setChargeAmountSaving(true)
    const { error } = await supabase.from('streams').update({
      charge_enabled: true,
      payment_method: chargeGateway,
      fixed_qr_url: null,
      charge_amount: amount,
    }).eq('id', chargeAmountModal.id)
    if (error) { alert('Erro: ' + error.message); setChargeAmountSaving(false); return }
    setStreams(prev => prev.map(s => s.id === chargeAmountModal.id
      ? { ...s, charge_enabled: true, payment_method: chargeGateway, fixed_qr_url: null, charge_amount: amount }
      : s
    ))
    setChargeAmountModal(null)
    setChargeAmountInput('')
    setChargeAmountSaving(false)
  }

  async function toggleCoupon(id: string, value: boolean) {
    if (value) {
      setCouponModalCode('')
      setCouponModalQty('50')
      setCouponModal({ id })
      return
    }
    const { error } = await supabase.from('streams').update({ coupon_enabled: false }).eq('id', id)
    if (error) { alert('Erro: ' + error.message); return }
    setStreams(prev => prev.map(s => s.id === id ? { ...s, coupon_enabled: false } : s))
  }

  async function confirmCouponModal() {
    if (!couponModal) return
    const code = couponModalCode.trim()
    const qty = parseInt(couponModalQty)
    if (!code) { alert('Digite um código'); return }
    if (isNaN(qty) || qty < 1) { alert('Quantidade inválida'); return }
    setCouponModalSaving(true)
    const { error } = await supabase.from('streams').update({
      coupon_enabled: true,
      coupon_code: code,
      coupon_quantity: qty,
    }).eq('id', couponModal.id)
    if (error) { alert('Erro: ' + error.message); setCouponModalSaving(false); return }
    setStreams(prev => prev.map(s => s.id === couponModal.id
      ? { ...s, coupon_enabled: true, coupon_code: code, coupon_quantity: qty }
      : s
    ))
    setCouponModal(null)
    setCouponModalSaving(false)
  }

  async function loadCouponUsedCounts(streamIds: string[]) {
    if (!streamIds.length) return
    const results = await Promise.all(
      streamIds.map(id =>
        supabase.from('coupon_uses').select('id', { count: 'exact', head: true }).eq('stream_id', id)
          .then(({ count }) => ({ id, count: count ?? 0 }))
      )
    )
    const map: Record<string, number> = {}
    for (const r of results) map[r.id] = r.count
    setCouponUsedCounts(map)
  }


  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/compostov/login')
  }

  async function loadSubAdmins() {
    setSubAdminsLoading(true)
    const res = await fetch('/api/admin/sub')
    if (res.ok) { const { admins } = await res.json(); setSubAdmins(admins) }
    setSubAdminsLoading(false)
  }

  async function createSubAdmin() {
    setSubAdminError('')
    if (!newSubName.trim() || !newSubEmail.trim() || !newSubPassword.trim() || !newSubTabs.length) {
      setSubAdminError('Preencha todos os campos e selecione ao menos uma aba.')
      return
    }
    setCreatingSubAdmin(true)
    const res = await fetch('/api/admin/sub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSubName.trim(), email: newSubEmail.trim().toLowerCase(), password: newSubPassword, allowed_tabs: newSubTabs }),
    })
    const data = await res.json()
    if (!res.ok) { setSubAdminError(data.error ?? 'Erro ao criar acesso'); setCreatingSubAdmin(false); return }
    setNewSubName(''); setNewSubEmail(''); setNewSubPassword(''); setNewSubTabs([])
    await loadSubAdmins()
    setCreatingSubAdmin(false)
  }

  async function deleteSubAdmin(email: string) {
    if (!confirm(`Remover acesso de ${email}?`)) return
    await fetch('/api/admin/sub', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    setSubAdmins(prev => prev.filter(a => a.email !== email))
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Verificando acesso...</p>
      </div>
    )
  }

  const INTERNATIONAL_LEAGUES = new Set([2, 3, 13, 14])
  const searchMatch = (f: Fixture) =>
    f.teams.home.name.toLowerCase().includes(search.toLowerCase()) ||
    f.teams.away.name.toLowerCase().includes(search.toLowerCase()) ||
    f.league.name.toLowerCase().includes(search.toLowerCase())
  const brazilFixtures = fixtures.filter(f => f.league.country === 'Brazil').filter(searchMatch)
  const internationalFixtures = fixtures.filter(f => INTERNATIONAL_LEAGUES.has(f.league.id)).filter(searchMatch)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Painel Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie o site</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowOnlineList(v => !v)}
              className="flex items-center gap-2 bg-[#12121A] border border-[#2A2A3A] hover:border-green-500/40 px-4 py-2 rounded-xl transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-white font-bold text-sm tabular-nums">{onlineUsers}</span>
              <span className="text-gray-500 text-sm">online agora</span>
            </button>
            {showOnlineList && (
              <div className="absolute right-0 top-11 z-50 bg-[#12121A] border border-[#2A2A3A] rounded-xl shadow-xl min-w-56 max-h-72 overflow-y-auto">
                {onlineList.length === 0 ? (
                  <p className="text-gray-500 text-sm px-4 py-3">Ninguém online</p>
                ) : (
                  <ul className="divide-y divide-[#2A2A3A]">
                    {onlineList.map((u, i) => (
                      <li key={i} className="px-4 py-2.5 flex items-center gap-3">
                        {u.flag ? (
                          <img src={u.flag} alt={u.country} className="w-6 h-4 object-cover rounded-sm shrink-0" />
                        ) : (
                          <span className="w-6 h-4 rounded-sm bg-white/10 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{u.name}</p>
                          <p className="text-gray-500 text-xs truncate">{u.phone}{u.country ? ` · ${u.country}` : ''}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-white text-sm border border-[#2A2A3A] hover:border-orange-500/50 px-4 py-2 rounded-xl transition-all">
            Sair
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-1 flex-wrap">
        {([
          { id: 'visual', label: 'Visual', icon: <ImageIcon className="w-4 h-4" /> },
          { id: 'transmissao', label: 'Transmissão', icon: <Radio className="w-4 h-4" /> },
          { id: 'acesso', label: 'Acesso Gratuito', icon: <Users className="w-4 h-4" /> },
          { id: 'notificar', label: 'Notificar', icon: <Megaphone className="w-4 h-4" /> },
          { id: 'agenda', label: 'Agenda', icon: <CalendarDays className="w-4 h-4" /> },
          { id: 'afiliados', label: 'Afiliados', icon: <UserCheck className="w-4 h-4" /> },
          { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="w-4 h-4" /> },
          { id: 'suporte', label: 'Suporte', icon: <Headphones className="w-4 h-4" /> },
          ...(allowedTabs === null ? [{ id: 'admins', label: 'Admins', icon: <UserCheck className="w-4 h-4" /> }] : []),
        ] as { id: string; label: string; icon: React.ReactNode }[])
          .filter(tab => allowedTabs === null || allowedTabs.includes(tab.id))
          .map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
      </div>

      {/* ── ABA: VISUAL ── */}
      {activeTab === 'visual' && (
        <div className="space-y-10">

          {/* Logo */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-white">Logo do Site</h2>
              <p className="text-gray-500 text-sm mt-0.5">PNG com fundo transparente recomendado · altura ideal: 40px</p>
            </div>
            <div className="flex items-center gap-5">
              {logoUrl && (
                <div className="flex-shrink-0 h-14 w-32 bg-[#12121A] border border-[#2A2A3A] rounded-xl flex items-center justify-center overflow-hidden">
                  <img src={logoUrl} alt="Logo atual" className="h-10 w-auto object-contain" />
                </div>
              )}
              <div
                onDragOver={e => { e.preventDefault(); setIsLogoDragging(true) }}
                onDragLeave={() => setIsLogoDragging(false)}
                onDrop={e => { e.preventDefault(); setIsLogoDragging(false); const f = e.dataTransfer.files[0]; if (f) handleLogoFile(f) }}
                onClick={() => document.getElementById('logoInput')?.click()}
                className={`flex-1 border-2 border-dashed rounded-2xl cursor-pointer transition-all flex items-center justify-center h-14 ${isLogoDragging ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'}`}
              >
                <input id="logoInput" type="file" accept="image/*,.svg" className="hidden" onChange={e => e.target.files?.[0] && handleLogoFile(e.target.files[0])} />
                {logoUploading ? <p className="text-white text-sm font-semibold">Enviando...</p> : <p className="text-gray-500 text-sm">{logoUrl ? 'Arraste para substituir a logo' : 'Arraste a logo aqui ou clique'}</p>}
              </div>
            </div>
            {logoSaved && <p className="text-green-500 text-xs">Logo salva! Recarregue a página para ver no navbar.</p>}
          </div>

          {/* Favicon */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-white">Favicon</h2>
              <p className="text-gray-500 text-sm mt-0.5">Ícone exibido na aba do navegador · .ico, .png ou .svg · 32×32px recomendado</p>
            </div>
            <div className="flex items-center gap-5">
              {faviconUrl && (
                <div className="flex-shrink-0 h-14 w-14 bg-[#12121A] border border-[#2A2A3A] rounded-xl flex items-center justify-center overflow-hidden">
                  <img src={faviconUrl} alt="Favicon atual" className="w-8 h-8 object-contain" />
                </div>
              )}
              <div
                onDragOver={e => { e.preventDefault(); setIsFaviconDragging(true) }}
                onDragLeave={() => setIsFaviconDragging(false)}
                onDrop={e => { e.preventDefault(); setIsFaviconDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFaviconFile(f) }}
                onClick={() => document.getElementById('faviconInput')?.click()}
                className={`flex-1 border-2 border-dashed rounded-2xl cursor-pointer transition-all flex items-center justify-center h-14 ${isFaviconDragging ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'}`}
              >
                <input id="faviconInput" type="file" accept=".ico,.png,.svg,.webp,image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFaviconFile(e.target.files[0])} />
                {faviconUploading
                  ? <p className="text-white text-sm font-semibold">Enviando...</p>
                  : <p className="text-gray-500 text-sm">{faviconUrl ? 'Arraste para substituir o favicon' : 'Arraste o favicon aqui ou clique'}</p>
                }
              </div>
            </div>
            {faviconSaved && <p className="text-green-500 text-xs">Favicon salvo! Recarregue a página para ver no navegador.</p>}
          </div>

          {/* Chat da Torcida */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-white">Chat da Torcida</h2>
              <p className="text-gray-500 text-sm mt-0.5">Controla o botão flutuante de chat na página inicial.</p>
            </div>
            <button
              onClick={toggleHomeChat}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all"
              style={homeChatEnabled
                ? { background: 'rgba(255,106,0,0.12)', border: '1.5px solid rgba(255,106,0,0.6)', color: '#FF6A00' }
                : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#6b7280' }
              }
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: homeChatEnabled ? '#FF6A00' : '#4b5563' }} />
              {homeChatEnabled ? 'Ativo' : 'Inativo'}
            </button>
          </div>

          {/* Banners */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-white">Banners</h2>
              <p className="text-gray-500 text-sm mt-0.5">Adicione uma ou mais imagens — quando houver mais de uma, o sistema rotaciona automaticamente.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <input id="extraInput" type="file" accept="image/*,.svg" className="hidden" onChange={e => e.target.files?.[0] && handleExtraFile(e.target.files[0])} />
              {[banner, ...extraBanners].filter(Boolean).map((b, i, arr) => {
                const isMain = i === 0
                const isMoving = movingBanner === b!.id
                return (
                  <div key={b!.id} className={`relative group rounded-xl overflow-hidden border bg-[#12121A] ${isMain ? 'border-orange-500/40' : 'border-[#2A2A3A]'}`} style={{ aspectRatio: '16/9' }}>
                    <img src={b!.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all" />
                    <button
                      onClick={() => isMain ? deleteMainBanner() : deleteExtraBanner(b!.id)}
                      className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-500 text-white rounded-lg p-1.5 transition-all z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-all z-10">
                      <button onClick={() => moveBanner(b!.id, 'up')} disabled={i === 0 || isMoving} className="bg-black/70 hover:bg-black/90 disabled:opacity-30 text-white rounded p-0.5 transition-all">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveBanner(b!.id, 'down')} disabled={i === arr.length - 1 || isMoving} className="bg-black/70 hover:bg-black/90 disabled:opacity-30 text-white rounded p-0.5 transition-all">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className={`absolute top-1.5 left-1.5 text-white text-xs font-bold px-1.5 py-0.5 rounded ${isMain ? 'bg-orange-500' : 'bg-black/70'}`}>
                      #{i + 1}{isMain ? ' principal' : ''}
                    </span>
                  </div>
                )
              })}
              <div
                onClick={() => document.getElementById('extraInput')?.click()}
                onDragOver={e => { e.preventDefault() }}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleExtraFile(f) }}
                className="border-2 border-dashed border-[#2A2A3A] hover:border-orange-500/40 rounded-xl bg-[#12121A] cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-orange-400 transition-all"
                style={{ aspectRatio: '16/9' }}
              >
                <Plus className="w-6 h-6" />
                <p className="text-xs text-center px-2">Adicionar banner</p>
              </div>
            </div>
          </div>

          {/* Próximos Jogos */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Próximos Jogos</h2>
              <p className="text-gray-500 text-sm mt-0.5">Desktop: 1280×120px · Mobile: 390×120px</p>
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setIsCarouselDragging(true) }}
              onDragLeave={() => setIsCarouselDragging(false)}
              onDrop={e => { e.preventDefault(); setIsCarouselDragging(false); const f = e.dataTransfer.files[0]; if (f) handleCarouselFile(f) }}
              onClick={() => document.getElementById('carouselInput')?.click()}
              className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all flex items-center justify-center h-28 ${isCarouselDragging ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'}`}
            >
              <input id="carouselInput" type="file" accept="image/*,.svg" className="hidden" onChange={e => e.target.files?.[0] && handleCarouselFile(e.target.files[0])} />
              {carouselUploading
                ? <p className="text-white font-semibold text-sm">Enviando...</p>
                : <div className="text-center"><p className="text-white font-semibold text-sm">Arraste o banner desktop aqui</p><p className="text-gray-600 text-xs mt-1">ou clique para selecionar · adiciona ao carrossel</p></div>
              }
            </div>
            {carouselBanners.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {carouselBanners.map((b, i) => (
                  <div key={b.id} className="space-y-2">
                    <div className="relative group rounded-xl overflow-hidden border border-[#2A2A3A]" style={{ aspectRatio: '10/1' }}>
                      <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2">
                        <button onClick={() => deleteCarouselBanner(b.id)} className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-500 text-white rounded-lg p-2 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">#{i + 1} Desktop</span>
                    </div>
                    <div
                      className="relative rounded-xl overflow-hidden border border-dashed border-[#2A2A3A] cursor-pointer hover:border-orange-500/40 transition-all"
                      style={{ aspectRatio: '3/1' }}
                      onClick={() => document.getElementById(`carouselMobileInput-${b.id}`)?.click()}
                    >
                      <input
                        id={`carouselMobileInput-${b.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleCarouselMobileFile(b.id, e.target.files[0])}
                      />
                      {b.mobile_image_url ? (
                        <img src={b.mobile_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-gray-600 text-xs text-center">Clique para adicionar<br/>versão mobile (390×120px)</p>
                        </div>
                      )}
                      <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">📱 Mobile</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA Cards */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Cards de CTA</h2>
              <p className="text-gray-500 text-sm mt-0.5">Cards para redes sociais, sorteios e promoções. Clique ou arraste para enviar a imagem.</p>
            </div>

            {/* Card principal */}
            <div className="space-y-2">
              <p className="text-white text-sm font-semibold">Card Principal <span className="text-gray-500 font-normal">(coluna esquerda, maior)</span></p>
              <div className="grid grid-cols-2 gap-3">
                {/* Desktop */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">🖥 Desktop · <span className="text-orange-400">800 × 530px</span></p>
                  <div
                    onDragOver={e => { e.preventDefault(); setCtaDragging(0) }}
                    onDragLeave={() => setCtaDragging(null)}
                    onDrop={e => { e.preventDefault(); setCtaDragging(null); const f = e.dataTransfer.files[0]; if (f) handleCtaCardUpload(0, f) }}
                    onClick={() => document.getElementById('ctaInput-0')?.click()}
                    className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${ctaDragging === 0 ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'}`}
                    style={{ height: 130 }}
                  >
                    <input id="ctaInput-0" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleCtaCardUpload(0, e.target.files[0])} />
                    {(ctaLocalPreviews[0] || ctaCards.find(c => c.slot === 0)?.image_url) ? (
                      <>
                        <img src={ctaLocalPreviews[0] || ctaCards.find(c => c.slot === 0)!.image_url!} alt="" className="w-full h-full object-cover" />
                        {ctaUploading === 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><p className="text-white text-sm font-bold">Enviando...</p></div>}
                        <button onClick={e => { e.stopPropagation(); deleteCtaImage(0, 'desktop') }} className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-red-400 hover:text-red-300 hover:bg-black/90 transition-all z-10"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    ) : ctaUploading === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center"><p className="text-white text-sm font-bold">Enviando...</p></div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-1">
                        <p className="text-gray-600 text-xs text-center">Arraste ou clique</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Mobile */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">📱 Mobile · <span className="text-orange-400">700 × 500px</span></p>
                  <div
                    onDragOver={e => { e.preventDefault(); setCtaMobileDragging(0) }}
                    onDragLeave={() => setCtaMobileDragging(null)}
                    onDrop={e => { e.preventDefault(); setCtaMobileDragging(null); const f = e.dataTransfer.files[0]; if (f) handleCtaMobileUpload(0, f) }}
                    onClick={() => document.getElementById('ctaMobileInput-0')?.click()}
                    className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${ctaMobileDragging === 0 ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'}`}
                    style={{ height: 130 }}
                  >
                    <input id="ctaMobileInput-0" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleCtaMobileUpload(0, e.target.files[0])} />
                    {(ctaMobileLocalPreviews[0] || ctaCards.find(c => c.slot === 0)?.mobile_image_url) ? (
                      <>
                        <img src={ctaMobileLocalPreviews[0] || ctaCards.find(c => c.slot === 0)!.mobile_image_url!} alt="" className="w-full h-full object-cover" />
                        {ctaMobileUploading === 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><p className="text-white text-sm font-bold">Enviando...</p></div>}
                        <button onClick={e => { e.stopPropagation(); deleteCtaImage(0, 'mobile') }} className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-red-400 hover:text-red-300 hover:bg-black/90 transition-all z-10"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    ) : ctaMobileUploading === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center"><p className="text-white text-sm font-bold">Enviando...</p></div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-1">
                        <p className="text-gray-600 text-xs text-center">Arraste ou clique</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Link ao clicar (ex: https://instagram.com/...)"
                  value={ctaLinks[0] ?? ''}
                  onChange={e => setCtaLinks(p => ({ ...p, 0: e.target.value }))}
                  className="flex-1 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
                />
                <button onClick={() => handleCtaLinkSave(0)} disabled={ctaLinkSaving[0]} className="bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all min-w-[80px]">{ctaLinkSaving[0] ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </div>

            {/* 4 cards horizontais */}
            <p className="text-white text-sm font-semibold pt-2">Cards Horizontais <span className="text-gray-500 font-normal">(linha inferior)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(slot => (
                <div key={slot} className="space-y-2">
                  <p className="text-gray-400 text-xs font-semibold">Card {slot}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Desktop */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500">🖥 <span className="text-orange-400">1050 × 300px</span></p>
                      <div
                        onDragOver={e => { e.preventDefault(); setCtaDragging(slot) }}
                        onDragLeave={() => setCtaDragging(null)}
                        onDrop={e => { e.preventDefault(); setCtaDragging(null); const f = e.dataTransfer.files[0]; if (f) handleCtaCardUpload(slot, f) }}
                        onClick={() => document.getElementById(`ctaInput-${slot}`)?.click()}
                        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${ctaDragging === slot ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'}`}
                        style={{ height: 70 }}
                      >
                        <input id={`ctaInput-${slot}`} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleCtaCardUpload(slot, e.target.files[0])} />
                        {(ctaLocalPreviews[slot] || ctaCards.find(c => c.slot === slot)?.image_url) ? (
                          <>
                            <img src={ctaLocalPreviews[slot] || ctaCards.find(c => c.slot === slot)!.image_url!} alt="" className="w-full h-full object-cover" />
                            {ctaUploading === slot && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><p className="text-white text-xs font-bold">Enviando...</p></div>}
                            <button onClick={e => { e.stopPropagation(); deleteCtaImage(slot, 'desktop') }} className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-red-400 hover:text-red-300 hover:bg-black/90 transition-all z-10"><Trash2 className="w-3 h-3" /></button>
                          </>
                        ) : ctaUploading === slot ? (
                          <div className="absolute inset-0 flex items-center justify-center"><p className="text-white text-xs font-bold">Enviando...</p></div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-600 text-[10px]">Arraste ou clique</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Mobile */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500">📱 <span className="text-orange-400">960 × 300px</span></p>
                      <div
                        onDragOver={e => { e.preventDefault(); setCtaMobileDragging(slot) }}
                        onDragLeave={() => setCtaMobileDragging(null)}
                        onDrop={e => { e.preventDefault(); setCtaMobileDragging(null); const f = e.dataTransfer.files[0]; if (f) handleCtaMobileUpload(slot, f) }}
                        onClick={() => document.getElementById(`ctaMobileInput-${slot}`)?.click()}
                        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${ctaMobileDragging === slot ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'}`}
                        style={{ height: 70 }}
                      >
                        <input id={`ctaMobileInput-${slot}`} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleCtaMobileUpload(slot, e.target.files[0])} />
                        {(ctaMobileLocalPreviews[slot] || ctaCards.find(c => c.slot === slot)?.mobile_image_url) ? (
                          <>
                            <img src={ctaMobileLocalPreviews[slot] || ctaCards.find(c => c.slot === slot)!.mobile_image_url!} alt="" className="w-full h-full object-cover" />
                            {ctaMobileUploading === slot && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><p className="text-white text-xs font-bold">Enviando...</p></div>}
                            <button onClick={e => { e.stopPropagation(); deleteCtaImage(slot, 'mobile') }} className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-red-400 hover:text-red-300 hover:bg-black/90 transition-all z-10"><Trash2 className="w-3 h-3" /></button>
                          </>
                        ) : ctaMobileUploading === slot ? (
                          <div className="absolute inset-0 flex items-center justify-center"><p className="text-white text-xs font-bold">Enviando...</p></div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-600 text-[10px]">Arraste ou clique</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Link ao clicar..."
                      value={ctaLinks[slot] ?? ''}
                      onChange={e => setCtaLinks(p => ({ ...p, [slot]: e.target.value }))}
                      className="flex-1 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-3 py-2 text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500"
                    />
                    <button onClick={() => handleCtaLinkSave(slot)} disabled={ctaLinkSaving[slot]} className="bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all min-w-[72px]">{ctaLinkSaving[slot] ? 'Salvando...' : 'Salvar'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── ABA: TRANSMISSÃO ── */}
      {activeTab === 'transmissao' && (
        <div className="space-y-10">

          {/* Transmissões */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-orange-500" />
                Transmissões
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">Gerencie as transmissões. "Destacar" define qual aparece no banner principal.</p>
            </div>
            <div className="flex items-start gap-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
              <span className="text-yellow-400 text-base shrink-0 mt-0.5">⚠️</span>
              <p className="text-yellow-300 text-xs leading-relaxed">
                <strong>Trocou de canal?</strong> Use o botão <strong>Editar</strong> na stream existente — não crie uma nova. Criar uma nova stream gera um ID diferente e usuários que já pagaram precisarão pagar novamente.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={forceRefreshViewers}
                disabled={refreshing}
                className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 border border-blue-500/30 text-blue-400 font-bold px-4 py-2.5 rounded-xl transition-all text-sm"
              >
                {refreshing ? 'Enviando...' : '↺ Recarregar todos os espectadores'}
              </button>
              <button
                onClick={syncPayments}
                disabled={syncing}
                className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 disabled:opacity-50 border border-green-500/30 text-green-400 font-bold px-4 py-2.5 rounded-xl transition-all text-sm"
              >
                {syncing ? 'Verificando...' : '✓ Verificar pagamentos pendentes'}
              </button>
            </div>
            {syncResult && (
              <p className="text-sm text-gray-300 bg-[#1A1A26] border border-[#2A2A3A] rounded-xl px-4 py-2.5">{syncResult}</p>
            )}
            <div className="space-y-2">
              <input type="text" placeholder="Nome do jogo (ex: Flamengo x Corinthians)" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="flex rounded-xl overflow-hidden border border-[#2A2A3A] w-max min-w-full">
                  <button onClick={() => setNewSource('kick')} className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${newSource === 'kick' ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}>Kick</button>
                  <button onClick={() => setNewSource('soop')} className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${newSource === 'soop' ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}>Soop</button>
                  <button onClick={() => setNewSource('hls')} className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${newSource === 'hls' ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}>HLS/VPS</button>
                  <button onClick={() => setNewSource('youtube')} className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${newSource === 'youtube' ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}>YouTube</button>
                </div>
              </div>
              <div className="flex gap-2">
                {newSource === 'kick' ? (
                  <input type="text" placeholder="Canal da Kick (ex: futzone_fla)" value={newChannel} onChange={e => setNewChannel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStream()}
                    className="flex-1 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
                ) : newSource === 'soop' ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <input type="text" placeholder="ID do canal Soop" value={newSoopChannel} onChange={e => setNewSoopChannel(e.target.value)}
                      className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
                    <input type="text" placeholder="Nº do broadcast (opcional)" value={newSoopBroadNo} onChange={e => setNewSoopBroadNo(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStream()}
                      className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
                  </div>
                ) : newSource === 'hls' ? (
                  <input type="text" placeholder="URL HLS (ex: http://ip/hls/chave.m3u8)" value={newHlsUrl} onChange={e => setNewHlsUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStream()}
                    className="flex-1 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
                ) : (
                  <input type="text" placeholder="URL do YouTube (ex: youtube.com/watch?v=...)" value={newYoutubeUrl} onChange={e => setNewYoutubeUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStream()}
                    className="flex-1 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
                )}
                <button onClick={addStream} disabled={addingStream || !newTitle.trim() || (newSource === 'kick' ? !newChannel.trim() : newSource === 'soop' ? !newSoopChannel.trim() : newSource === 'hls' ? !newHlsUrl.trim() : !newYoutubeUrl.trim())}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm shrink-0">
                  <Plus className="w-4 h-4" />{addingStream ? '...' : 'Adicionar'}
                </button>
              </div>
            </div>
            {streams.length === 0 ? (
              <div className="border border-dashed border-[#2A2A3A] rounded-xl py-8 text-center">
                <p className="text-gray-600 text-sm">Nenhuma transmissão cadastrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {streams.map(s => {
                  const isEditing = editingStreamId === s.id
                  const currentSource = editSources[s.id] ?? s.stream_source ?? 'kick'
                  return (
                    <div key={s.id} className={`rounded-xl border overflow-hidden transition-all ${s.is_live ? 'border-red-500/40 bg-red-500/5' : 'border-[#2A2A3A] bg-[#12121A]'}`}>
                      {/* Linha de título + ações */}
                      <div className="flex items-center gap-2 p-3 pb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{s.title}</p>
                          {(viewersByStream[s.id] ?? 0) > 0 && (() => {
                            const watchers = onlineList.filter(u => u.stream_id === s.id)
                            const isExpanded = expandedViewers.has(s.id)
                            const visible = isExpanded ? watchers : watchers.slice(0, 3)
                            return (
                              <div className="mt-0.5">
                                <p className="text-green-400 text-xs font-semibold">● {viewersByStream[s.id]} assistindo agora</p>
                                <div className="mt-1 space-y-0.5">
                                  {visible.map((u, i) => (
                                    <div key={i} className="flex items-center gap-1.5 group/viewer">
                                      {u.flag
                                        ? <img src={u.flag} alt={u.country} className="w-4 h-3 object-cover rounded-sm shrink-0" />
                                        : <span className="w-4 h-3 rounded-sm bg-white/10 shrink-0" />
                                      }
                                      <span className="text-gray-400 text-xs truncate flex-1">{u.phone || u.name}</span>
                                      <button
                                        onClick={async (e) => {
                                          const btn = e.currentTarget
                                          btn.textContent = '✓'
                                          btn.style.color = '#22c55e'
                                          const { error } = await supabase.from('user_refresh').upsert(
                                            { stream_id: s.id, user_email: u.phone, refresh_at: new Date().toISOString() },
                                            { onConflict: 'stream_id,user_email' }
                                          )
                                          if (error) { btn.textContent = '✗'; btn.style.color = '#ef4444' }
                                          setTimeout(() => { btn.textContent = '↺'; btn.style.color = '' }, 2000)
                                        }}
                                        className="opacity-0 group-hover/viewer:opacity-100 transition-opacity text-gray-600 hover:text-orange-400 ml-1 shrink-0"
                                        title="Forçar refresh deste usuário"
                                      >↺</button>
                                    </div>
                                  ))}
                                </div>
                                {watchers.length > 3 && (
                                  <button
                                    onClick={() => setExpandedViewers(prev => {
                                      const next = new Set(prev)
                                      isExpanded ? next.delete(s.id) : next.add(s.id)
                                      return next
                                    })}
                                    className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold mt-1 transition-colors"
                                  >
                                    {isExpanded ? 'Mostrar menos ▲' : `+${watchers.length - 3} mostrar mais ▼`}
                                  </button>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Cobrança individual */}
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="email@cobrar.com"
                              value={newChargedEmail[s.id] ?? ''}
                              onChange={e => setNewChargedEmail(prev => ({ ...prev, [s.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChargedUser(s.id) } }}
                              className="bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-2 py-1.5 text-xs w-36 focus:outline-none focus:border-orange-500 placeholder-gray-600"
                            />
                            <button
                              onClick={() => addChargedUser(s.id)}
                              className="text-xs font-bold px-2 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition-all"
                              title="Cobrar este usuário"
                            >
                              +
                            </button>
                          </div>
                          {(chargedUsersByStream[s.id] ?? []).length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                              {(chargedUsersByStream[s.id] ?? []).map(email => (
                                <span
                                  key={email}
                                  className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-md px-1.5 py-0.5"
                                >
                                  {email.split('@')[0]}
                                  <button onClick={() => removeChargedUser(s.id, email)} className="hover:text-red-400 transition-colors">×</button>
                                </span>
                              ))}
                            </div>
                          )}
                          {s.charge_enabled && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500 text-xs">R$</span>
                              <input type="number" min="0.01" step="0.01" value={editAmounts[s.id] ?? s.charge_amount}
                                onChange={e => setEditAmounts(prev => ({ ...prev, [s.id]: e.target.value }))}
                                onBlur={() => saveAmount(s.id)}
                                className="bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-2 py-1.5 text-sm w-16 focus:outline-none focus:border-orange-500" />
                            </div>
                          )}
                          <button onClick={() => setEditingStreamId(isEditing ? null : s.id)}
                            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-[#2A2A3A] text-gray-400 hover:text-white hover:bg-[#3A3A4A] transition-all">
                            {isEditing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{isEditing ? 'Fechar' : 'Editar'}</span>
                          </button>
                          <button onClick={() => deleteStream(s.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1.5">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {/* Grid de toggles */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 pb-3">
                        <button
                          onClick={() => toggleLive(s.id, !s.is_live)}
                          className={`text-xs font-bold px-3 py-2 rounded-lg transition-all text-center ${s.is_live ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : 'bg-[#2A2A3A] text-gray-400 hover:bg-red-600/20 hover:text-red-400'}`}>
                          {s.is_live ? '🔴 Ao Vivo' : 'Ao Vivo OFF'}
                        </button>
                        <button
                          onClick={() => {
                            if (s.charge_enabled) {
                              toggleCharge(s.id, false)
                            } else {
                              setChargeAmountInput(s.charge_amount ? String(s.charge_amount) : '')
                              setChargeAmountModal({ id: s.id })
                            }
                          }}
                          className={`text-xs font-bold px-3 py-2 rounded-lg transition-all text-center ${s.charge_enabled ? 'bg-green-600/20 text-green-400 hover:bg-red-600/20 hover:text-red-400' : 'bg-[#2A2A3A] text-gray-400 hover:bg-green-600/20 hover:text-green-400'}`}>
                          {s.charge_enabled ? 'Cobrança ON' : 'Cobrança OFF'}
                        </button>
                        <button
                          onClick={() => toggleChat(s.id, !s.chat_enabled)}
                          className={`text-xs font-bold px-3 py-2 rounded-lg transition-all text-center ${s.chat_enabled !== false ? 'bg-blue-600/20 text-blue-400 hover:bg-red-600/20 hover:text-red-400' : 'bg-[#2A2A3A] text-gray-400 hover:bg-blue-600/20 hover:text-blue-400'}`}>
                          {s.chat_enabled !== false ? 'Chat ON' : 'Chat OFF'}
                        </button>
                        <button
                          onClick={() => toggleCoupon(s.id, !s.coupon_enabled)}
                          className={`text-xs font-bold px-3 py-2 rounded-lg transition-all text-center ${s.coupon_enabled ? 'bg-purple-600/20 text-purple-400 hover:bg-red-600/20 hover:text-red-400' : 'bg-[#2A2A3A] text-gray-400 hover:bg-purple-600/20 hover:text-purple-400'}`}>
                          {s.coupon_enabled ? `Cód. ON (${couponUsedCounts[s.id] ?? 0}/${s.coupon_quantity})` : 'Código OFF'}
                        </button>
                      </div>
                      {isEditing && (
                        <div className="px-3 pb-3 pt-2 border-t border-[#2A2A3A] space-y-2">
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Nome da Transmissão</p>
                            <input
                              type="text"
                              value={editTitles[s.id] ?? s.title}
                              onChange={e => setEditTitles(prev => ({ ...prev, [s.id]: e.target.value }))}
                              placeholder="Nome do jogo"
                              className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">ID do Canal</p>
                            <div className="space-y-2">
                              <div className="overflow-x-auto -mx-1 px-1">
                                <div className="flex rounded-lg overflow-hidden border border-[#2A2A3A] w-max min-w-full">
                                  <button onClick={() => setEditSources(prev => ({ ...prev, [s.id]: 'kick' }))} className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${currentSource === 'kick' ? 'bg-orange-500 text-white' : 'bg-[#0B0B0F] text-gray-400 hover:text-white'}`}>Kick</button>
                                  <button onClick={() => setEditSources(prev => ({ ...prev, [s.id]: 'soop' }))} className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${currentSource === 'soop' ? 'bg-orange-500 text-white' : 'bg-[#0B0B0F] text-gray-400 hover:text-white'}`}>Soop</button>
                                  <button onClick={() => setEditSources(prev => ({ ...prev, [s.id]: 'hls' }))} className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${currentSource === 'hls' ? 'bg-orange-500 text-white' : 'bg-[#0B0B0F] text-gray-400 hover:text-white'}`}>HLS/VPS</button>
                                  <button onClick={() => setEditSources(prev => ({ ...prev, [s.id]: 'youtube' }))} className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${currentSource === 'youtube' ? 'bg-orange-500 text-white' : 'bg-[#0B0B0F] text-gray-400 hover:text-white'}`}>YouTube</button>
                                </div>
                              </div>
                              {currentSource === 'kick' ? (
                                <input type="text" value={editChannels[s.id] ?? s.kick_channel ?? ''} onChange={e => setEditChannels(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="Canal da Kick"
                                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500" />
                              ) : currentSource === 'soop' ? (
                                <div className="space-y-2">
                                  <input type="text" value={editSoopChannels[s.id] ?? s.soop_channel ?? ''} onChange={e => setEditSoopChannels(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="ID do canal Soop (bjid)"
                                    className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500" />
                                  <div className="flex gap-2">
                                    <input type="text" value={editSoopBroadNos[s.id] ?? s.soop_broad_no ?? ''} onChange={e => setEditSoopBroadNos(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="Nº broadcast"
                                      className="flex-1 bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500" />
                                    <button onClick={() => detectSoopBroadcast(s.id)} disabled={detectingBroad === s.id || !editSoopChannels[s.id]}
                                      className="bg-[#2A2A3A] hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all shrink-0">
                                      {detectingBroad === s.id ? '...' : 'Detectar'}
                                    </button>
                                  </div>
                                </div>
                              ) : currentSource === 'hls' ? (
                                <input type="text" value={editHlsUrls[s.id] ?? s.hls_url ?? ''} onChange={e => setEditHlsUrls(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="URL HLS (ex: http://ip/hls/chave.m3u8)"
                                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500" />
                              ) : (
                                <input type="text" value={editYoutubeUrls[s.id] ?? s.youtube_url ?? ''} onChange={e => setEditYoutubeUrls(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="URL do YouTube (ex: youtube.com/watch?v=...)"
                                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500" />
                              )}
                            </div>
                          </div>
                          <button onClick={async () => { await saveChannel(s.id); setEditingStreamId(null) }} disabled={savingChannel === s.id}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all">
                            {savingChannel === s.id ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Jogo em destaque */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Jogo em destaque</h2>
            <div className="flex gap-3 flex-wrap">
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500" />
              <input type="text" placeholder="Buscar time ou liga..." value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 min-w-48 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
              <button onClick={loadFixtures} disabled={loadingFixtures}
                className="bg-[#1A1A26] hover:bg-[#2A2A3A] border border-[#2A2A3A] text-gray-400 hover:text-white rounded-xl px-4 py-2 text-sm transition-all disabled:opacity-50">
                {loadingFixtures ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
            <div className="space-y-2">
              <button onClick={() => setSelectedGameId(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedGameId === null ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] bg-[#12121A] hover:border-orange-500/30'}`}>
                <span className="text-gray-400 text-sm">Sem jogo selecionado</span>
              </button>
            </div>
            {loadingFixtures ? (
              <div className="py-8 text-center text-gray-500 text-sm">Carregando jogos...</div>
            ) : brazilFixtures.length === 0 && internationalFixtures.length === 0 ? (
              <div className="py-8 text-center text-gray-600 text-sm">Nenhum jogo encontrado para esta data</div>
            ) : (
              <div className="space-y-5">
                {brazilFixtures.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Brasil</p>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {brazilFixtures.map(f => <FixtureRow key={f.fixture.id} f={f} selected={selectedGameId === f.fixture.id} onSelect={() => setSelectedGameId(f.fixture.id)} />)}
                    </div>
                  </div>
                )}
                {internationalFixtures.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Internacional</p>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {internationalFixtures.map(f => <FixtureRow key={f.fixture.id} f={f} selected={selectedGameId === f.fixture.id} onSelect={() => setSelectedGameId(f.fixture.id)} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── ABA: ACESSO GRATUITO ── */}
      {activeTab === 'acesso' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Acesso gratuito</h2>
            <p className="text-gray-500 text-sm mt-0.5">Usuários desta lista assistem de graça mesmo em transmissões pagas.</p>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="E-mail do usuário"
              value={newFreePhone}
              onChange={e => setNewFreePhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFreeAccess()}
              className="flex-1 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={addFreeAccess}
              disabled={addingFreeUser || !newFreePhone.trim()}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm"
            >
              <Plus className="w-4 h-4" />{addingFreeUser ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
          {freeUsers.length === 0 ? (
            <div className="border border-dashed border-[#2A2A3A] rounded-xl py-6 text-center">
              <p className="text-gray-600 text-sm">Nenhum usuário com acesso gratuito</p>
            </div>
          ) : (
            <div className="space-y-2">
              {freeUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-[#12121A] border border-[#2A2A3A] rounded-xl px-4 py-3">
                  <span className="text-white text-sm font-mono">{u.user_phone}</span>
                  <button onClick={() => deleteFreeAccess(u.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Moderadores do chat */}
          <div className="pt-4 border-t border-[#2A2A3A] space-y-3">
            <div>
              <h2 className="text-lg font-bold text-white">Moderadores do chat</h2>
              <p className="text-gray-500 text-sm mt-0.5">Usuários com poder de excluir mensagens no chat ao vivo.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="E-mail do usuário"
                value={newAdminPhone}
                onChange={e => setNewAdminPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addAdminUser()}
                className="flex-1 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={addAdminUser}
                disabled={addingAdmin || !newAdminPhone.trim()}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm"
              >
                <Plus className="w-4 h-4" />{addingAdmin ? 'Adicionando...' : 'Promover'}
              </button>
            </div>
            {adminUsers.length === 0 ? (
              <div className="border border-dashed border-[#2A2A3A] rounded-xl py-6 text-center">
                <p className="text-gray-600 text-sm">Nenhum moderador cadastrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {adminUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-[#12121A] border border-[#2A2A3A] rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-semibold">{u.name}</p>
                      <p className="text-gray-500 text-xs font-mono">{u.email}</p>
                    </div>
                    <button onClick={() => removeAdminUser(u.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1" title="Revogar moderação">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ABA: NOTIFICAR USUÁRIOS ── */}
      {activeTab === 'notificar' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-orange-500" />
              Notificar Usuários
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">Exibe um aviso em tempo real para todos os usuários online.</p>
          </div>
          {activePopup && (
            <div className="flex items-center justify-between gap-3 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-orange-400 text-xs font-bold mb-0.5">POP-UP ATIVO AGORA</p>
                <p className="text-white text-sm truncate">{activePopup.message}</p>
              </div>
              <button
                onClick={closePopup}
                disabled={closingPopup}
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 disabled:opacity-50 transition-all"
              >
                {closingPopup ? 'Fechando...' : 'Fechar pop-up'}
              </button>
            </div>
          )}
          {/* Templates rápidos */}
          <div className="space-y-2">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Templates rápidos</p>
            <div className="flex flex-wrap gap-2">
              {/* Template fixo */}
              <button
                onClick={() => sendPopup('Instabilidade na transmissão, voltamos em alguns segundos.')}
                disabled={sendingPopup}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 disabled:opacity-40 transition-all"
              >
                ⚡ Instabilidade
              </button>

              {/* Templates personalizados */}
              {customTemplates.map((tpl, i) => (
                <div key={i} className="group flex items-center gap-1">
                  <button
                    onClick={() => sendPopup(tpl.text)}
                    disabled={sendingPopup}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2A2A3A] text-gray-300 hover:border-orange-500/40 hover:text-orange-400 disabled:opacity-40 transition-all"
                  >
                    {tpl.label}
                  </button>
                  <button
                    onClick={() => deleteTemplate(i)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all"
                    title="Remover template"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Botão + */}
              {!addingTemplate && (
                <button
                  onClick={() => setAddingTemplate(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed border-[#2A2A3A] text-gray-600 hover:border-orange-500/40 hover:text-orange-400 transition-all"
                >
                  + Novo
                </button>
              )}
            </div>

            {/* Formulário inline para novo template */}
            {addingTemplate && (
              <div className="flex flex-col gap-2 p-3 bg-[#12121A] border border-[#2A2A3A] rounded-xl">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nome do template (ex: 🔧 Manutenção)"
                  value={newTplLabel}
                  onChange={e => setNewTplLabel(e.target.value)}
                  className="bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-lg px-3 py-2 text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500"
                />
                <textarea
                  placeholder="Texto do aviso..."
                  value={newTplText}
                  onChange={e => setNewTplText(e.target.value)}
                  rows={2}
                  className="bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-lg px-3 py-2 text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setAddingTemplate(false); setNewTplLabel(''); setNewTplText('') }}
                    className="text-xs text-gray-500 hover:text-white px-3 py-1.5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveTemplate}
                    disabled={!newTplLabel.trim() || !newTplText.trim()}
                    className="text-xs font-bold bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 items-start">
            <textarea
              placeholder="Ou escreva um aviso personalizado..."
              value={popupMessage}
              onChange={e => setPopupMessage(e.target.value)}
              rows={3}
              className="flex-1 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
            />
            <button
              onClick={() => sendPopup()}
              disabled={sendingPopup || !popupMessage.trim()}
              className="shrink-0 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm"
            >
              {sendingPopup ? 'Enviando...' : 'Exibir para todos'}
            </button>
          </div>
        </div>
      )}

      {/* ── ABA: AFILIADOS ── */}
      {activeTab === 'afiliados' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Afiliados</h2>
            <p className="text-gray-500 text-sm mt-0.5">Gerencie candidaturas e acompanhe o desempenho dos influenciadores.</p>
          </div>

          {affiliatesLoading && <p className="text-gray-500 text-sm">Carregando...</p>}

          {/* Pending */}
          {affiliatesList.filter(a => a.status === 'pending').length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />
                Aguardando aprovação ({affiliatesList.filter(a => a.status === 'pending').length})
              </h3>
              <div className="space-y-2">
                {affiliatesList.filter(a => a.status === 'pending').map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-3 bg-[#12121A] border border-orange-500/20 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white font-semibold text-sm">{a.name}</p>
                      <p className="text-gray-500 text-xs">{a.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveAffiliate(a.id)}
                        className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => rejectAffiliate(a.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All affiliates */}
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-sm">Todos os afiliados ({affiliatesList.length})</h3>
            {affiliatesList.length === 0 && !affiliatesLoading && (
              <p className="text-gray-600 text-sm py-6 text-center bg-[#12121A] border border-[#2A2A3A] rounded-xl">Nenhum afiliado cadastrado ainda.</p>
            )}
            {affiliatesList.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-[#2A2A3A]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2A2A3A] bg-[#12121A]">
                      <th className="text-left text-gray-500 font-medium px-4 py-2.5">Nome</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-2.5">Telefone</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-2.5">Status</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-2.5">Link</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-2.5">Cliques</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-2.5">Cadastros</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-2.5">QR Gerados</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-2.5">QR Pagos</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-2.5">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliatesList.map((a, i) => (
                      <tr key={a.id} className={`border-b border-[#1A1A26] ${i % 2 === 0 ? 'bg-[#0B0B0F]' : 'bg-[#12121A]'}`}>
                        <td className="px-4 py-2.5 text-white font-medium">{a.name}</td>
                        <td className="px-4 py-2.5 text-gray-400">{a.phone}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            a.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                            a.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                            'bg-orange-500/10 text-orange-400'
                          }`}>
                            {a.status === 'approved' ? 'Aprovado' : a.status === 'rejected' ? 'Recusado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-orange-400 font-mono text-xs">
                          {a.referral_code ? `?ref=${a.referral_code}` : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-300 font-bold">{a.clicks}</td>
                        <td className="px-4 py-2.5 text-blue-400 font-bold">{a.referral_code ? (affiliateStats[a.referral_code]?.registrations ?? 0) : '—'}</td>
                        <td className="px-4 py-2.5 text-orange-400 font-bold">{a.referral_code ? (affiliateStats[a.referral_code]?.qrGenerated ?? 0) : '—'}</td>
                        <td className="px-4 py-2.5 text-green-400 font-bold">{a.referral_code ? (affiliateStats[a.referral_code]?.qrPaid ?? 0) : '—'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {a.status !== 'approved' && (
                              <button onClick={() => approveAffiliate(a.id)} className="text-green-400 hover:text-green-300 text-xs transition-colors">Aprovar</button>
                            )}
                            {a.status !== 'rejected' && (
                              <button onClick={() => rejectAffiliate(a.id)} className="text-red-400 hover:text-red-300 text-xs transition-colors">Recusar</button>
                            )}
                            <button onClick={() => deleteAffiliate(a.id)} className="text-gray-600 hover:text-red-400 transition-colors ml-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal — cobrança individual por usuário */}
      {chargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setChargeModal(null)} />
          <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-5 shadow-2xl">
            <button onClick={() => setChargeModal(null)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white">Cobrança individual</h2>
              <p className="text-gray-500 text-sm mt-1">
                Cobrar <span className="text-orange-400 font-semibold">{chargeModal.email}</span>
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-2">Gateway de pagamento</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setChargeModalMethod('bspay')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-sm font-bold ${chargeModalMethod === 'bspay' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-[#2A2A3A] text-gray-500 hover:border-gray-500'}`}
                >
                  <span>🇧🇷 PIX</span>
                  <span className="text-xs font-normal opacity-70">Asap Bank</span>
                </button>
                <button
                  onClick={() => setChargeModalMethod('ironpay')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-sm font-bold ${chargeModalMethod === 'ironpay' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-[#2A2A3A] text-gray-500 hover:border-gray-500'}`}
                >
                  <span>💳 Cartão</span>
                  <span className="text-xs font-normal opacity-70">IronPay</span>
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Valor (R$)</p>
              <div className="flex items-center gap-2 bg-[#0B0B0F] border border-[#2A2A3A] rounded-xl px-3 focus-within:border-orange-500 transition-colors">
                <span className="text-gray-500 text-sm">R$</span>
                <input
                  autoFocus
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={chargeModalAmount}
                  onChange={e => setChargeModalAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmChargedUser()}
                  placeholder="0,00"
                  className="flex-1 bg-transparent text-white py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={confirmChargedUser}
              disabled={!chargeModalAmount || parseFloat(chargeModalAmount) <= 0}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all"
            >
              Cobrar usuário
            </button>
          </div>
        </div>
      )}

      {/* Modal — código de acesso */}
      {chargeAmountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setChargeAmountModal(null)} />
          <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-5 shadow-2xl">
            <button onClick={() => setChargeAmountModal(null)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white">Definir valor da cobrança</h2>
              <p className="text-gray-500 text-sm mt-1">Quanto cada espectador vai pagar para acessar a transmissão.</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-2">Gateway de pagamento</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setChargeGateway('bspay')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-sm font-bold ${chargeGateway === 'bspay' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-[#2A2A3A] text-gray-500 hover:border-gray-500'}`}
                >
                  <span>🇧🇷 PIX</span>
                  <span className="text-xs font-normal opacity-70">Asap Bank</span>
                </button>
                <button
                  onClick={() => setChargeGateway('ironpay')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-sm font-bold ${chargeGateway === 'ironpay' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-[#2A2A3A] text-gray-500 hover:border-gray-500'}`}
                >
                  <span>💳 Cartão</span>
                  <span className="text-xs font-normal opacity-70">IronPay</span>
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Valor (R$)</p>
              <div className="flex items-center gap-2 bg-[#0B0B0F] border border-[#2A2A3A] rounded-xl px-3 focus-within:border-green-500 transition-colors">
                <span className="text-gray-500 text-sm">R$</span>
                <input
                  autoFocus
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={chargeAmountInput}
                  onChange={e => setChargeAmountInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmChargeAmountModal()}
                  placeholder="0,00"
                  className="flex-1 bg-transparent text-white py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={confirmChargeAmountModal}
              disabled={chargeAmountSaving || !chargeAmountInput || parseFloat(chargeAmountInput.replace(',', '.')) <= 0}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all"
            >
              {chargeAmountSaving ? 'Salvando...' : 'Ativar cobrança'}
            </button>
          </div>
        </div>
      )}

      {couponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCouponModal(null)} />
          <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-5 shadow-2xl">
            <button onClick={() => setCouponModal(null)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white">Ativar código de acesso</h2>
              <p className="text-gray-500 text-sm mt-1">Defina o código e quantas pessoas poderão usá-lo.</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-500 text-xs mb-1">Código</p>
                <input
                  type="text"
                  value={couponModalCode}
                  onChange={e => setCouponModalCode(e.target.value.toUpperCase())}
                  placeholder="Ex: FUTZONE2025"
                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 font-mono tracking-wider"
                />
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Quantidade disponível</p>
                <input
                  type="number"
                  min="1"
                  value={couponModalQty}
                  onChange={e => setCouponModalQty(e.target.value)}
                  placeholder="50"
                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <button
              onClick={confirmCouponModal}
              disabled={couponModalSaving || !couponModalCode.trim() || !couponModalQty}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all"
            >
              {couponModalSaving ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {/* ── ABA: DASHBOARD ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-orange-500" />
                Dashboard
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">Cadastros, QR gerados e pagamentos de todas as lives.</p>
            </div>
            <button onClick={loadAdminDashboard} disabled={dashLoading} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${dashLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          {/* Stats */}

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <p className="text-gray-500 text-sm shrink-0">Data:</p>
              <div className="flex rounded-xl overflow-hidden border border-[#2A2A3A]">
                {(['all', 'today', 'yesterday', 'week'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setDashDateFilter(opt)}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${dashDateFilter === opt ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}
                  >
                    {opt === 'all' ? 'Tudo' : opt === 'today' ? 'Hoje' : opt === 'yesterday' ? 'Ontem' : 'Semana'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-gray-500 text-sm shrink-0">Live:</p>
              <select
                value={dashStreamFilter}
                onChange={e => setDashStreamFilter(e.target.value)}
                className="bg-[#1A1A26] border border-[#2A2A3A] text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Todas</option>
                {streams.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          </div>

          {dashLoading ? (
            <p className="text-gray-500 text-sm">Carregando...</p>
          ) : (() => {
              const now = new Date()
              const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
              const matchDate = (dateStr?: string) => {
                if (dashDateFilter === 'all' || !dateStr) return true
                const d = new Date(dateStr)
                if (dashDateFilter === 'today') return d >= startOf(now)
                if (dashDateFilter === 'yesterday') { const y = startOf(new Date(now.getTime() - 86400000)); return d >= y && d < startOf(now) }
                if (dashDateFilter === 'week') return d >= new Date(now.getTime() - 7 * 86400000)
                return true
              }
              const filteredRegs = dashRegistrations.filter(r => matchDate(r.created_at))
              const waCount = dashRegistrations.filter(r => r.whatsapp_added_at && matchDate(r.whatsapp_added_at)).length
              const filteredPays = dashPayments
                .filter(p => dashStreamFilter === 'all' || p.stream_id === dashStreamFilter)
                .filter(p => matchDate(p.created_at))
              const qrCount = filteredPays.length
              const paidCount = filteredPays.filter(p => p.status === 'PAID').length
              const revenue = filteredPays.filter(p => p.status === 'PAID').reduce((s, p) => s + (p.amount ?? 0), 0)
              const directQr = filteredPays.filter(p => !p.referral_code).length
              const directPaid = filteredPays.filter(p => !p.referral_code && p.status === 'PAID').length
              const affiliateQr = filteredPays.filter(p => p.referral_code).length
              const affiliatePaid = filteredPays.filter(p => p.referral_code && p.status === 'PAID').length
              return (
                <div className="space-y-6">
                  {/* Adicionar ao grupo WA em lote */}
                  <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-sm">Adicionar ao Grupo WhatsApp</p>
                        <p className="text-gray-500 text-xs mt-0.5">Processa todos os números BR pendentes, 1 por vez com 5min de intervalo.</p>
                      </div>
                      <div className="flex gap-2">
                        {waBatch?.running ? (
                          <button onClick={stopWaBatch} className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all">
                            Parar
                          </button>
                        ) : (
                          <>
                            <button onClick={runWaBatch} className="bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all">
                              {waBatch ? 'Reiniciar' : 'Iniciar'}
                            </button>
                            {waBatch && !waBatch.running && (
                              <button onClick={runWaBatch} className="bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all">
                                Continuar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {waBatch && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{waBatch.done} adicionados · {waBatch.skipped} sem WA · {waBatch.errors} erros</span>
                          <span>{waBatch.done + waBatch.skipped + waBatch.errors}/{waBatch.total}</span>
                        </div>
                        <div className="w-full bg-[#2A2A3A] rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: waBatch.total > 0 ? `${((waBatch.done + waBatch.skipped + waBatch.errors) / waBatch.total) * 100}%` : '0%' }}
                          />
                        </div>
                        {!waBatch.running && <p className="text-green-400 text-xs">Concluído.</p>}
                      </div>
                    )}
                  </div>

                  {/* Cards de métricas — respeitam todos os filtros */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: 'Cadastros', value: filteredRegs.length },
                        { label: 'No Grupo WA', value: waCount },
                        { label: 'QR Gerados', value: qrCount },
                        { label: 'Pagamentos', value: paidCount },
                        { label: 'Receita', value: `R$ ${revenue.toFixed(2).replace('.', ',')}`, raw: true },
                      ].map(({ label, value, raw }) => (
                        <div key={label} className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4">
                          <p className="text-2xl font-black text-white">{raw ? value : Number(value).toLocaleString('pt-BR')}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'QR Direto Gerado', value: directQr, sub: 'Sem afiliado' },
                        { label: 'QR Direto Pago', value: directPaid, sub: 'Sem afiliado' },
                        { label: 'QR Afiliado Gerado', value: affiliateQr, sub: 'Via link' },
                        { label: 'QR Afiliado Pago', value: affiliatePaid, sub: 'Via link' },
                      ].map(({ label, value, sub }) => (
                        <div key={label} className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4">
                          <p className="text-2xl font-black text-white">{Number(value).toLocaleString('pt-BR')}</p>
                          <p className="text-gray-400 text-xs font-medium mt-0.5">{label}</p>
                          <p className="text-gray-600 text-xs">{sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cadastros */}
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold text-sm">Cadastros ({filteredRegs.length})</h3>
                    <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#2A2A3A]">
                              <th className="text-left text-gray-500 font-medium px-4 py-2.5">#</th>
                              <th className="text-left text-gray-500 font-medium px-4 py-2.5">Nome</th>
                              <th className="text-left text-gray-500 font-medium px-4 py-2.5">Telefone</th>
                              <th className="text-left text-gray-500 font-medium px-4 py-2.5">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRegs.length === 0 ? (
                              <tr><td colSpan={4} className="text-center text-gray-600 py-6 px-4">Nenhum cadastro</td></tr>
                            ) : filteredRegs.slice(0, regLimit).map((r, i) => (
                              <tr key={r.id ?? i} className="border-b border-[#1A1A26] last:border-0">
                                <td className="px-4 py-2.5 text-gray-600">{filteredRegs.length - i}</td>
                                <td className="px-4 py-2.5 text-white font-medium">{r.name}</td>
                                <td className="px-4 py-2.5 text-gray-400">{r.phone}</td>
                                <td className="px-4 py-2.5 text-gray-500 text-xs">{r.created_at ? new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {filteredRegs.length > regLimit && (
                        <button onClick={() => setRegLimit(n => n + 10)} className="w-full py-2.5 text-orange-400 hover:text-orange-300 text-xs font-semibold border-t border-[#2A2A3A] transition-colors">
                          Ver mais ({filteredRegs.length - regLimit} restantes)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pagamentos */}
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold text-sm">QR Gerados & Pagamentos ({filteredPays.length})</h3>
                    <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#2A2A3A]">
                              <th className="text-left text-gray-500 font-medium px-4 py-2.5">Telefone</th>
                              <th className="text-left text-gray-500 font-medium px-4 py-2.5">Live</th>
                              <th className="text-left text-gray-500 font-medium px-4 py-2.5">Valor</th>
                              <th className="text-left text-gray-500 font-medium px-4 py-2.5">Status</th>
                              <th className="text-left text-gray-500 font-medium px-4 py-2.5">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPays.length === 0 ? (
                              <tr><td colSpan={5} className="text-center text-gray-600 py-6 px-4">Nenhum pagamento</td></tr>
                            ) : filteredPays.slice(0, payLimit).map((p, i) => {
                              const streamTitle = streams.find(s => s.id === p.stream_id)?.title ?? p.stream_id?.slice(0, 8) ?? '—'
                              return (
                                <tr key={p.id ?? i} className="border-b border-[#1A1A26] last:border-0">
                                  <td className="px-4 py-2.5 text-gray-300">{p.user_phone}</td>
                                  <td className="px-4 py-2.5 text-gray-400 max-w-32 truncate">{streamTitle}</td>
                                  <td className="px-4 py-2.5 text-white font-medium">{p.amount != null ? `R$ ${Number(p.amount).toFixed(2).replace('.', ',')}` : '—'}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === 'PAID' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                      {p.status === 'PAID' ? 'Pago' : 'Pendente'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-500 text-xs">{p.created_at ? new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      {filteredPays.length > payLimit && (
                        <button onClick={() => setPayLimit(n => n + 10)} className="w-full py-2.5 text-orange-400 hover:text-orange-300 text-xs font-semibold border-t border-[#2A2A3A] transition-colors">
                          Ver mais ({filteredPays.length - payLimit} restantes)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
        </div>
      )}

      {/* ── ABA: SUPORTE ── */}
      {activeTab === 'suporte' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Suporte</h2>
            <p className="text-gray-500 text-sm mt-0.5">Responda as mensagens dos usuários em tempo real</p>
          </div>
          <AdminSupport />
        </div>
      )}

      {/* ── ABA: ADMINS ── */}
      {activeTab === 'admins' && allowedTabs === null && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-white">Acessos Admin</h2>
            <p className="text-gray-500 text-sm mt-0.5">Crie contas com acesso restrito ao painel. Cada conta só vê as abas que você liberar.</p>
          </div>

          {/* Formulário de criação */}
          <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Novo acesso</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 text-xs mb-1">Nome</p>
                <input
                  type="text"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  placeholder="Ex: João Moderador"
                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">E-mail</p>
                <input
                  type="email"
                  value={newSubEmail}
                  onChange={e => setNewSubEmail(e.target.value)}
                  placeholder="admin@email.com"
                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="sm:col-span-2">
                <p className="text-gray-500 text-xs mb-1">Senha</p>
                <input
                  type="text"
                  value={newSubPassword}
                  onChange={e => setNewSubPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-xs mb-2">Abas liberadas</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: 'visual', label: 'Visual' },
                  { id: 'transmissao', label: 'Transmissão' },
                  { id: 'acesso', label: 'Acesso Gratuito' },
                  { id: 'notificar', label: 'Notificar' },
                  { id: 'afiliados', label: 'Afiliados' },
                  { id: 'dashboard', label: 'Dashboard' },
                ]).map(tab => {
                  const selected = newSubTabs.includes(tab.id)
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setNewSubTabs(prev => selected ? prev.filter(t => t !== tab.id) : [...prev, tab.id])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        selected
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'bg-[#0B0B0F] border-[#2A2A3A] text-gray-500 hover:border-orange-500/40 hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {subAdminError && <p className="text-red-500 text-xs">{subAdminError}</p>}

            <button
              onClick={createSubAdmin}
              disabled={creatingSubAdmin}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
            >
              {creatingSubAdmin ? 'Criando...' : 'Criar acesso'}
            </button>
          </div>

          {/* Lista de sub-admins */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Acessos criados</h3>
              <button
                onClick={loadSubAdmins}
                disabled={subAdminsLoading}
                className="text-gray-500 hover:text-white text-xs transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Atualizar
              </button>
            </div>

            {subAdminsLoading ? (
              <p className="text-gray-500 text-sm">Carregando...</p>
            ) : subAdmins.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhum acesso criado ainda.</p>
            ) : (
              <div className="space-y-2">
                {subAdmins.map(a => (
                  <div key={a.email} className="flex items-start justify-between gap-4 bg-[#12121A] border border-[#2A2A3A] rounded-xl px-4 py-3">
                    <div className="space-y-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{a.name}</p>
                      <p className="text-gray-500 text-xs">{a.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {a.allowed_tabs.map(tab => (
                          <span key={tab} className="text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">
                            {tab === 'visual' ? 'Visual'
                              : tab === 'transmissao' ? 'Transmissão'
                              : tab === 'acesso' ? 'Acesso Gratuito'
                              : tab === 'notificar' ? 'Notificar'
                              : tab === 'afiliados' ? 'Afiliados'
                              : tab === 'dashboard' ? 'Dashboard'
                              : tab}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSubAdmin(a.email)}
                      className="text-gray-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                      title="Remover acesso"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ABA: AGENDA ── */}
      {activeTab === 'agenda' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Agenda de Jogos</h2>
              <p className="text-gray-500 text-sm mt-0.5">Jogos exibidos no sino de notificação da navbar.</p>
            </div>
            <button
              onClick={toggleScheduleActive}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all"
              style={scheduleActive
                ? { background: 'rgba(255,106,0,0.12)', border: '1.5px solid rgba(255,106,0,0.6)', color: '#FF6A00' }
                : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#6b7280' }
              }
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: scheduleActive ? '#FF6A00' : '#4b5563' }} />
              {scheduleActive ? 'Ativa' : 'Inativa'}
            </button>
          </div>

          {scheduleLoading ? (
            <p className="text-gray-500 text-sm">Carregando...</p>
          ) : (
            <>
              {/* Título */}
              <div>
                <p className="text-gray-400 text-xs mb-1.5">Título do modal</p>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={e => setScheduleTitle(e.target.value)}
                  placeholder="Ex: Jogos desta semana"
                  className="w-full bg-[#12121A] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Jogos cadastrados */}
              {scheduleGames.length > 0 && (
                <div className="space-y-2">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Jogos ({scheduleGames.length})</p>
                  {scheduleGames.map(g => (
                    <div key={g.id} className="flex items-center gap-3 bg-[#12121A] border border-[#2A2A3A] rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {g.logo1
                          ? <img src={g.logo1} alt="" className="w-8 h-8 object-contain shrink-0 rounded" />
                          : <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4 text-gray-600" /></div>
                        }
                        <span className="text-white text-sm font-semibold truncate">{g.team1}</span>
                        <span className="text-gray-600 text-xs font-black px-1">×</span>
                        {g.logo2
                          ? <img src={g.logo2} alt="" className="w-8 h-8 object-contain shrink-0 rounded" />
                          : <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4 text-gray-600" /></div>
                        }
                        <span className="text-white text-sm font-semibold truncate">{g.team2}</span>
                        {g.league && <span className="text-gray-500 text-xs truncate hidden sm:block">· {g.league}</span>}
                      </div>
                      <span className="text-orange-400 text-xs font-bold whitespace-nowrap shrink-0">
                        {new Date(g.datetime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button onClick={() => removeGameFromSchedule(g.id)} className="text-gray-600 hover:text-red-500 transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão para abrir formulário */}
              {!showAddGameForm && (
                <button
                  onClick={() => setShowAddGameForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#2A2A3A] text-gray-500 hover:border-orange-500/40 hover:text-orange-400 text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar jogo
                </button>
              )}

              {/* Formulário de novo jogo */}
              {showAddGameForm && (
                <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-5">
                  <h3 className="text-white font-bold text-base">Adicionar jogo manualmente</h3>

                  {/* Nomes dos times */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1.5">Time da casa</p>
                      <input type="text" value={newGame.team1} onChange={e => setNewGame(p => ({ ...p, team1: e.target.value }))}
                        placeholder="Ex: Flamengo"
                        className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1.5">Time visitante</p>
                      <input type="text" value={newGame.team2} onChange={e => setNewGame(p => ({ ...p, team2: e.target.value }))}
                        placeholder="Ex: Vasco"
                        className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                    </div>
                  </div>

                  {/* Logo time da casa */}
                  <div>
                    <p className="text-gray-400 text-sm mb-1.5">Logo time da casa</p>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-[#0B0B0F] border border-[#2A2A3A] flex items-center justify-center shrink-0 overflow-hidden">
                        {newGame.logo1
                          ? <img src={newGame.logo1} alt="" className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display = 'none' }} />
                          : <ImageIcon className="w-5 h-5 text-gray-600" />
                        }
                      </div>
                      <input
                        type="text"
                        value={newGame.logo1}
                        onChange={e => setNewGame(p => ({ ...p, logo1: e.target.value }))}
                        placeholder="Cole a URL ou faça upload →"
                        className="flex-1 bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
                      />
                      <label className="w-12 h-12 rounded-xl bg-[#0B0B0F] border border-[#2A2A3A] flex items-center justify-center shrink-0 cursor-pointer hover:border-orange-500/50 transition-all">
                        {logo1Uploading
                          ? <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                          : <ImageIcon className="w-5 h-5 text-gray-500" />
                        }
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadTeamLogo(e.target.files[0], 1)} />
                      </label>
                    </div>
                  </div>

                  {/* Logo time visitante */}
                  <div>
                    <p className="text-gray-400 text-sm mb-1.5">Logo time visitante</p>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-[#0B0B0F] border border-[#2A2A3A] flex items-center justify-center shrink-0 overflow-hidden">
                        {newGame.logo2
                          ? <img src={newGame.logo2} alt="" className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display = 'none' }} />
                          : <ImageIcon className="w-5 h-5 text-gray-600" />
                        }
                      </div>
                      <input
                        type="text"
                        value={newGame.logo2}
                        onChange={e => setNewGame(p => ({ ...p, logo2: e.target.value }))}
                        placeholder="Cole a URL ou faça upload →"
                        className="flex-1 bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
                      />
                      <label className="w-12 h-12 rounded-xl bg-[#0B0B0F] border border-[#2A2A3A] flex items-center justify-center shrink-0 cursor-pointer hover:border-orange-500/50 transition-all">
                        {logo2Uploading
                          ? <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                          : <ImageIcon className="w-5 h-5 text-gray-500" />
                        }
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadTeamLogo(e.target.files[0], 2)} />
                      </label>
                    </div>
                  </div>

                  {/* Liga */}
                  <div>
                    <p className="text-gray-400 text-sm mb-1.5">Liga / Campeonato (opcional)</p>
                    <input type="text" value={newGame.league} onChange={e => setNewGame(p => ({ ...p, league: e.target.value }))}
                      placeholder="Ex: Brasileirão Série A"
                      className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                  </div>

                  {/* Data e hora */}
                  <div>
                    <p className="text-gray-400 text-sm mb-1.5">Data e horário do jogo</p>
                    <input type="datetime-local" value={newGame.datetime} onChange={e => setNewGame(p => ({ ...p, datetime: e.target.value }))}
                      className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3">
                    <button
                      onClick={addGameToSchedule}
                      disabled={!newGame.team1.trim() || !newGame.team2.trim() || !newGame.datetime}
                      className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm"
                    >
                      Adicionar jogo
                    </button>
                    <button
                      onClick={() => { setShowAddGameForm(false); setNewGame({ team1: '', team2: '', logo1: '', logo2: '', league: '', league_logo: '', datetime: '' }) }}
                      className="text-gray-400 hover:text-white font-semibold py-3 px-5 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      )}

      {/* Toasts de novos cadastros */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 bg-[#1A1A26] border border-orange-500/40 text-white rounded-xl px-4 py-3 shadow-2xl animate-slide-in min-w-64">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
              <span className="text-orange-400 text-sm font-bold">+1</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">{t.name}</p>
              <p className="text-gray-400 text-xs truncate">{t.phone} — novo cadastro</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-gray-600 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
