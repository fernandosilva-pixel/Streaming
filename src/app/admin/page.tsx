'use client'

import { useEffect, useState, useCallback } from 'react'
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
}

export default function AdminPage() {
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

  useEffect(() => { loadBanner() }, [])
  useEffect(() => { loadFixtures() }, [date])

  async function loadBanner() {
    const { data } = await supabase.from('banner').select('*').single()
    if (data) {
      setBanner(data)
      setSelectedGameId(data.game_id)
      if (data.image_url) setPreviewUrl(data.image_url)
    }
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
    if (error) {
      alert('Erro no upload: ' + error.message)
      setUploading(false)
      return
    }

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

  const filtered = fixtures.filter(f =>
    f.teams.home.name.toLowerCase().includes(search.toLowerCase()) ||
    f.teams.away.name.toLowerCase().includes(search.toLowerCase()) ||
    f.league.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-black text-white">Painel Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie o banner principal do site</p>
      </div>

      {/* Upload */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">Banner</h2>
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
          className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all ${
            isDragging
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-[#2A2A3A] hover:border-orange-500/40 bg-[#12121A]'
          }`}
          style={{ minHeight: 220 }}
        >
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
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
          {/* Opção nenhum jogo */}
          <button
            onClick={() => setSelectedGameId(null)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              selectedGameId === null
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-[#2A2A3A] bg-[#12121A] hover:border-orange-500/30'
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
                    isSelected
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-[#2A2A3A] bg-[#12121A] hover:border-orange-500/30'
                  }`}
                >
                  <img src={f.league.logo} alt="" className="w-6 h-6 object-contain shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {f.teams.home.name} vs {f.teams.away.name}
                    </p>
                    <p className="text-gray-500 text-xs truncate">{f.league.name} · {f.league.country}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    {isLive ? (
                      <>
                        <p className="text-white text-xs font-bold tabular-nums">
                          {f.goals.home ?? 0} - {f.goals.away ?? 0}
                        </p>
                        <p className="text-orange-500 text-[10px] font-bold">
                          {f.fixture.status.elapsed}' AO VIVO
                        </p>
                      </>
                    ) : f.fixture.status.short === 'FT' ? (
                      <p className="text-gray-500 text-xs">Encerrado</p>
                    ) : (
                      <p className="text-gray-400 text-xs">
                        {new Date(f.fixture.date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
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
