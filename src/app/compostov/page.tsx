'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Radio, Plus, Check, Pencil, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
}

type Stream = {
  id: string
  title: string
  stream_source: 'kick' | 'soop'
  kick_channel: string | null
  soop_channel: string | null
  soop_broad_no: string | null
  is_active: boolean
  crop_enabled: boolean
  charge_enabled: boolean
  charge_amount: number
  payment_method: 'bspay' | 'fixed_qr' | null
  fixed_qr_url: string | null
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Carrossel extra (imagens adicionais do hero)
  const [extraBanners, setExtraBanners] = useState<Banner[]>([])
  const [extraUploading, setExtraUploading] = useState(false)
  const [isExtraDragging, setIsExtraDragging] = useState(false)

  // Próximos Jogos (carousel_banners)
  const [carouselBanners, setCarouselBanners] = useState<{ id: string; image_url: string; display_order: number }[]>([])
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
  const [highlightedStreamId, setHighlightedStreamId] = useState<string | null>(null)
  const [highlightingSave, setHighlightingSave] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [isLogoDragging, setIsLogoDragging] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [logoSaved, setLogoSaved] = useState(false)

  // Streams
  const [streams, setStreams] = useState<Stream[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newSource, setNewSource] = useState<'kick' | 'soop'>('kick')
  const [newChannel, setNewChannel] = useState('')
  const [newSoopChannel, setNewSoopChannel] = useState('')
  const [newSoopBroadNo, setNewSoopBroadNo] = useState('')
  const [addingStream, setAddingStream] = useState(false)
  const [editChannels, setEditChannels] = useState<Record<string, string>>({})
  const [editSources, setEditSources] = useState<Record<string, 'kick' | 'soop'>>({})
  const [editSoopChannels, setEditSoopChannels] = useState<Record<string, string>>({})
  const [editSoopBroadNos, setEditSoopBroadNos] = useState<Record<string, string>>({})
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({})
  const [savingChannel, setSavingChannel] = useState<string | null>(null)
  const [detectingBroad, setDetectingBroad] = useState<string | null>(null)
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null)

  // Modal de método de pagamento
  const [chargeModal, setChargeModal] = useState<{ id: string } | null>(null)
  const [chargeModalMethod, setChargeModalMethod] = useState<'bspay' | 'fixed_qr'>('bspay')
  const [chargeModalQrUrl, setChargeModalQrUrl] = useState<string | null>(null)
  const [chargeModalUploading, setChargeModalUploading] = useState(false)
  const [chargeModalSaving, setChargeModalSaving] = useState(false)
  const [chargeModalDragging, setChargeModalDragging] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/compostov/login')
      else setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    if (authChecked) {
      loadBanner()
      loadExtraBanners()
      loadCarouselBanners()
      loadLogo()
      loadStreams()
    }
  }, [authChecked])

  useEffect(() => { if (authChecked) loadFixtures() }, [date, authChecked])

  useEffect(() => {
    const channel = supabase.channel('site-presence')
    channel.on('presence', { event: 'sync' }, () => {
      setOnlineUsers(Object.keys(channel.presenceState()).length)
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Carrega o banner principal (primeira linha da tabela)
  async function loadBanner() {
    const { data } = await supabase.from('banner').select('*').order('id').limit(1).single()
    if (data) {
      setBanner(data)
      setSelectedGameId(data.game_id)
      setHighlightedStreamId(data.stream_id ?? null)
      if (data.image_url) setPreviewUrl(data.image_url)
    }
  }

  // Carrega imagens extras do carrossel (todas as linhas depois da primeira)
  async function loadExtraBanners() {
    const { data } = await supabase.from('banner').select('*').order('id')
    if (!data || data.length <= 1) { setExtraBanners([]); return }
    setExtraBanners(data.slice(1))
  }

  async function loadStreams() {
    const { data } = await supabase.from('streams').select('*').order('created_at', { ascending: false })
    const list = data ?? []
    setStreams(list)
    const initial: Record<string, string> = {}
    const initialSources: Record<string, 'kick' | 'soop'> = {}
    const initialSoopChannels: Record<string, string> = {}
    const initialSoopBroadNos: Record<string, string> = {}
    const initialAmounts: Record<string, string> = {}
    list.forEach((s: Stream) => {
      initial[s.id] = s.kick_channel ?? ''
      initialSources[s.id] = s.stream_source ?? 'kick'
      initialSoopChannels[s.id] = s.soop_channel ?? ''
      initialSoopBroadNos[s.id] = s.soop_broad_no ?? ''
      initialAmounts[s.id] = String(s.charge_amount ?? '10.00')
    })
    setEditChannels(initial)
    setEditSources(initialSources)
    setEditSoopChannels(initialSoopChannels)
    setEditSoopBroadNos(initialSoopBroadNos)
    setEditAmounts(initialAmounts)
  }

  async function addStream() {
    if (!newTitle.trim()) return
    if (newSource === 'kick' && !newChannel.trim()) return
    if (newSource === 'soop' && !newSoopChannel.trim()) return
    setAddingStream(true)
    const { error } = await supabase.from('streams').insert({
      title: newTitle.trim(),
      stream_source: newSource,
      kick_channel: newSource === 'kick' ? newChannel.trim().replace(/\s/g, '') : null,
      soop_channel: newSource === 'soop' ? newSoopChannel.trim().replace(/\s/g, '') : null,
      soop_broad_no: newSource === 'soop' && newSoopBroadNo.trim() ? newSoopBroadNo.trim() : null,
    })
    if (error) { alert('Erro ao adicionar transmissão: ' + error.message); setAddingStream(false); return }
    setNewTitle(''); setNewChannel(''); setNewSoopChannel(''); setNewSoopBroadNo('')
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

  async function toggleCharge(id: string, value: boolean) {
    const { error } = await supabase.from('streams').update({ charge_enabled: value }).eq('id', id)
    if (error) { alert('Erro ao salvar cobrança: ' + error.message); return }
    setStreams(prev => prev.map(s => s.id === id ? { ...s, charge_enabled: value } : s))
  }

  async function saveAmount(id: string) {
    const amount = parseFloat(editAmounts[id])
    if (isNaN(amount) || amount <= 0) return
    await supabase.from('streams').update({ charge_amount: amount }).eq('id', id)
    setStreams(prev => prev.map(s => s.id === id ? { ...s, charge_amount: amount } : s))
  }

  async function saveChannel(id: string) {
    const source = editSources[id] ?? 'kick'
    setSavingChannel(id)
    if (source === 'kick') {
      const channel = editChannels[id]?.trim().replace(/\s/g, '')
      if (!channel) { setSavingChannel(null); return }
      await supabase.from('streams').update({ stream_source: 'kick', kick_channel: channel, soop_channel: null, soop_broad_no: null }).eq('id', id)
    } else {
      const soopChannel = editSoopChannels[id]?.trim().replace(/\s/g, '')
      const soopBroadNo = editSoopBroadNos[id]?.trim() || null
      if (!soopChannel) { setSavingChannel(null); return }
      await supabase.from('streams').update({ stream_source: 'soop', kick_channel: null, soop_channel: soopChannel, soop_broad_no: soopBroadNo }).eq('id', id)
    }
    await loadStreams()
    setSavingChannel(null)
  }

  async function deleteStream(id: string) {
    await supabase.from('streams').delete().eq('id', id)
    setStreams(prev => prev.filter(s => s.id !== id))
    if (highlightedStreamId === id) {
      setHighlightedStreamId(null)
      if (banner) await supabase.from('banner').update({ stream_id: null }).eq('id', banner.id)
    }
  }

  async function highlightStream(streamId: string) {
    if (!banner) return
    setHighlightingSave(true)
    await supabase.from('banner').update({ stream_id: streamId }).eq('id', banner.id)
    setHighlightedStreamId(streamId)
    setHighlightingSave(false)
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

  async function handleFile(file: File) {
    if (!isImageFile(file)) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `banner-${Date.now()}.${ext}`
    const contentType = getContentType(file)
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(
      (await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType })).data!.path
    )
    setPreviewUrl(publicUrl)
    setUploading(false)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]; if (file) handleFile(file)
  }, [])

  async function save() {
    if (!previewUrl) return
    setSaving(true)
    if (banner) {
      await supabase.from('banner').update({
        image_url: previewUrl,
        game_id: selectedGameId,
        updated_at: new Date().toISOString(),
      }).eq('id', banner.id)
    } else {
      const { data } = await supabase.from('banner').insert({
        image_url: previewUrl,
        game_id: selectedGameId,
      }).select().single()
      if (data) setBanner(data)
    }
    setSaving(false)
    alert('Banner publicado com sucesso!')
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
    await supabase.from('banner').insert({ image_url: publicUrl, game_id: null, stream_id: banner?.stream_id ?? null })
    await loadExtraBanners()
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
    setPreviewUrl(null)
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

  async function deleteCarouselBanner(id: string) {
    await supabase.from('carousel_banners').delete().eq('id', id)
    setCarouselBanners(prev => prev.filter(b => b.id !== id))
  }

  async function loadLogo() {
    const { data } = await supabase.from('site_settings').select('*').single()
    if (data) { setSettingsId(data.id); if (data.logo_url) setLogoUrl(data.logo_url) }
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

  async function handleChargeModalQrFile(file: File) {
    if (!isImageFile(file)) return
    setChargeModalUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `qr-fixo-${Date.now()}.${ext}`
    const contentType = getContentType(file)
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true, contentType })
    if (error) { alert('Erro no upload: ' + error.message); setChargeModalUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    setChargeModalQrUrl(publicUrl)
    setChargeModalUploading(false)
  }

  async function confirmChargeModal() {
    if (!chargeModal) return
    if (chargeModalMethod === 'fixed_qr' && !chargeModalQrUrl) { alert('Faça upload do QR Code primeiro'); return }
    setChargeModalSaving(true)
    const { error } = await supabase.from('streams').update({
      charge_enabled: true,
      payment_method: chargeModalMethod,
      fixed_qr_url: chargeModalMethod === 'fixed_qr' ? chargeModalQrUrl : null,
    }).eq('id', chargeModal.id)
    if (error) { alert('Erro: ' + error.message); setChargeModalSaving(false); return }
    setStreams(prev => prev.map(s => s.id === chargeModal.id
      ? { ...s, charge_enabled: true, payment_method: chargeModalMethod, fixed_qr_url: chargeModalMethod === 'fixed_qr' ? chargeModalQrUrl : null }
      : s
    ))
    setChargeModal(null)
    setChargeModalQrUrl(null)
    setChargeModalSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/compostov/login')
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
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Painel Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie o banner principal do site</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#12121A] border border-[#2A2A3A] px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="text-white font-bold text-sm tabular-nums">{onlineUsers}</span>
            <span className="text-gray-500 text-sm">online agora</span>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-white text-sm border border-[#2A2A3A] hover:border-orange-500/50 px-4 py-2 rounded-xl transition-all">
            Sair
          </button>
        </div>
      </div>

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

        {/* Adicionar stream */}
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <input type="text" placeholder="Nome do jogo (ex: Flamengo x Corinthians)" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="flex-1 min-w-48 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
            <div className="flex rounded-xl overflow-hidden border border-[#2A2A3A]">
              <button onClick={() => setNewSource('kick')} className={`px-4 py-2.5 text-sm font-bold transition-all ${newSource === 'kick' ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}>Kick</button>
              <button onClick={() => setNewSource('soop')} className={`px-4 py-2.5 text-sm font-bold transition-all ${newSource === 'soop' ? 'bg-orange-500 text-white' : 'bg-[#1A1A26] text-gray-400 hover:text-white'}`}>Soop</button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {newSource === 'kick' ? (
              <input type="text" placeholder="Canal da Kick (ex: futzone_fla)" value={newChannel} onChange={e => setNewChannel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStream()}
                className="flex-1 min-w-48 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
            ) : (
              <>
                <input type="text" placeholder="ID do canal Soop" value={newSoopChannel} onChange={e => setNewSoopChannel(e.target.value)}
                  className="flex-1 min-w-36 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
                <input type="text" placeholder="Nº do broadcast (opcional)" value={newSoopBroadNo} onChange={e => setNewSoopBroadNo(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStream()}
                  className="w-52 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500" />
              </>
            )}
            <button onClick={addStream} disabled={addingStream || !newTitle.trim() || (newSource === 'kick' ? !newChannel.trim() : !newSoopChannel.trim())}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm">
              <Plus className="w-4 h-4" />{addingStream ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </div>

        {/* Lista de streams */}
        {streams.length === 0 ? (
          <div className="border border-dashed border-[#2A2A3A] rounded-xl py-8 text-center">
            <p className="text-gray-600 text-sm">Nenhuma transmissão cadastrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {streams.map(s => {
              const isHighlighted = highlightedStreamId === s.id
              const isEditing = editingStreamId === s.id
              const currentSource = editSources[s.id] ?? s.stream_source ?? 'kick'
              return (
                <div key={s.id} className={`rounded-xl border overflow-hidden transition-all ${isHighlighted ? 'border-orange-500 bg-orange-500/5' : 'border-[#2A2A3A] bg-[#12121A]'}`}>
                  <div className="flex flex-wrap items-center gap-2 p-3">
                    {isHighlighted && <span className="text-[10px] bg-orange-500 text-white font-bold px-1.5 py-0.5 rounded shrink-0">LIVE</span>}
                    <p className="text-white text-sm font-semibold truncate flex-1 min-w-0">{s.title}</p>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (s.charge_enabled) {
                            toggleCharge(s.id, false)
                          } else {
                            setChargeModalMethod('bspay')
                            setChargeModalQrUrl(null)
                            setChargeModal({ id: s.id })
                          }
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${s.charge_enabled ? 'bg-green-600/20 text-green-400 hover:bg-red-600/20 hover:text-red-400' : 'bg-[#2A2A3A] text-gray-400 hover:bg-green-600/20 hover:text-green-400'}`}
                        title={s.charge_enabled ? 'Cobrança ativa — clique para desativar' : 'Ativar cobrança'}>
                        {s.charge_enabled ? 'Cobrança ON' : 'Cobrança OFF'}
                      </button>
                      {s.charge_enabled && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 text-xs shrink-0">R$</span>
                          <input type="number" min="0.01" step="0.01" value={editAmounts[s.id] ?? s.charge_amount}
                            onChange={e => setEditAmounts(prev => ({ ...prev, [s.id]: e.target.value }))}
                            onBlur={() => saveAmount(s.id)}
                            className="bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-2 py-1.5 text-sm w-16 focus:outline-none focus:border-orange-500" />
                        </div>
                      )}
                      <button onClick={() => highlightStream(s.id)} disabled={isHighlighted || highlightingSave}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isHighlighted ? 'bg-orange-500/20 text-orange-400 cursor-default' : 'bg-[#2A2A3A] hover:bg-orange-500 text-gray-300 hover:text-white'}`}>
                        {isHighlighted ? <><Check className="w-3 h-3" /> Destacado</> : 'Destacar'}
                      </button>
                      <button onClick={() => setEditingStreamId(isEditing ? null : s.id)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#2A2A3A] text-gray-400 hover:text-white hover:bg-[#3A3A4A] transition-all">
                        {isEditing ? <><X className="w-3 h-3" /> Fechar</> : <><Pencil className="w-3 h-3" /> Editar</>}
                      </button>
                      <button onClick={() => deleteStream(s.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="px-3 pb-3 pt-2 border-t border-[#2A2A3A] flex flex-wrap items-center gap-2">
                      <div className="flex rounded-lg overflow-hidden border border-[#2A2A3A]">
                        <button onClick={() => setEditSources(prev => ({ ...prev, [s.id]: 'kick' }))} className={`px-2.5 py-1 text-xs font-bold transition-all ${currentSource === 'kick' ? 'bg-orange-500 text-white' : 'bg-[#0B0B0F] text-gray-400 hover:text-white'}`}>Kick</button>
                        <button onClick={() => setEditSources(prev => ({ ...prev, [s.id]: 'soop' }))} className={`px-2.5 py-1 text-xs font-bold transition-all ${currentSource === 'soop' ? 'bg-orange-500 text-white' : 'bg-[#0B0B0F] text-gray-400 hover:text-white'}`}>Soop</button>
                      </div>
                      {currentSource === 'kick' ? (
                        <input type="text" value={editChannels[s.id] ?? ''} onChange={e => setEditChannels(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="Canal da Kick"
                          className="flex-1 min-w-36 bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500" />
                      ) : (
                        <>
                          <input type="text" value={editSoopChannels[s.id] ?? ''} onChange={e => setEditSoopChannels(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="ID do canal Soop (bjid)"
                            className="flex-1 min-w-28 bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500" />
                          <input type="text" value={editSoopBroadNos[s.id] ?? ''} onChange={e => setEditSoopBroadNos(prev => ({ ...prev, [s.id]: e.target.value }))} placeholder="Nº broadcast"
                            className="w-32 bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500" />
                          <button onClick={() => detectSoopBroadcast(s.id)} disabled={detectingBroad === s.id || !editSoopChannels[s.id]}
                            className="bg-[#2A2A3A] hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all">
                            {detectingBroad === s.id ? '...' : 'Detectar'}
                          </button>
                        </>
                      )}
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

      {/* Banners (unificado) */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-white">Banners</h2>
          <p className="text-gray-500 text-sm mt-0.5">Adicione uma ou mais imagens — quando houver mais de uma, o sistema rotaciona automaticamente.</p>
        </div>

        <div className="flex gap-3 items-stretch">
          {/* Drop zone principal */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
            className={`relative flex-1 border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all ${isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'}`}
            style={{ minHeight: 200 }}
          >
            <input id="fileInput" type="file" accept="image/*,.svg" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-6 h-full min-h-[200px]">
                <p className="text-white font-semibold">Arraste o banner aqui</p>
                <p className="text-gray-600 text-sm">ou clique para selecionar</p>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <p className="text-white font-bold text-lg">Enviando...</p>
              </div>
            )}
          </div>

          {/* Botão adicionar mais */}
          <div
            onDragOver={e => { e.preventDefault(); setIsExtraDragging(true) }}
            onDragLeave={() => setIsExtraDragging(false)}
            onDrop={e => { e.preventDefault(); setIsExtraDragging(false); const f = e.dataTransfer.files[0]; if (f) handleExtraFile(f) }}
            onClick={() => document.getElementById('extraInput')?.click()}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl cursor-pointer transition-all w-28 shrink-0 ${isExtraDragging ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A] text-gray-500'}`}
          >
            <input id="extraInput" type="file" accept="image/*,.svg" className="hidden" onChange={e => e.target.files?.[0] && handleExtraFile(e.target.files[0])} />
            {extraUploading
              ? <p className="text-white text-xs font-semibold text-center px-2">Enviando...</p>
              : <><Plus className="w-6 h-6" /><p className="text-xs text-center px-2">Adicionar mais imagens</p></>
            }
          </div>
        </div>

        {/* Grid de todas as imagens salvas */}
        {(banner?.image_url || extraBanners.length > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {banner?.image_url && (
              <div className="relative group rounded-xl overflow-hidden border border-orange-500/40 bg-[#12121A]" style={{ aspectRatio: '16/9' }}>
                <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                  <button onClick={deleteMainBanner} className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-500 text-white rounded-lg p-2 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">#1 principal</span>
              </div>
            )}
            {extraBanners.map((b, i) => (
              <div key={b.id} className="relative group rounded-xl overflow-hidden border border-[#2A2A3A] bg-[#12121A]" style={{ aspectRatio: '16/9' }}>
                <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                  <button onClick={() => deleteExtraBanner(b.id)} className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-500 text-white rounded-lg p-2 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded">#{i + 2}</span>
              </div>
            ))}
          </div>
        )}

        {previewUrl && <p className="text-green-500 text-xs">Imagem carregada — clique em "Publicar" para salvar</p>}
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

      {/* Próximos Jogos (carousel_banners) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Próximos Jogos</h2>
          <p className="text-gray-500 text-sm mt-0.5">Resolução recomendada: 1200 × 80px</p>
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
            : <div className="text-center"><p className="text-white font-semibold text-sm">Arraste o banner aqui</p><p className="text-gray-600 text-xs mt-1">ou clique para selecionar · adiciona ao carrossel</p></div>
          }
        </div>
        {carouselBanners.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {carouselBanners.map((b, i) => (
              <div key={b.id} className="relative group rounded-xl overflow-hidden border border-[#2A2A3A]" style={{ aspectRatio: '3/1' }}>
                <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                  <button onClick={() => deleteCarouselBanner(b.id)} className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-500 text-white rounded-lg p-2 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">#{i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão publicar — igual ao original */}
      <button
        onClick={save}
        disabled={saving || uploading || !previewUrl}
        className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all text-lg"
      >
        {saving ? 'Publicando...' : 'Confirmar e publicar banner'}
      </button>

      {/* Modal — método de pagamento */}
      {chargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setChargeModal(null)} />
          <div className="relative w-full max-w-md bg-[#12121A] border border-[#2A2A3A] rounded-2xl p-6 space-y-5 shadow-2xl">
            <button onClick={() => setChargeModal(null)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white">Ativar cobrança</h2>
              <p className="text-gray-500 text-sm mt-1">Escolha o método de pagamento</p>
            </div>

            <div className="space-y-2">
              {(['bspay', 'fixed_qr'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setChargeModalMethod(method)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${chargeModalMethod === method ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] bg-[#0B0B0F] hover:border-orange-500/30'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${chargeModalMethod === method ? 'border-orange-500' : 'border-gray-600'}`}>
                    {chargeModalMethod === method && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{method === 'bspay' ? 'API BSPay' : 'QR Code Fixo'}</p>
                    <p className="text-gray-500 text-xs">{method === 'bspay' ? 'QR Code dinâmico com verificação automática' : 'Imagem fixa do seu PIX'}</p>
                  </div>
                </button>
              ))}
            </div>

            {chargeModalMethod === 'fixed_qr' && (
              <div
                onDragOver={e => { e.preventDefault(); setChargeModalDragging(true) }}
                onDragLeave={() => setChargeModalDragging(false)}
                onDrop={e => { e.preventDefault(); setChargeModalDragging(false); const f = e.dataTransfer.files[0]; if (f) handleChargeModalQrFile(f) }}
                onClick={() => document.getElementById('chargeModalQrInput')?.click()}
                className={`border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 h-36 ${chargeModalDragging ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#0B0B0F]'}`}
              >
                <input id="chargeModalQrInput" type="file" accept="image/*,.svg" className="hidden" onChange={e => e.target.files?.[0] && handleChargeModalQrFile(e.target.files[0])} />
                {chargeModalUploading
                  ? <p className="text-white text-sm">Enviando...</p>
                  : chargeModalQrUrl
                    ? <img src={chargeModalQrUrl} alt="QR Code" className="h-28 object-contain" />
                    : <><Plus className="w-5 h-5 text-gray-500" /><p className="text-gray-500 text-sm">Arraste a imagem do QR Code</p></>
                }
              </div>
            )}

            <button
              onClick={confirmChargeModal}
              disabled={chargeModalSaving || (chargeModalMethod === 'fixed_qr' && !chargeModalQrUrl)}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all"
            >
              {chargeModalSaving ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
