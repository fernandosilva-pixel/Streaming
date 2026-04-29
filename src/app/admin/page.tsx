'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Radio, Plus, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Fixture = {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
  }
  league: { name: string; country: string; logo: string }
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

type CarouselBanner = {
  id: string
  image_url: string
  display_order: number
}

type Stream = {
  id: string
  title: string
  kick_channel: string
  is_active: boolean
  crop_enabled: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const [banner, setBanner] = useState<Banner | null>(null)
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [loadingFixtures, setLoadingFixtures] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [carouselBanners, setCarouselBanners] = useState<CarouselBanner[]>([])
  const [carouselUploading, setCarouselUploading] = useState(false)
  const [isCarouselDragging, setIsCarouselDragging] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [isLogoDragging, setIsLogoDragging] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [logoSaved, setLogoSaved] = useState(false)

  // Streams
  const [streams, setStreams] = useState<Stream[]>([])
  const [highlightedStreamId, setHighlightedStreamId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newChannel, setNewChannel] = useState('')
  const [addingStream, setAddingStream] = useState(false)
  const [editChannels, setEditChannels] = useState<Record<string, string>>({})
  const [savingChannel, setSavingChannel] = useState<string | null>(null)
  const [highlightingSave, setHighlightingSave] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/admin/login')
      } else {
        setAuthChecked(true)
      }
    })
  }, [])

  useEffect(() => {
    if (authChecked) {
      loadBanner()
      loadCarouselBanners()
      loadLogo()
      loadStreams()
    }
  }, [authChecked])

  useEffect(() => { if (authChecked) loadFixtures() }, [date, authChecked])

  async function loadBanner() {
    const { data } = await supabase.from('banner').select('*').single()
    if (data) {
      setBanner(data)
      setSelectedGameId(data.game_id)
      setHighlightedStreamId(data.stream_id ?? null)
      if (data.image_url) setPreviewUrl(data.image_url)
    }
  }

  async function loadStreams() {
    const { data } = await supabase.from('streams').select('*').order('created_at', { ascending: false })
    const list = data ?? []
    setStreams(list)
    const initial: Record<string, string> = {}
    list.forEach((s: Stream) => { initial[s.id] = s.kick_channel })
    setEditChannels(initial)
  }

  async function addStream() {
    if (!newTitle.trim() || !newChannel.trim()) return
    setAddingStream(true)
    const { error } = await supabase.from('streams').insert({
      title: newTitle.trim(),
      kick_channel: newChannel.trim().replace(/\s/g, ''),
    })
    if (error) {
      alert('Erro ao adicionar transmissão: ' + error.message)
      setAddingStream(false)
      return
    }
    setNewTitle('')
    setNewChannel('')
    await loadStreams()
    setAddingStream(false)
  }

  async function toggleCrop(id: string, value: boolean) {
    await supabase.from('streams').update({ crop_enabled: value }).eq('id', id)
    setStreams(prev => prev.map(s => s.id === id ? { ...s, crop_enabled: value } : s))
  }

  async function saveChannel(id: string) {
    const channel = editChannels[id]?.trim().replace(/\s/g, '')
    if (!channel) return
    setSavingChannel(id)
    await supabase.from('streams').update({ kick_channel: channel }).eq('id', id)
    setStreams(prev => prev.map(s => s.id === id ? { ...s, kick_channel: channel } : s))
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

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `banner-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true })
    if (error) { alert('Erro no upload: ' + error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    setPreviewUrl(publicUrl)
    setUploading(false)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  async function save() {
    if (!previewUrl || !banner) return
    setSaving(true)
    await supabase.from('banner').update({
      image_url: previewUrl,
      game_id: selectedGameId,
      updated_at: new Date().toISOString(),
    }).eq('id', banner.id)
    setSaving(false)
    alert('Banner publicado com sucesso!')
  }

  async function loadLogo() {
    const { data } = await supabase.from('site_settings').select('*').single()
    if (data) {
      setSettingsId(data.id)
      if (data.logo_url) setLogoUrl(data.logo_url)
    }
  }

  async function handleLogoFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setLogoUploading(true)
    setLogoSaved(false)
    const ext = file.name.split('.').pop()
    const fileName = `logo-${Date.now()}.${ext}`
    const { error: storageError } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true })
    if (storageError) { alert('Erro no upload: ' + storageError.message); setLogoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    const { error: dbError } = settingsId
      ? await supabase.from('site_settings').update({ logo_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', settingsId)
      : await supabase.from('site_settings').insert({ logo_url: publicUrl })
    if (dbError) { alert('Erro ao salvar: ' + dbError.message); setLogoUploading(false); return }
    setLogoUrl(publicUrl)
    setLogoUploading(false)
    setLogoSaved(true)
  }

  async function loadCarouselBanners() {
    const { data } = await supabase.from('carousel_banners').select('*').order('display_order')
    setCarouselBanners(data ?? [])
  }

  async function handleCarouselFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setCarouselUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `carousel-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true })
    if (error) { alert('Erro no upload: ' + error.message); setCarouselUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)
    const nextOrder = carouselBanners.length
    await supabase.from('carousel_banners').insert({ image_url: publicUrl, display_order: nextOrder })
    await loadCarouselBanners()
    setCarouselUploading(false)
  }

  async function deleteCarouselBanner(id: string) {
    await supabase.from('carousel_banners').delete().eq('id', id)
    setCarouselBanners(prev => prev.filter(b => b.id !== id))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Verificando acesso...</p>
      </div>
    )
  }

  const filtered = fixtures.filter(f =>
    f.teams.home.name.toLowerCase().includes(search.toLowerCase()) ||
    f.teams.away.name.toLowerCase().includes(search.toLowerCase()) ||
    f.league.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Painel Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie o banner principal do site</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-white text-sm border border-[#2A2A3A] hover:border-orange-500/50 px-4 py-2 rounded-xl transition-all"
        >
          Sair
        </button>
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
            className={`flex-1 border-2 border-dashed rounded-2xl cursor-pointer transition-all flex items-center justify-center h-14 ${
              isLogoDragging ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'
            }`}
          >
            <input id="logoInput" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleLogoFile(e.target.files[0])} />
            {logoUploading
              ? <p className="text-white text-sm font-semibold">Enviando...</p>
              : <p className="text-gray-500 text-sm">{logoUrl ? 'Arraste para substituir a logo' : 'Arraste a logo aqui ou clique'}</p>
            }
          </div>
        </div>
        {logoSaved && (
          <p className="text-green-500 text-xs">Logo salva! Recarregue a página para ver no navbar.</p>
        )}
      </div>

      {/* Transmissões */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-orange-500" />
            Transmissões
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie os canais da Kick. "Destacar" define qual aparece no banner principal.</p>
        </div>

        {/* Adicionar nova */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Nome do jogo (ex: Flamengo x Corinthians)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="flex-1 min-w-48 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
          />
          <input
            type="text"
            placeholder="Canal da Kick (ex: futzone_fla)"
            value={newChannel}
            onChange={e => setNewChannel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStream()}
            className="flex-1 min-w-48 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={addStream}
            disabled={addingStream || !newTitle.trim() || !newChannel.trim()}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            {addingStream ? 'Adicionando...' : 'Adicionar'}
          </button>
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
              const channelChanged = editChannels[s.id] !== s.kick_channel
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isHighlighted ? 'border-orange-500 bg-orange-500/5' : 'border-[#2A2A3A] bg-[#12121A]'
                  }`}
                >
                  {isHighlighted && (
                    <span className="text-[10px] bg-orange-500 text-white font-bold px-1.5 py-0.5 rounded shrink-0">LIVE</span>
                  )}
                  <p className="text-white text-sm font-semibold truncate flex-1 min-w-0">{s.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={editChannels[s.id] ?? s.kick_channel}
                      onChange={e => setEditChannels(prev => ({ ...prev, [s.id]: e.target.value }))}
                      className="bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-1.5 text-sm w-44 focus:outline-none focus:border-orange-500"
                    />
                    {channelChanged && (
                      <button
                        onClick={() => saveChannel(s.id)}
                        disabled={savingChannel === s.id}
                        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                      >
                        {savingChannel === s.id ? '...' : 'Salvar'}
                      </button>
                    )}
                    <button
                      onClick={() => toggleCrop(s.id, !s.crop_enabled)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                        s.crop_enabled
                          ? 'bg-green-600/20 text-green-400 hover:bg-red-600/20 hover:text-red-400'
                          : 'bg-[#2A2A3A] text-gray-400 hover:bg-green-600/20 hover:text-green-400'
                      }`}
                      title={s.crop_enabled ? 'Crop ativado — clique para remover' : 'Ativar crop (esconde marcas d\'água)'}
                    >
                      {s.crop_enabled ? 'Crop ON' : 'Crop OFF'}
                    </button>
                    <button
                      onClick={() => highlightStream(s.id)}
                      disabled={isHighlighted || highlightingSave}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                        isHighlighted
                          ? 'bg-orange-500/20 text-orange-400 cursor-default'
                          : 'bg-[#2A2A3A] hover:bg-orange-500 text-gray-300 hover:text-white'
                      }`}
                    >
                      {isHighlighted ? <><Check className="w-3 h-3" /> Destacado</> : 'Destacar'}
                    </button>
                    <button
                      onClick={() => deleteStream(s.id)}
                      className="text-gray-600 hover:text-red-500 transition-colors p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload banner */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">Banner</h2>
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
          className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all ${
            isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'
          }`}
          style={{ minHeight: 220 }}
        >
          <input id="fileInput" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full object-cover rounded-2xl" style={{ maxHeight: 400 }} />
          ) : (
            <div className="flex flex-col items-center justify-center h-56 gap-2">
              <p className="text-white font-semibold">Arraste a imagem aqui</p>
              <p className="text-gray-600 text-sm">ou clique para selecionar</p>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl">
              <p className="text-white font-bold text-lg">Enviando...</p>
            </div>
          )}
        </div>
        {previewUrl && (
          <p className="text-green-500 text-xs">Imagem carregada — clique em "Publicar" para salvar</p>
        )}
      </div>

      {/* Seletor de jogo */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Jogo em destaque</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
          />
          <input
            type="text"
            placeholder="Buscar time ou liga..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-4 py-2 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedGameId(null)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              selectedGameId === null ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] bg-[#12121A] hover:border-orange-500/30'
            }`}
          >
            <span className="text-gray-400 text-sm">Sem jogo selecionado</span>
          </button>
          {loadingFixtures ? (
            <div className="py-8 text-center text-gray-500 text-sm">Carregando jogos...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-600 text-sm">Nenhum jogo encontrado para esta data</div>
          ) : (
            filtered.map(f => {
              const isLive = ['1H', '2H', 'HT'].includes(f.fixture.status.short)
              const isSelected = selectedGameId === f.fixture.id
              return (
                <button
                  key={f.fixture.id}
                  onClick={() => setSelectedGameId(f.fixture.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] bg-[#12121A] hover:border-orange-500/30'
                  }`}
                >
                  <img src={f.league.logo} alt="" className="w-6 h-6 object-contain shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{f.teams.home.name} vs {f.teams.away.name}</p>
                    <p className="text-gray-500 text-xs truncate">{f.league.name} · {f.league.country}</p>
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
            })
          )}
        </div>
      </div>

      {/* Carrossel */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Carrossel de Jogos</h2>
          <p className="text-gray-500 text-sm mt-0.5">Resolução recomendada: 1200 × 80px</p>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setIsCarouselDragging(true) }}
          onDragLeave={() => setIsCarouselDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setIsCarouselDragging(false)
            const file = e.dataTransfer.files[0]
            if (file) handleCarouselFile(file)
          }}
          onClick={() => document.getElementById('carouselInput')?.click()}
          className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all flex items-center justify-center h-28 ${
            isCarouselDragging ? 'border-orange-500 bg-orange-500/10' : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'
          }`}
        >
          <input id="carouselInput" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleCarouselFile(e.target.files[0])} />
          {carouselUploading ? (
            <p className="text-white font-semibold text-sm">Enviando...</p>
          ) : (
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Arraste o banner aqui</p>
              <p className="text-gray-600 text-xs mt-1">ou clique para selecionar · adiciona ao carrossel</p>
            </div>
          )}
        </div>
        {carouselBanners.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {carouselBanners.map((b, i) => (
              <div key={b.id} className="relative group rounded-xl overflow-hidden border border-[#2A2A3A]" style={{ aspectRatio: '3/1' }}>
                <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                  <button
                    onClick={() => deleteCarouselBanner(b.id)}
                    className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-500 text-white rounded-lg p-2 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">#{i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publicar */}
      <button
        onClick={save}
        disabled={saving || uploading || !previewUrl}
        className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all text-lg"
      >
        {saving ? 'Publicando...' : 'Confirmar e publicar banner'}
      </button>
    </div>
  )
}
