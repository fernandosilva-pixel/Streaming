'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Radio, Plus, Pencil, X, Megaphone, ImageIcon, Users, ChevronUp, ChevronDown, UserCheck, BarChart2, RefreshCw, CalendarDays, Headphones, Menu, LogOut } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import AdminSupport from '@/components/admin/AdminSupport'

type Banner = {
  id: string
  image_url: string
  game_id: number | null
  stream_id: string | null
  display_order: number
  category: 'futebol' | 'basquete' | null
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
  payment_method: 'bspay' | 'fixed_qr' | null
  fixed_qr_url: string | null
  chat_enabled: boolean
  coupon_enabled: boolean
  coupon_code: string | null
  coupon_quantity: number
  category: 'futebol' | 'basquete' | null
}

export default function AdminPage() {
  const router = useRouter()

  // Banner principal
  const [banner, setBanner] = useState<Banner | null>(null)
  const [extraBanners, setExtraBanners] = useState<Banner[]>([])
  const [extraUploading, setExtraUploading] = useState(false)
  const [movingBanner, setMovingBanner] = useState<string | null>(null)
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null)
  const [bannerCategoryModal, setBannerCategoryModal] = useState(false)

  // Próximos Jogos (carousel_banners)
  const [carouselBanners, setCarouselBanners] = useState<{ id: string; image_url: string; mobile_image_url: string | null; display_order: number }[]>([])
  const [carouselUploading, setCarouselUploading] = useState(false)
  const [isCarouselDragging, setIsCarouselDragging] = useState(false)

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
  const [activeTab, setActiveTab] = useState<'visual' | 'transmissao' | 'acesso' | 'notificar' | 'afiliados' | 'dashboard' | 'admins' | 'agenda' | 'suporte' | 'usuarios' | 'assinaturas'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
  const [editingSubEmail, setEditingSubEmail] = useState<string | null>(null)
  const [editingSubTabs, setEditingSubTabs] = useState<string[]>([])

  // Usuários
  type RegUser = { id: string; name: string; email: string; phone: string; plan?: string | null; plan_expires_at?: string | null; created_at?: string }
  const [usuariosLoading, setUsuariosLoading] = useState(false)
  const [usuarios, setUsuarios] = useState<RegUser[]>([])
  const [usuariosSearch, setUsuariosSearch] = useState('')
  const [usuariosLimit, setUsuariosLimit] = useState(25)
  const [editUserModal, setEditUserModal] = useState<RegUser | null>(null)
  const [editUserName, setEditUserName] = useState('')
  const [editUserEmail, setEditUserEmail] = useState('')
  const [editUserPassword, setEditUserPassword] = useState('')
  const [editUserSaving, setEditUserSaving] = useState(false)
  const [editUserError, setEditUserError] = useState('')
  const [editUserSuccess, setEditUserSuccess] = useState(false)

  async function loadUsuarios() {
    setUsuariosLoading(true)
    const { data } = await supabase.from('registrations').select('id, name, email, phone, plan, plan_expires_at, created_at').order('created_at', { ascending: false }).limit(1000)
    setUsuarios((data ?? []) as RegUser[])
    setUsuariosLoading(false)
  }

  function openEditUser(u: RegUser) {
    setEditUserModal(u)
    setEditUserName(u.name ?? '')
    const display = u.email?.endsWith('@futzone.app')
      ? u.email.replace('@futzone.app', '').replace(/^55/, '')
      : (u.email ?? '')
    setEditUserEmail(display)
    setEditUserPassword('')
    setEditUserError('')
    setEditUserSuccess(false)
  }

  async function saveEditUser() {
    if (!editUserModal) return
    setEditUserSaving(true)
    setEditUserError('')
    setEditUserSuccess(false)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ id: editUserModal.id, name: editUserName, email: editUserEmail, password: editUserPassword || undefined }),
    })
    const data = await res.json()
    if (!res.ok) { setEditUserError(data.error ?? 'Erro ao salvar'); setEditUserSaving(false); return }
    setEditUserSuccess(true)
    setUsuarios(prev => prev.map(u => {
      if (u.id !== editUserModal.id) return u
      const digits = editUserEmail.replace(/\D/g, '')
      const isPhone = /^\d{8,}$/.test(editUserEmail.trim())
      const newEmail = isPhone ? `55${digits.startsWith('55') ? digits.slice(2) : digits}@futzone.app` : editUserEmail.trim()
      return { ...u, name: editUserName || u.name, email: newEmail }
    }))
    setEditUserSaving(false)
    setTimeout(() => setEditUserModal(null), 1200)
  }

  useEffect(() => { if (activeTab === 'usuarios') loadUsuarios() }, [activeTab])

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
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [editingGame, setEditingGame] = useState<Omit<ScheduleGame, 'id'>>({ team1: '', team2: '', logo1: '', logo2: '', league: '', league_logo: '', datetime: '' })
  const [editLogo1Uploading, setEditLogo1Uploading] = useState(false)
  const [editLogo2Uploading, setEditLogo2Uploading] = useState(false)
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

  async function uploadEditLogo(file: File, team: 1 | 2) {
    const setter = team === 1 ? setEditLogo1Uploading : setEditLogo2Uploading
    setter(true)
    const ext = file.name.split('.').pop() ?? 'png'
    const fileName = `team-logos/${Date.now()}-edit-${team}.${ext}`
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType: file.type || 'image/png' })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
      setEditingGame(p => ({ ...p, [team === 1 ? 'logo1' : 'logo2']: publicUrl }))
    }
    setter(false)
  }

  async function saveEditedGame() {
    if (!editingGameId || !editingGame.team1.trim() || !editingGame.team2.trim() || !editingGame.datetime) return
    const updated = scheduleGames.map(g => g.id === editingGameId ? { ...editingGame, id: editingGameId } : g)
    setScheduleGames(updated)
    setEditingGameId(null)
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
  type DashRegistration = { id?: string; name: string; phone: string; email?: string; plan?: string | null; plan_expires_at?: string | null; created_at?: string; whatsapp_added_at?: string | null }
  type DashPayment = { id: string; stream_id: string; user_phone: string; amount?: number; status: string; referral_code?: string | null; created_at?: string }
  type DashPlanPayment = { id: string; user_email: string; amount?: number; status: string; plan_type?: string | null; created_at?: string }
  const [dashLoading, setDashLoading] = useState(false)
  const [dashRegistrations, setDashRegistrations] = useState<DashRegistration[]>([])
  const [dashPayments, setDashPayments] = useState<DashPayment[]>([])
  const [dashPlanPayments, setDashPlanPayments] = useState<DashPlanPayment[]>([])
  const [dashStreamFilter, setDashStreamFilter] = useState<string>('all')
  const [dashDateFilter, setDashDateFilter] = useState<string>('all')
  const [regLimit, setRegLimit] = useState(5)
  const [payLimit, setPayLimit] = useState(5)
  const [waBatch, setWaBatch] = useState<{ running: boolean; total: number; done: number; skipped: number; errors: number } | null>(null)
  const waBatchStopRef = useRef(false)

  // Suporte — badge de tickets abertos
  const [supportOpenCount, setSupportOpenCount] = useState(0)

  async function pollSupportCount() {
    const [{ data: msgs }, { data: closed }] = await Promise.all([
      supabase.from('support_messages').select('session_id'),
      supabase.from('support_statuses').select('session_id').eq('status', 'closed'),
    ])
    const allSessions = new Set((msgs ?? []).map((m: { session_id: string }) => m.session_id))
    const closedSessions = new Set((closed ?? []).map((c: { session_id: string }) => c.session_id))
    setSupportOpenCount([...allSessions].filter(id => !closedSessions.has(id)).length)
  }

  // Status das integrações
  type ServiceStatus = { ok: boolean; latencyMs: number; name: string; status?: number }
  type HealthData = { checkedAt: string; services: Record<string, ServiceStatus> }
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [costAlert, setCostAlert] = useState<string | null>(null)

  async function checkHealth() {
    setHealthLoading(true)
    try {
      const res = await fetch('/api/status/health')
      const data = await res.json()
      setHealthData(data)
      const downServices = Object.values(data.services as Record<string, ServiceStatus>).filter(s => !s.ok).map(s => s.name)
      if (downServices.length > 0) setCostAlert(`Serviço(s) com problema: ${downServices.join(', ')}`)
      else setCostAlert(null)
    } catch {
      setCostAlert('Erro ao verificar integrações')
    }
    setHealthLoading(false)
  }

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
    const [regRes, payRes, planRes] = await Promise.all([
      supabase.from('registrations').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('plan_payments').select('id, user_email, amount, status, plan_type, created_at').order('created_at', { ascending: false }).limit(1000),
    ])
    setDashRegistrations(regRes.data ?? [])
    setDashPayments(payRes.data ?? [])
    setDashPlanPayments(planRes.data ?? [])
    setDashLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'assinaturas' || activeTab === 'usuarios') loadAdminDashboard()
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
      pollSupportCount()
      const supportInterval = setInterval(pollSupportCount, 60000)
      return () => clearInterval(supportInterval)
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
    setChargeModalAmount('10.00')
  }

  async function confirmChargedUser() {
    if (!chargeModal) return
    const { streamId, email } = chargeModal
    await supabase.from('stream_charged_users').upsert(
      { stream_id: streamId, user_email: email, payment_method: 'bspay', charge_amount: parseFloat(chargeModalAmount) },
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



  function isImageFile(file: File) {
    return file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg')
  }

  function getContentType(file: File) {
    return file.type || (file.name.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream')
  }


  // Intercepta o drop/click — abre modal de categoria antes de fazer upload
  function requestBannerCategory(file: File) {
    if (!isImageFile(file)) return
    setPendingBannerFile(file)
    setBannerCategoryModal(true)
  }

  // Carrossel extra: upload direto, salva como nova linha
  async function handleExtraFile(file: File, category: 'futebol' | 'basquete' | null) {
    setExtraUploading(true)
    setBannerCategoryModal(false)
    setPendingBannerFile(null)
    const ext = file.name.split('.').pop()
    const fileName = `banner-extra-${Date.now()}.${ext}`
    const contentType = getContentType(file)
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType })
    if (error) { alert('Erro no upload: ' + error.message); setExtraUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    const nextOrder = [banner, ...extraBanners].filter(Boolean).length
    await supabase.from('banner').insert({ image_url: publicUrl, game_id: null, display_order: nextOrder, category })
    await loadAllBanners()
    setExtraUploading(false)
  }

  async function updateBannerCategory(id: string, category: 'futebol' | 'basquete' | null) {
    await supabase.from('banner').update({ category }).eq('id', id)
    await loadAllBanners()
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
    const value = newAdminPhone.trim().toLowerCase()
    if (!value) return
    setAddingAdmin(true)
    const isPhone = /^\+?\d[\d\s\-()]{6,}$/.test(value)
    const query = supabase.from('registrations').update({ is_admin: true }).select('id, name, email')
    const { data, error } = await (isPhone
      ? query.eq('phone', value.replace(/\D/g, '')).single()
      : query.eq('email', value).single())
    if (error || !data) {
      alert('Usuário não encontrado. Verifique o e-mail ou telefone.')
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
      payment_method: 'bspay',
      fixed_qr_url: null,
      charge_amount: amount,
    }).eq('id', chargeAmountModal.id)
    if (error) { alert('Erro: ' + error.message); setChargeAmountSaving(false); return }
    setStreams(prev => prev.map(s => s.id === chargeAmountModal.id
      ? { ...s, charge_enabled: true, payment_method: 'bspay', fixed_qr_url: null, charge_amount: amount }
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

  async function updateSubAdmin() {
    if (!editingSubEmail || !editingSubTabs.length) return
    await fetch('/api/admin/sub', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: editingSubEmail, allowed_tabs: editingSubTabs }) })
    setSubAdmins(prev => prev.map(a => a.email === editingSubEmail ? { ...a, allowed_tabs: editingSubTabs } : a))
    setEditingSubEmail(null)
    setEditingSubTabs([])
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Verificando acesso...</p>
      </div>
    )
  }


  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0B0F]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-[#0D0D14] border-r border-[#1E1E2A] transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center justify-center px-5 h-16 border-b border-[#1E1E2A] shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-9 w-auto max-w-[150px] object-contain" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
              <span className="text-white font-black text-base">F</span>
            </div>
          )}
        </div>

        {/* Online indicator */}
        <div className="px-3 pt-3 pb-2 border-b border-[#1E1E2A] shrink-0">
          <button
            onClick={() => setShowOnlineList(v => !v)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="text-green-400 font-bold text-sm tabular-nums">{onlineUsers}</span>
            <span className="text-gray-500 text-xs">online agora</span>
          </button>
          {showOnlineList && (
            <div className="mt-1 bg-[#12121A] border border-[#2A2A3A] rounded-xl max-h-44 overflow-y-auto">
              {onlineList.length === 0 ? (
                <p className="text-gray-500 text-xs px-3 py-2">Ninguém online</p>
              ) : (
                <ul className="divide-y divide-[#2A2A3A]">
                  {onlineList.map((u, i) => (
                    <li key={i} className="px-3 py-2 flex items-center gap-2">
                      {u.flag ? (
                        <img src={u.flag} alt={u.country} className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
                      ) : (
                        <span className="w-5 h-3.5 rounded-sm bg-white/10 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">{u.name}</p>
                        <p className="text-gray-500 text-[10px] truncate">{u.phone}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {([
            {
              group: 'PRINCIPAL',
              items: [
                { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="w-4 h-4" /> },
              ],
            },
            {
              group: 'TRANSMISSÕES',
              items: [
                { id: 'visual', label: 'Visual', icon: <ImageIcon className="w-4 h-4" /> },
                { id: 'transmissao', label: 'Transmissão', icon: <Radio className="w-4 h-4" /> },
                { id: 'agenda', label: 'Agenda', icon: <CalendarDays className="w-4 h-4" /> },
              ],
            },
            {
              group: 'COMUNICAÇÃO',
              items: [
                { id: 'notificar', label: 'Notificar', icon: <Megaphone className="w-4 h-4" /> },
                { id: 'suporte', label: 'Suporte', icon: <Headphones className="w-4 h-4" />, badge: activeTab !== 'suporte' && supportOpenCount > 0 ? supportOpenCount : undefined },
              ],
            },
            {
              group: 'USUÁRIOS',
              items: [
                { id: 'acesso', label: 'Acesso Gratuito', icon: <Users className="w-4 h-4" /> },
                { id: 'usuarios', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
                { id: 'assinaturas', label: 'Assinaturas', icon: <UserCheck className="w-4 h-4" /> },
                { id: 'afiliados', label: 'Afiliados', icon: <UserCheck className="w-4 h-4" /> },
              ],
            },
            {
              group: 'SISTEMA',
              items: [
                ...(allowedTabs === null ? [{ id: 'admins', label: 'Admins', icon: <UserCheck className="w-4 h-4" /> }] : []),
              ],
            },
          ] as { group: string; items: { id: string; label: string; icon: React.ReactNode; badge?: number }[] }[])
            .map(section => {
              const visible = section.items.filter(item => allowedTabs === null || allowedTabs.includes(item.id))
              if (!visible.length) return null
              return (
                <div key={section.group}>
                  <p className="text-gray-600 text-[9px] font-black tracking-widest px-3 mb-1.5 uppercase">{section.group}</p>
                  <div className="space-y-0.5">
                    {visible.map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id as typeof activeTab); setSidebarOpen(false) }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                          activeTab === item.id
                            ? 'bg-orange-500/15 text-orange-400 border-l-2 border-orange-500 pl-[10px]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        {item.badge != null && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-orange-500 text-white min-w-[18px] text-center leading-4">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[#1E1E2A] shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 lg:ml-64 overflow-y-auto min-h-screen">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-[#1E1E2A] bg-[#0D0D14] sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white p-1 -ml-1 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-black text-sm">FutZone Admin</span>
          <button onClick={() => setShowOnlineList(v => !v)} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-bold text-xs tabular-nums">{onlineUsers}</span>
          </button>
        </div>

        <div className="p-6 space-y-6 max-w-5xl mx-auto">

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

          {/* Banners */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-white">Banners</h2>
              <p className="text-gray-500 text-sm mt-0.5">Adicione uma ou mais imagens — quando houver mais de uma, o sistema rotaciona automaticamente.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <input id="extraInput" type="file" accept="image/*,.svg" className="hidden" onChange={e => { if (e.target.files?.[0]) { requestBannerCategory(e.target.files[0]); e.target.value = '' } }} />
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
                    <button
                      title="Clique para trocar categoria"
                      onClick={() => {
                        const next = b!.category === null ? 'futebol' : b!.category === 'futebol' ? 'basquete' : null
                        updateBannerCategory(b!.id, next)
                      }}
                      className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 text-xs font-bold px-1.5 py-0.5 rounded transition-all z-10"
                      style={{ background: b!.category === 'futebol' ? '#16a34a' : b!.category === 'basquete' ? '#2563eb' : 'rgba(0,0,0,0.7)' }}
                    >
                      {b!.category === 'futebol' ? '⚽ Futebol' : b!.category === 'basquete' ? '🏀 Basquete' : '🌐 Todos'}
                    </button>
                  </div>
                )
              })}
              <div
                onClick={() => document.getElementById('extraInput')?.click()}
                onDragOver={e => { e.preventDefault() }}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) requestBannerCategory(f) }}
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
                          onClick={async () => {
                            const next = s.category === 'basquete' ? 'futebol' : 'basquete'
                            await supabase.from('streams').update({ category: next }).eq('id', s.id)
                            setStreams(prev => prev.map(x => x.id === s.id ? { ...x, category: next } : x))
                          }}
                          className={`text-xs font-bold px-3 py-2 rounded-lg transition-all text-center ${s.category === 'basquete' ? 'bg-orange-600/20 text-orange-400' : 'bg-[#2A2A3A] text-gray-400 hover:bg-orange-600/20 hover:text-orange-400'}`}>
                          {s.category === 'basquete' ? '🏀 Basquete' : '⚽ Futebol'}
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
              type="text"
              placeholder="E-mail ou telefone do usuário"
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
                type="text"
                placeholder="E-mail ou telefone do usuário"
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

      {/* Modal — categoria do banner */}
      {bannerCategoryModal && pendingBannerFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setBannerCategoryModal(false); setPendingBannerFile(null) }} />
          <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-5 shadow-2xl">
            <button onClick={() => { setBannerCategoryModal(false); setPendingBannerFile(null) }} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white">Esse banner é para qual público?</h2>
              <p className="text-gray-500 text-sm mt-1">Usuários que escolheram outra categoria não verão esse banner.</p>
            </div>
            <div className="flex gap-3">
              {([
                { label: '⚽ Futebol', value: 'futebol' as const, color: '#16a34a' },
                { label: '🏀 Basquete', value: 'basquete' as const, color: '#2563eb' },
                { label: '🌐 Todos', value: null, color: '#f97316' },
              ] as { label: string; value: 'futebol' | 'basquete' | null; color: string }[]).map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => handleExtraFile(pendingBannerFile, opt.value)}
                  className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
                  style={{ background: opt.color + '22', border: `1px solid ${opt.color}55` }}
                >
                  <span style={{ fontSize: 32 }}>{opt.label.split(' ')[0]}</span>
                  <span>{opt.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
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
              <h2 className="text-xl font-black text-white">Dashboard</h2>
              <p className="text-gray-500 text-sm mt-0.5">Cadastros, QR gerados e pagamentos de todas as lives.</p>
            </div>
            <button onClick={loadAdminDashboard} disabled={dashLoading} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${dashLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-[#12121A] border border-[#2A2A3A] rounded-xl p-1">
              {(['all', 'today', 'yesterday', 'week'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setDashDateFilter(opt)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${dashDateFilter === opt ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {opt === 'all' ? 'Tudo' : opt === 'today' ? 'Hoje' : opt === 'yesterday' ? 'Ontem' : 'Semana'}
                </button>
              ))}
            </div>
            <select
              value={dashStreamFilter}
              onChange={e => setDashStreamFilter(e.target.value)}
              className="bg-[#12121A] border border-[#2A2A3A] text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="all">Todas as lives</option>
              {streams.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
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
              const pendingCount = filteredPays.filter(p => p.status !== 'PAID').length
              const revenue = filteredPays.filter(p => p.status === 'PAID').reduce((s, p) => s + (p.amount ?? 0), 0)
              const directPaid = filteredPays.filter(p => !p.referral_code && p.status === 'PAID').length
              const affiliatePaid = filteredPays.filter(p => p.referral_code && p.status === 'PAID').length
              const activeSubs = dashRegistrations.filter(r => (r.plan === 'semanal' || r.plan === 'mensal') && r.plan_expires_at && new Date(r.plan_expires_at) > now).length

              // Chart: revenue per day — last 7 days
              const chartData = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i))
                const dayStart = startOf(d); const dayEnd = new Date(dayStart.getTime() + 86400000)
                const dayPays = dashPayments
                  .filter(p => dashStreamFilter === 'all' || p.stream_id === dashStreamFilter)
                  .filter(p => p.status === 'PAID' && p.created_at && new Date(p.created_at) >= dayStart && new Date(p.created_at) < dayEnd)
                return {
                  dia: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                  receita: parseFloat(dayPays.reduce((s, p) => s + (p.amount ?? 0), 0).toFixed(2)),
                  pagamentos: dayPays.length,
                }
              })

              return (
                <div className="space-y-6">

                  {/* Cards principais */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { label: 'Receita Total', value: `R$ ${revenue.toFixed(2).replace('.', ',')}`, sub: `${paidCount} pagamento${paidCount !== 1 ? 's' : ''} confirmado${paidCount !== 1 ? 's' : ''}`, accent: true },
                      { label: 'Cadastros', value: filteredRegs.length.toLocaleString('pt-BR'), sub: `${waCount} no grupo WhatsApp` },
                      { label: 'Assinaturas Ativas', value: activeSubs.toLocaleString('pt-BR'), sub: 'Semanal + Mensal' },
                    ].map(({ label, value, sub, accent }) => (
                      <div key={label} className={`rounded-xl p-5 border ${accent ? 'bg-orange-500/10 border-orange-500/25' : 'bg-[#12121A] border-[#2A2A3A]'}`}>
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</p>
                        <p className={`text-3xl font-black mt-2 ${accent ? 'text-orange-400' : 'text-white'}`}>{value}</p>
                        <p className="text-gray-500 text-xs mt-1">{sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'QR Gerados', value: qrCount, sub: 'Total de cobranças' },
                      { label: 'QR Pendentes', value: pendingCount, sub: 'Aguardando pagamento' },
                      { label: 'Direto Pago', value: directPaid, sub: 'Sem afiliado' },
                      { label: 'Afiliado Pago', value: affiliatePaid, sub: 'Via link de afiliado' },
                    ].map(({ label, value, sub }) => (
                      <div key={label} className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
                        <p className="text-2xl font-black text-white mt-2">{value.toLocaleString('pt-BR')}</p>
                        <p className="text-gray-600 text-xs mt-1">{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Gráfico de receita */}
                  <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-white font-bold text-sm flex items-center gap-2"><BarChart2 className="w-4 h-4 text-orange-400" /> Métricas — últimos 7 dias</p>
                        <p className="text-gray-500 text-xs mt-0.5">Receita e pagamentos por dia{dashStreamFilter !== 'all' ? ` · ${streams.find(s => s.id === dashStreamFilter)?.title ?? ''}` : ''}</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorPag" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" vertical={false} />
                        <XAxis dataKey="dia" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={45} tickFormatter={v => `R$${v}`} />
                        <Tooltip
                          contentStyle={{ background: '#12121A', border: '1px solid #2A2A3A', borderRadius: '12px', fontSize: '12px' }}
                          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                          formatter={(v, name) => [name === 'receita' ? `R$ ${Number(v).toFixed(2).replace('.', ',')}` : v, name === 'receita' ? 'Receita' : 'Pagamentos']}
                        />
                        <Area type="monotone" dataKey="receita" stroke="#f97316" strokeWidth={2} fill="url(#colorReceita)" dot={{ fill: '#f97316', r: 3 }} activeDot={{ r: 5 }} />
                        <Area type="monotone" dataKey="pagamentos" stroke="#22c55e" strokeWidth={2} fill="url(#colorPag)" dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-0.5 bg-orange-400 inline-block rounded" /> Receita (R$)</span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-0.5 bg-green-400 inline-block rounded" /> Pagamentos</span>
                    </div>
                  </div>

                  {/* WA em lote */}
                  <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-sm">Adicionar ao Grupo WhatsApp</p>
                        <p className="text-gray-500 text-xs mt-0.5">Processa todos os números BR pendentes, 1 por vez com 5min de intervalo.</p>
                      </div>
                      <div className="flex gap-2">
                        {waBatch?.running ? (
                          <button onClick={stopWaBatch} className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all">Parar</button>
                        ) : (
                          <>
                            <button onClick={runWaBatch} className="bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all">{waBatch ? 'Reiniciar' : 'Iniciar'}</button>
                            {waBatch && !waBatch.running && (
                              <button onClick={runWaBatch} className="bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all">Continuar</button>
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
                          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: waBatch.total > 0 ? `${((waBatch.done + waBatch.skipped + waBatch.errors) / waBatch.total) * 100}%` : '0%' }} />
                        </div>
                        {!waBatch.running && <p className="text-green-400 text-xs">Concluído.</p>}
                      </div>
                    )}
                  </div>

                  {/* QR Codes — cards */}
                  <div>
                    <p className="text-white font-bold text-sm mb-3">QR Codes Gerados & Pagamentos</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-5">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">PIX Gerados</p>
                        <p className="text-3xl font-black text-white mt-2">{qrCount.toLocaleString('pt-BR')}</p>
                        <p className="text-gray-600 text-xs mt-1">Total de cobranças</p>
                      </div>
                      <div className="bg-[#12121A] border border-green-500/20 rounded-xl p-5">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">PIX Pagos</p>
                        <p className="text-3xl font-black text-green-400 mt-2">{paidCount.toLocaleString('pt-BR')}</p>
                        <p className="text-gray-600 text-xs mt-1">Confirmados</p>
                      </div>
                      <div className="bg-[#12121A] border border-green-500/20 rounded-xl p-5">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Valor Pago</p>
                        <p className="text-3xl font-black text-green-400 mt-2">R$ {revenue.toFixed(2).replace('.', ',')}</p>
                        <p className="text-gray-600 text-xs mt-1">Receita confirmada</p>
                      </div>
                      <div className="bg-[#12121A] border border-yellow-500/20 rounded-xl p-5">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Valor Pendente</p>
                        <p className="text-3xl font-black text-yellow-400 mt-2">
                          R$ {filteredPays.filter(p => p.status !== 'PAID').reduce((s, p) => s + (p.amount ?? 0), 0).toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-gray-600 text-xs mt-1">{pendingCount} aguardando</p>
                      </div>
                    </div>
                  </div>

                  {/* Cohorts */}
                  {(() => {
                    // Normaliza identificador para agrupar variações do mesmo usuário
                    function normalizeId(raw: string): string {
                      if (!raw) return raw
                      if (raw.includes('@') && !raw.endsWith('@futzone.app')) return raw.toLowerCase() // email real
                      const digits = raw.replace('@futzone.app', '').replace(/\D/g, '')
                      return digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
                    }

                    // Linha unificada: { key, amount, label, date }
                    type CohortEntry = { amount: number; label: string; date: string }
                    const byUser: Record<string, CohortEntry[]> = {}

                    for (const p of dashPayments.filter(p => p.status === 'PAID')) {
                      const key = normalizeId(p.user_phone)
                      if (!byUser[key]) byUser[key] = []
                      byUser[key].push({
                        amount: p.amount ?? 0,
                        label: streams.find(s => s.id === p.stream_id)?.title ?? 'Jogo avulso',
                        date: p.created_at ?? '',
                      })
                    }

                    for (const p of dashPlanPayments.filter(p => p.status === 'PAID')) {
                      const key = normalizeId(p.user_email)
                      if (!byUser[key]) byUser[key] = []
                      byUser[key].push({
                        amount: p.amount ?? 0,
                        label: p.plan_type === 'semanal' ? 'Plano Semanal' : 'Plano Mensal',
                        date: p.created_at ?? '',
                      })
                    }

                    const uniquePayers = Object.keys(byUser).length
                    const recurring = Object.entries(byUser).filter(([, entries]) => entries.length >= 2)
                    recurring.sort((a, b) => b[1].length - a[1].length)
                    const recurrenceRate = uniquePayers > 0 ? ((recurring.length / uniquePayers) * 100).toFixed(1) : '0'
                    const recurringRevenue = recurring.reduce((s, [, entries]) => s + entries.reduce((ss, e) => ss + e.amount, 0), 0)

                    return (
                      <div className="space-y-4">
                        <p className="text-white font-bold text-sm">Cohorts — Recorrência de Pagadores</p>
                        <p className="text-gray-500 text-xs -mt-2">Considera avulso + planos. Limitado aos últimos 1.000 registros de cada tabela.</p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { label: 'Pagadores Únicos', value: uniquePayers.toLocaleString('pt-BR'), sub: 'Total histórico (avulso + planos)', color: 'text-white' },
                            { label: 'Recorrentes (2+)', value: recurring.length.toLocaleString('pt-BR'), sub: 'Pagaram mais de uma vez', color: 'text-orange-400' },
                            { label: 'Taxa Recorrência', value: `${recurrenceRate}%`, sub: 'Do total de pagadores', color: 'text-blue-400' },
                            { label: 'Receita Recorrentes', value: `R$ ${recurringRevenue.toFixed(2).replace('.', ',')}`, sub: 'De clientes fiéis', color: 'text-green-400' },
                          ].map(c => (
                            <div key={c.label} className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4">
                              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{c.label}</p>
                              <p className={`text-2xl font-black mt-2 ${c.color}`}>{c.value}</p>
                              <p className="text-gray-600 text-xs mt-1">{c.sub}</p>
                            </div>
                          ))}
                        </div>
                        {recurring.length > 0 && (
                          <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-[#2A2A3A]">
                                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Usuário</th>
                                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Pagamentos</th>
                                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">O que comprou</th>
                                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Total gasto</th>
                                    <th className="text-left text-gray-500 font-medium px-4 py-2.5">Última compra</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recurring.slice(0, 20).map(([key, entries]) => {
                                    const reg = dashRegistrations.find(r =>
                                      normalizeId(r.phone ?? '') === key ||
                                      normalizeId(r.email ?? '') === key
                                    )
                                    const labels = [...new Set(entries.map(e => e.label))]
                                    const total = entries.reduce((s, e) => s + e.amount, 0)
                                    const lastDate = entries.map(e => e.date).filter(Boolean).sort().at(-1)
                                    const displayId = key.includes('@') ? key : key
                                    return (
                                      <tr key={key} className="border-b border-[#1A1A26] last:border-0">
                                        <td className="px-4 py-2.5">
                                          <p className="text-white font-medium">{reg?.name ?? '—'}</p>
                                          <p className="text-gray-500 text-xs font-mono">{displayId}</p>
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <span className="text-orange-400 font-black text-base">{entries.length}×</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-gray-400 text-xs max-w-48">
                                          {labels.slice(0, 3).join(', ')}{labels.length > 3 ? ` +${labels.length - 3}` : ''}
                                        </td>
                                        <td className="px-4 py-2.5 text-green-400 font-bold">R$ {total.toFixed(2).replace('.', ',')}</td>
                                        <td className="px-4 py-2.5 text-gray-500 text-xs">{lastDate ? new Date(lastDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )
            })()}
        </div>
      )}

      {/* ── ABA: ASSINATURAS ── */}
      {activeTab === 'assinaturas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">Assinaturas</h2>
              <p className="text-gray-500 text-sm mt-0.5">Clientes com plano semanal ou mensal ativo ou vencido.</p>
            </div>
            <button onClick={loadAdminDashboard} disabled={dashLoading} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${dashLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
          {dashLoading ? <p className="text-gray-500 text-sm">Carregando...</p> : (() => {
            const now = new Date()
            const subs = dashRegistrations
              .filter(r => (r.plan === 'semanal' || r.plan === 'mensal') && r.plan_expires_at)
              .map(r => {
                const expiresAt = new Date(r.plan_expires_at!)
                const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000)
                return { ...r, expiresAt, daysLeft, active: daysLeft > 0 }
              })
              .sort((a, b) => b.daysLeft - a.daysLeft)
            const activeCount = subs.filter(s => s.active).length
            const expiredCount = subs.length - activeCount
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-black text-white mt-1">{subs.length}</p>
                  </div>
                  <div className="bg-[#12121A] border border-green-500/20 rounded-xl p-4">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Ativas</p>
                    <p className="text-2xl font-black text-green-400 mt-1">{activeCount}</p>
                  </div>
                  <div className="bg-[#12121A] border border-red-500/20 rounded-xl p-4">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Vencidas</p>
                    <p className="text-2xl font-black text-red-400 mt-1">{expiredCount}</p>
                  </div>
                </div>
                <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2A2A3A]">
                          <th className="text-left text-gray-500 font-medium px-4 py-2.5">Usuário</th>
                          <th className="text-left text-gray-500 font-medium px-4 py-2.5">Plano</th>
                          <th className="text-left text-gray-500 font-medium px-4 py-2.5">Status</th>
                          <th className="text-left text-gray-500 font-medium px-4 py-2.5">Dias restantes</th>
                          <th className="text-left text-gray-500 font-medium px-4 py-2.5">Vence em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subs.length === 0 ? (
                          <tr><td colSpan={5} className="text-center text-gray-600 py-6 px-4">Nenhuma assinatura ainda</td></tr>
                        ) : subs.map((s, i) => (
                          <tr key={s.id ?? i} className="border-b border-[#1A1A26] last:border-0">
                            <td className="px-4 py-2.5">
                              <p className="text-gray-200 font-medium">{s.name}</p>
                              <p className="text-gray-500 text-xs">{s.email?.endsWith('@futzone.app') ? s.email.replace('@futzone.app','').replace(/^55/,'') : s.email}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.plan === 'mensal' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                {s.plan === 'mensal' ? 'Mensal' : 'Semanal'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {s.active ? 'Ativo' : 'Vencido'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {s.active ? (
                                <span className={`font-bold ${s.daysLeft <= 2 ? 'text-red-400' : s.daysLeft <= 5 ? 'text-yellow-400' : 'text-white'}`}>
                                  {s.daysLeft} dia{s.daysLeft !== 1 ? 's' : ''}
                                </span>
                              ) : <span className="text-gray-600">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                              {s.expiresAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  { id: 'suporte', label: 'Suporte' },
                  { id: 'agenda', label: 'Agenda' },
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
                  <div key={a.email} className="bg-[#12121A] border border-[#2A2A3A] rounded-xl px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-white font-semibold text-sm">{a.name}</p>
                        <p className="text-gray-500 text-xs">{a.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { setEditingSubEmail(a.email); setEditingSubTabs(a.allowed_tabs) }}
                          className="text-gray-500 hover:text-orange-400 transition-colors text-xs border border-[#2A2A3A] hover:border-orange-500/40 px-2 py-1 rounded-lg"
                          title="Editar abas"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteSubAdmin(a.email)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                          title="Remover acesso"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {editingSubEmail === a.email ? (
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap gap-2">
                          {([
                            { id: 'visual', label: 'Visual' },
                            { id: 'transmissao', label: 'Transmissão' },
                            { id: 'acesso', label: 'Acesso Gratuito' },
                            { id: 'notificar', label: 'Notificar' },
                            { id: 'afiliados', label: 'Afiliados' },
                            { id: 'dashboard', label: 'Dashboard' },
                            { id: 'suporte', label: 'Suporte' },
                            { id: 'agenda', label: 'Agenda' },
                          ]).map(tab => {
                            const sel = editingSubTabs.includes(tab.id)
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setEditingSubTabs(prev => sel ? prev.filter(t => t !== tab.id) : [...prev, tab.id])}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${sel ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-[#0B0B0F] border-[#2A2A3A] text-gray-500 hover:border-orange-500/40 hover:text-gray-300'}`}
                              >
                                {tab.label}
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={updateSubAdmin} className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold rounded-lg transition-all">Salvar</button>
                          <button onClick={() => setEditingSubEmail(null)} className="px-4 py-1.5 bg-[#1A1A26] text-gray-400 text-xs font-bold rounded-lg border border-[#2A2A3A] hover:text-white transition-all">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {a.allowed_tabs.map(tab => (
                          <span key={tab} className="text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">
                            {tab === 'visual' ? 'Visual'
                              : tab === 'transmissao' ? 'Transmissão'
                              : tab === 'acesso' ? 'Acesso Gratuito'
                              : tab === 'notificar' ? 'Notificar'
                              : tab === 'afiliados' ? 'Afiliados'
                              : tab === 'dashboard' ? 'Dashboard'
                              : tab === 'suporte' ? 'Suporte'
                              : tab === 'agenda' ? 'Agenda'
                              : tab}
                          </span>
                        ))}
                      </div>
                    )}
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
                    <div key={g.id} className="bg-[#12121A] border border-[#2A2A3A] rounded-xl overflow-hidden">
                      {editingGameId === g.id ? (
                        <div className="p-4 space-y-4">
                          <p className="text-orange-400 text-xs font-bold uppercase tracking-wide">Editando jogo</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Time da casa</p>
                              <input type="text" value={editingGame.team1} onChange={e => setEditingGame(p => ({ ...p, team1: e.target.value }))}
                                className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Time visitante</p>
                              <input type="text" value={editingGame.team2} onChange={e => setEditingGame(p => ({ ...p, team2: e.target.value }))}
                                className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Logo time da casa</p>
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-lg bg-[#0B0B0F] border border-[#2A2A3A] flex items-center justify-center shrink-0 overflow-hidden">
                                  {editingGame.logo1 ? <img src={editingGame.logo1} alt="" className="w-full h-full object-contain p-0.5" /> : <ImageIcon className="w-4 h-4 text-gray-600" />}
                                </div>
                                <input type="text" value={editingGame.logo1} onChange={e => setEditingGame(p => ({ ...p, logo1: e.target.value }))}
                                  placeholder="URL" className="flex-1 min-w-0 bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500" />
                                <label className="w-9 h-9 rounded-lg bg-[#0B0B0F] border border-[#2A2A3A] flex items-center justify-center shrink-0 cursor-pointer hover:border-orange-500/50 transition-all">
                                  {editLogo1Uploading ? <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-4 h-4 text-gray-500" />}
                                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadEditLogo(e.target.files[0], 1)} />
                                </label>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Logo time visitante</p>
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-lg bg-[#0B0B0F] border border-[#2A2A3A] flex items-center justify-center shrink-0 overflow-hidden">
                                  {editingGame.logo2 ? <img src={editingGame.logo2} alt="" className="w-full h-full object-contain p-0.5" /> : <ImageIcon className="w-4 h-4 text-gray-600" />}
                                </div>
                                <input type="text" value={editingGame.logo2} onChange={e => setEditingGame(p => ({ ...p, logo2: e.target.value }))}
                                  placeholder="URL" className="flex-1 min-w-0 bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500" />
                                <label className="w-9 h-9 rounded-lg bg-[#0B0B0F] border border-[#2A2A3A] flex items-center justify-center shrink-0 cursor-pointer hover:border-orange-500/50 transition-all">
                                  {editLogo2Uploading ? <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-4 h-4 text-gray-500" />}
                                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadEditLogo(e.target.files[0], 2)} />
                                </label>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Liga / Campeonato</p>
                              <input type="text" value={editingGame.league} onChange={e => setEditingGame(p => ({ ...p, league: e.target.value }))}
                                placeholder="Ex: Brasileirão" className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Data e horário</p>
                              <input type="datetime-local" value={editingGame.datetime} onChange={e => setEditingGame(p => ({ ...p, datetime: e.target.value }))}
                                className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={saveEditedGame} disabled={!editingGame.team1.trim() || !editingGame.team2.trim() || !editingGame.datetime}
                              className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                              Salvar
                            </button>
                            <button onClick={() => setEditingGameId(null)}
                              className="px-4 py-2.5 bg-[#0B0B0F] border border-[#2A2A3A] text-gray-400 hover:text-white font-bold rounded-xl text-sm transition-all">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {g.logo1 ? <img src={g.logo1} alt="" className="w-8 h-8 object-contain shrink-0 rounded" /> : <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4 text-gray-600" /></div>}
                            <span className="text-white text-sm font-semibold truncate">{g.team1}</span>
                            <span className="text-gray-600 text-xs font-black px-1">×</span>
                            {g.logo2 ? <img src={g.logo2} alt="" className="w-8 h-8 object-contain shrink-0 rounded" /> : <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4 text-gray-600" /></div>}
                            <span className="text-white text-sm font-semibold truncate">{g.team2}</span>
                            {g.league && <span className="text-gray-500 text-xs truncate hidden sm:block">· {g.league}</span>}
                          </div>
                          <span className="text-orange-400 text-xs font-bold whitespace-nowrap shrink-0">
                            {new Date(g.datetime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button onClick={() => { setEditingGameId(g.id); setEditingGame({ team1: g.team1, team2: g.team2, logo1: g.logo1, logo2: g.logo2, league: g.league, league_logo: g.league_logo, datetime: g.datetime }) }}
                            className="text-gray-600 hover:text-orange-400 transition-colors shrink-0">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeGameFromSchedule(g.id)} className="text-gray-600 hover:text-red-500 transition-colors shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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

      {/* ── ABA: USUÁRIOS ── */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Usuários</h2>
              <p className="text-gray-500 text-sm mt-0.5">Lista de todos os cadastrados. Clique para editar senha, e-mail ou telefone.</p>
            </div>
            <button onClick={loadUsuarios} disabled={usuariosLoading} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${usuariosLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={usuariosSearch}
            onChange={e => { setUsuariosSearch(e.target.value); setUsuariosLimit(25) }}
            className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
          />

          {usuariosLoading ? (
            <p className="text-gray-500 text-sm">Carregando...</p>
          ) : (() => {
            const q = usuariosSearch.toLowerCase()
            const filtered = usuarios.filter(u => {
              const display = u.email?.endsWith('@futzone.app') ? u.email.replace('@futzone.app', '') : (u.email ?? '')
              return (u.name ?? '').toLowerCase().includes(q) || display.toLowerCase().includes(q) || (u.phone ?? '').includes(q)
            })
            if (filtered.length === 0) return (
              <div className="border border-dashed border-[#2A2A3A] rounded-xl py-8 text-center">
                <p className="text-gray-600 text-sm">{usuariosSearch ? 'Nenhum usuário encontrado' : 'Nenhum cadastro ainda'}</p>
              </div>
            )
            const visible = filtered.slice(0, usuariosLimit)
            return (
              <div className="space-y-2">
                <p className="text-gray-500 text-xs">{filtered.length} usuário{filtered.length !== 1 ? 's' : ''}</p>
                {visible.map(u => {
                  const display = u.email?.endsWith('@futzone.app')
                    ? u.email.replace('@futzone.app', '').replace(/^55/, '')
                    : (u.email ?? u.phone ?? '')
                  const isPhone = u.email?.endsWith('@futzone.app')
                  const now = new Date()
                  const hasPlan = u.plan && u.plan !== 'avulso' && u.plan_expires_at && new Date(u.plan_expires_at) > now
                  return (
                    <button
                      key={u.id}
                      onClick={() => openEditUser(u)}
                      className="w-full flex items-center justify-between bg-[#12121A] border border-[#2A2A3A] hover:border-orange-500/40 rounded-xl px-4 py-3 transition-all text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{u.name}</p>
                        <p className="text-gray-500 text-xs font-mono truncate">{isPhone ? `📱 ${display}` : `✉️ ${display}`}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        {hasPlan && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#FF6A00,#FF8533)' }}>
                            {u.plan === 'semanal' ? 'SEMANAL' : 'MENSAL'}
                          </span>
                        )}
                        <Pencil className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                    </button>
                  )
                })}
                {filtered.length > usuariosLimit && (
                  <button
                    onClick={() => setUsuariosLimit(l => l + 25)}
                    className="w-full py-2.5 text-sm text-orange-400 hover:text-orange-300 font-semibold border border-dashed border-[#2A2A3A] hover:border-orange-500/40 rounded-xl transition-all"
                  >
                    Mostrar mais ({filtered.length - usuariosLimit} restantes)
                  </button>
                )}
              </div>
            )
          })()}

          {/* Cadastros recentes */}
          {dashRegistrations.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[#2A2A3A]">
              <p className="text-white font-bold text-sm">Cadastros recentes ({dashRegistrations.length})</p>
              <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2A2A3A]">
                        <th className="text-left text-gray-500 font-medium px-4 py-2.5">Nome</th>
                        <th className="text-left text-gray-500 font-medium px-4 py-2.5">Telefone/E-mail</th>
                        <th className="text-left text-gray-500 font-medium px-4 py-2.5">Cadastrado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashRegistrations.slice(0, regLimit).map((r, i) => (
                        <tr key={r.id ?? i} className="border-b border-[#1A1A26] last:border-0">
                          <td className="px-4 py-2.5 text-white font-medium">{r.name}</td>
                          <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{r.phone || (r.email?.endsWith('@futzone.app') ? r.email.replace('@futzone.app','').replace(/^55/,'') : r.email)}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{r.created_at ? new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dashRegistrations.length > regLimit && (
                  <button onClick={() => setRegLimit(n => n + 20)} className="w-full py-2.5 text-orange-400 hover:text-orange-300 text-xs font-semibold border-t border-[#2A2A3A] transition-colors">
                    Ver mais ({dashRegistrations.length - regLimit} restantes)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal editar usuário */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditUserModal(null)} />
          <div className="relative w-full max-w-sm bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-4 shadow-2xl">
            <button onClick={() => setEditUserModal(null)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-white font-bold text-base">Editar usuário</h3>
              <p className="text-gray-500 text-xs mt-0.5 truncate">{editUserModal.name}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Nome</label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={e => setEditUserName(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">E-mail ou telefone</label>
                <input
                  type="text"
                  value={editUserEmail}
                  onChange={e => setEditUserEmail(e.target.value)}
                  placeholder="email@exemplo.com ou 11999998888"
                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
                <p className="text-gray-600 text-[10px] mt-1">Telefone: só os números, com ou sem 55. E-mail: formato completo.</p>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Nova senha <span className="text-gray-600">(deixe em branco para não alterar)</span></label>
                <input
                  type="text"
                  value={editUserPassword}
                  onChange={e => setEditUserPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            {editUserError && <p className="text-red-500 text-xs text-center">{editUserError}</p>}
            {editUserSuccess && <p className="text-green-500 text-xs text-center">Salvo com sucesso!</p>}
            <button
              onClick={saveEditUser}
              disabled={editUserSaving}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all"
            >
              {editUserSaving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      )}

        </div>{/* end p-6 content */}
      </main>

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
