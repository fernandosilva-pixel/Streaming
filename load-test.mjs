import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nkzubzesruqzolvktgfp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5renViemVzcnVxem9sdmt0Z2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzMwNDIsImV4cCI6MjA5MzA0OTA0Mn0.aNbg9C9gNsrcSP4UnMk-DN_Elpg4bYkhZe5Xba0u1z8'
const SITE_URL = 'https://futzonejogos.site'

// Configurações do teste
const TOTAL_VIEWERS = 500
const BATCH_SIZE = 50       // conecta 50 por vez para não sobrecarregar de uma vez
const BATCH_DELAY_MS = 500  // espera 500ms entre cada lote
const TEST_DURATION_MS = 60_000 // mantém conectado por 60 segundos

// Pega o stream_id como argumento ou usa um padrão
const STREAM_ID = process.argv[2] || 'COLOQUE_O_ID_DO_STREAM_AQUI'

if (STREAM_ID === 'COLOQUE_O_ID_DO_STREAM_AQUI') {
  console.error('❌ Uso: node load-test.mjs <stream_id>')
  console.error('   Exemplo: node load-test.mjs abc123')
  process.exit(1)
}

const clients = []
let connected = 0
let failed = 0
let httpOk = 0
let httpFail = 0

function randomName() {
  const names = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lucas', 'Fernanda', 'Rafael', 'Juliana', 'Diego']
  return names[Math.floor(Math.random() * names.length)]
}

function randomEmail() {
  return `viewer${Math.floor(Math.random() * 999999)}@test.com`
}

async function connectViewer(index) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { timeout: 10000 },
  })

  const sid = `load-test-${index}-${Date.now()}`
  const email = randomEmail()

  const channel = client.channel('site-presence', {
    config: { presence: { key: sid } },
  })

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      failed++
      resolve()
    }, 8000)

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout)
        await channel.track({
          stream_id: STREAM_ID,
          name: randomName(),
          phone: email,
          at: Date.now(),
        })
        connected++
        resolve()
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timeout)
        failed++
        resolve()
      }
    })
  })

  clients.push({ client, channel })
}

async function testHTTP() {
  try {
    const res = await fetch(`${SITE_URL}/jogo/${STREAM_ID}`, {
      headers: { 'User-Agent': 'LoadTest/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) httpOk++
    else httpFail++
  } catch {
    httpFail++
  }
}

async function cleanup() {
  console.log('\n🔌 Desconectando viewers...')
  await Promise.all(clients.map(({ client, channel }) =>
    client.removeChannel(channel).catch(() => {})
  ))
  console.log('✅ Teste finalizado.')
  process.exit(0)
}

async function run() {
  console.log(`🚀 Iniciando teste de carga — ${TOTAL_VIEWERS} viewers simulados`)
  console.log(`📺 Stream ID: ${STREAM_ID}`)
  console.log(`🌐 Site: ${SITE_URL}\n`)

  const startTime = Date.now()

  // Conecta viewers em lotes
  const batches = Math.ceil(TOTAL_VIEWERS / BATCH_SIZE)
  for (let b = 0; b < batches; b++) {
    const batchStart = b * BATCH_SIZE
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_VIEWERS)
    const batchPromises = []

    for (let i = batchStart; i < batchEnd; i++) {
      batchPromises.push(connectViewer(i))
      batchPromises.push(testHTTP())
    }

    await Promise.all(batchPromises)
    console.log(`📡 Lote ${b + 1}/${batches} — Conectados: ${connected} | Falhas: ${failed} | HTTP OK: ${httpOk} | HTTP Fail: ${httpFail}`)

    if (b < batches - 1) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  const connectTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n✅ ${connected}/${TOTAL_VIEWERS} viewers conectados em ${connectTime}s`)
  console.log(`❌ ${failed} falhas de conexão`)
  console.log(`🌐 HTTP: ${httpOk} ok / ${httpFail} falhas`)
  console.log(`\n⏳ Mantendo carga por ${TEST_DURATION_MS / 1000}s... (Ctrl+C para encerrar antes)\n`)

  // Relatório a cada 10s enquanto mantém carga
  const reportInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    console.log(`⏱  ${elapsed}s — ${connected} viewers conectados`)
  }, 10_000)

  await new Promise(r => setTimeout(r, TEST_DURATION_MS))
  clearInterval(reportInterval)

  await cleanup()
}

process.on('SIGINT', cleanup)
run().catch(err => { console.error(err); process.exit(1) })
