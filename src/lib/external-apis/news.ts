export type Noticia = {
  id: string
  titulo: string
  descricao: string
  url: string
  imagem: string | null
  fonte: string
  publicadoEm: string
}

type GNewsArticle = {
  title: string
  description: string
  url: string
  image: string | null
  publishedAt: string
  source: { name: string; url: string }
}

type GNewsResponse = {
  articles: GNewsArticle[]
}

export async function fetchNoticiasFutebol(): Promise<Noticia[]> {
  const apiKey = process.env.GNEWS_API_KEY
  if (!apiKey) {
    console.error('[news] GNEWS_API_KEY não configurada')
    return []
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const params = new URLSearchParams({
      q: 'futebol',
      lang: 'pt',
      max: '8',
      apikey: apiKey,
    })

    const res = await fetch(`https://gnews.io/api/v4/search?${params}`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    })

    if (res.status === 429) {
      console.error('[news] GNews: limite de requisições atingido (429)')
      return []
    }
    if (!res.ok) {
      console.error(`[news] GNews: erro HTTP ${res.status}`)
      return []
    }

    const data: GNewsResponse = await res.json()

    return data.articles
      .filter(a => !!a.image)
      .slice(0, 5)
      .map(a => ({
        id: a.url,
        titulo: a.title,
        descricao: a.description ?? '',
        url: a.url,
        imagem: a.image,
        fonte: a.source.name,
        publicadoEm: a.publishedAt,
      }))
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('[news] GNews: timeout de 5s excedido')
    } else {
      console.error('[news] GNews: erro de rede', err)
    }
    return []
  } finally {
    clearTimeout(timeout)
  }
}
