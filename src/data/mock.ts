import { Game, League, NewsItem, ChatMessage } from '@/types';

export const leagues: League[] = [
  { id: '1', name: 'Brasileirão Série A', slug: 'brasileirao', logo: '🇧🇷', country: 'Brasil', flag: '🇧🇷', gamesCount: 4 },
  { id: '2', name: 'UEFA Champions League', slug: 'champions-league', logo: '⭐', country: 'Europa', flag: '🇪🇺', gamesCount: 6 },
  { id: '3', name: 'Premier League', slug: 'premier-league', logo: '🦁', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', gamesCount: 3 },
  { id: '4', name: 'La Liga', slug: 'la-liga', logo: '🔴', country: 'Espanha', flag: '🇪🇸', gamesCount: 2 },
  { id: '5', name: 'Serie A', slug: 'serie-a', logo: '🦅', country: 'Itália', flag: '🇮🇹', gamesCount: 3 },
  { id: '6', name: 'Bundesliga', slug: 'bundesliga', logo: '🦅', country: 'Alemanha', flag: '🇩🇪', gamesCount: 2 },
  { id: '7', name: 'Copa do Brasil', slug: 'copa-brasil', logo: '🏆', country: 'Brasil', flag: '🇧🇷', gamesCount: 2 },
  { id: '8', name: 'Libertadores', slug: 'libertadores', logo: '🌎', country: 'América do Sul', flag: '🌎', gamesCount: 3 },
];

export const liveGames: Game[] = [
  {
    id: 'live-1',
    teamHome: { name: 'Flamengo', shortName: 'FLA', logo: '🔴', score: 2 },
    teamAway: { name: 'Palmeiras', shortName: 'PAL', logo: '🟢', score: 1 },
    time: '21:00',
    minute: 67,
    status: 'live',
    league: 'Brasileirão Série A',
    leagueSlug: 'brasileirao',
    leagueLogo: '🇧🇷',
    viewers: 847200,
    isPopular: true,
    servers: [
      { id: 's1', name: 'Servidor 1', quality: 'HD 1080p' },
      { id: 's2', name: 'Servidor 2', quality: 'HD 720p' },
      { id: 's3', name: 'Servidor 3', quality: 'SD 480p' },
    ],
  },
  {
    id: 'live-2',
    teamHome: { name: 'Real Madrid', shortName: 'RMA', logo: '⚪', score: 1 },
    teamAway: { name: 'Manchester City', shortName: 'MCI', logo: '🔵', score: 1 },
    time: '16:00',
    minute: 43,
    status: 'live',
    league: 'UEFA Champions League',
    leagueSlug: 'champions-league',
    leagueLogo: '⭐',
    viewers: 2340500,
    isPopular: true,
    servers: [
      { id: 's1', name: 'Servidor 1', quality: 'HD 1080p' },
      { id: 's2', name: 'Servidor 2', quality: 'HD 720p' },
    ],
  },
  {
    id: 'live-3',
    teamHome: { name: 'São Paulo', shortName: 'SAO', logo: '⚫', score: 0 },
    teamAway: { name: 'Corinthians', shortName: 'COR', logo: '⚫', score: 0 },
    time: '20:30',
    minute: 12,
    status: 'live',
    league: 'Brasileirão Série A',
    leagueSlug: 'brasileirao',
    leagueLogo: '🇧🇷',
    viewers: 523100,
    servers: [
      { id: 's1', name: 'Servidor 1', quality: 'HD 720p' },
      { id: 's2', name: 'Servidor 2', quality: 'SD 480p' },
    ],
  },
  {
    id: 'live-4',
    teamHome: { name: 'Liverpool', shortName: 'LIV', logo: '🔴', score: 3 },
    teamAway: { name: 'Arsenal', shortName: 'ARS', logo: '🔴', score: 2 },
    time: '13:30',
    minute: 78,
    status: 'live',
    league: 'Premier League',
    leagueSlug: 'premier-league',
    leagueLogo: '🦁',
    viewers: 1890000,
    isPopular: true,
    servers: [
      { id: 's1', name: 'Servidor 1', quality: 'HD 1080p' },
      { id: 's2', name: 'Servidor 2', quality: 'HD 720p' },
      { id: 's3', name: 'Servidor 3', quality: 'SD 480p' },
    ],
  },
];

export const upcomingGames: Game[] = [
  {
    id: 'up-1',
    teamHome: { name: 'Barcelona', shortName: 'BAR', logo: '🔵', score: undefined },
    teamAway: { name: 'Atletico Madrid', shortName: 'ATL', logo: '🔴', score: undefined },
    time: '21:45',
    status: 'upcoming',
    league: 'La Liga',
    leagueSlug: 'la-liga',
    leagueLogo: '🔴',
    viewers: undefined,
  },
  {
    id: 'up-2',
    teamHome: { name: 'Botafogo', shortName: 'BOT', logo: '⚫', score: undefined },
    teamAway: { name: 'Fluminense', shortName: 'FLU', logo: '🔴', score: undefined },
    time: '20:00',
    status: 'upcoming',
    league: 'Libertadores',
    leagueSlug: 'libertadores',
    leagueLogo: '🌎',
    viewers: undefined,
  },
  {
    id: 'up-3',
    teamHome: { name: 'Bayern Munich', shortName: 'BAY', logo: '🔴', score: undefined },
    teamAway: { name: 'PSG', shortName: 'PSG', logo: '🔵', score: undefined },
    time: '21:00',
    status: 'upcoming',
    league: 'UEFA Champions League',
    leagueSlug: 'champions-league',
    leagueLogo: '⭐',
    viewers: undefined,
  },
  {
    id: 'up-4',
    teamHome: { name: 'Juventus', shortName: 'JUV', logo: '⚪', score: undefined },
    teamAway: { name: 'Inter Milan', shortName: 'INT', logo: '🔵', score: undefined },
    time: '20:45',
    status: 'upcoming',
    league: 'Serie A',
    leagueSlug: 'serie-a',
    leagueLogo: '🦅',
    viewers: undefined,
  },
  {
    id: 'up-5',
    teamHome: { name: 'Atletico-MG', shortName: 'CAM', logo: '⚫', score: undefined },
    teamAway: { name: 'Internacional', shortName: 'INT', logo: '🔴', score: undefined },
    time: '19:00',
    status: 'upcoming',
    league: 'Brasileirão Série A',
    leagueSlug: 'brasileirao',
    leagueLogo: '🇧🇷',
    viewers: undefined,
  },
  {
    id: 'up-6',
    teamHome: { name: 'Chelsea', shortName: 'CHE', logo: '🔵', score: undefined },
    teamAway: { name: 'Tottenham', shortName: 'TOT', logo: '⚪', score: undefined },
    time: '16:00',
    status: 'upcoming',
    league: 'Premier League',
    leagueSlug: 'premier-league',
    leagueLogo: '🦁',
    viewers: undefined,
  },
];

export const finishedGames: Game[] = [
  {
    id: 'fin-1',
    teamHome: { name: 'Grêmio', shortName: 'GRE', logo: '🔵', score: 1 },
    teamAway: { name: 'Cruzeiro', shortName: 'CRU', logo: '🔵', score: 1 },
    time: '17:00',
    status: 'finished',
    league: 'Brasileirão Série A',
    leagueSlug: 'brasileirao',
    leagueLogo: '🇧🇷',
  },
  {
    id: 'fin-2',
    teamHome: { name: 'AC Milan', shortName: 'MIL', logo: '🔴', score: 2 },
    teamAway: { name: 'Roma', shortName: 'ROM', logo: '🟡', score: 0 },
    time: '14:00',
    status: 'finished',
    league: 'Serie A',
    leagueSlug: 'serie-a',
    leagueLogo: '🦅',
  },
];

export const allGames: Game[] = [...liveGames, ...upcomingGames, ...finishedGames];

export const news: NewsItem[] = [
  {
    id: 'n1',
    title: 'Flamengo vence Palmeiras em clássico emocionante e assume liderança',
    summary: 'Com dois gols de Gabigol no segundo tempo, o Mengão garantiu os três pontos em jogo disputadíssimo no Maracanã.',
    image: '/news/news1.jpg',
    category: 'Brasileirão',
    publishedAt: '2026-04-23T21:30:00',
    readTime: 3,
  },
  {
    id: 'n2',
    title: 'Real Madrid e City empatam em noite de grande futebol na Champions',
    summary: 'As duas potências europeias fizeram um duelo épico que terminou em equilíbrio, prometendo muito para o jogo de volta.',
    image: '/news/news2.jpg',
    category: 'Champions League',
    publishedAt: '2026-04-23T19:00:00',
    readTime: 4,
  },
  {
    id: 'n3',
    title: 'Liverpool aplica goleada histórica e confirma favoritismo na Premier League',
    summary: 'Os Reds passaram por cima do Arsenal com um futebol irresistível, consolidando a liderança com 8 pontos de vantagem.',
    image: '/news/news3.jpg',
    category: 'Premier League',
    publishedAt: '2026-04-23T16:45:00',
    readTime: 3,
  },
  {
    id: 'n4',
    title: 'Barcelona anuncia contratação de estrela por 120 milhões de euros',
    summary: 'O clube catalão fechou a janela de transferências com mais um reforço de peso para disputar as competições europeias.',
    image: '/news/news4.jpg',
    category: 'Transferências',
    publishedAt: '2026-04-23T14:00:00',
    readTime: 2,
  },
  {
    id: 'n5',
    title: 'Seleção Brasileira convoca jogadores para a Copa América',
    summary: 'O técnico Dorival Júnior divulgou a lista com surpresas e presenças esperadas para o torneio continental.',
    image: '/news/news5.jpg',
    category: 'Seleção',
    publishedAt: '2026-04-23T12:00:00',
    readTime: 5,
  },
  {
    id: 'n6',
    title: 'Botafogo goleia rival e avança na Libertadores com chave cheia',
    summary: 'O Glorioso fez 3 a 0 fora de casa e está classificado para as oitavas de final da competição continental.',
    image: '/news/news6.jpg',
    category: 'Libertadores',
    publishedAt: '2026-04-23T10:00:00',
    readTime: 3,
  },
];

export const chatMessages: ChatMessage[] = [
  { id: 'c1', user: 'FlaRJ2024', message: '🔥 QUE GOLAÇO DO GABIGOL!!!', time: '21:34', isHighlighted: true },
  { id: 'c2', user: 'PalmeirasForce', message: 'Pênalti claro não marcado, absurdo 😤', time: '21:33' },
  { id: 'c3', user: 'futebolbr', message: 'Árbitro horrível hoje', time: '21:32' },
  { id: 'c4', user: 'mengao_fiel', message: 'Mengão demais! Hoje é goleada 💪', time: '21:31' },
  { id: 'c5', user: 'verdao10', message: 'Ainda falta muito tempo, calma', time: '21:31' },
  { id: 'c6', user: 'futebol_live', message: 'Que jogo! 2x1 mas quem foi melhor?', time: '21:30' },
  { id: 'c7', user: 'TorcedorRJ', message: 'Assistindo aqui do interior, qualidade top!', time: '21:29' },
  { id: 'c8', user: 'Craque77', message: 'Esse Flamengo tá invicto há 8 jogos 🏆', time: '21:28' },
  { id: 'c9', user: 'goleiro_sp', message: 'Bora empatar nos 5 minutos finais', time: '21:28' },
  { id: 'c10', user: 'futebol_ae', message: 'Melhor site de transmissão que já usei aqui', time: '21:27' },
  { id: 'c11', user: 'RioFutebol', message: '🔴⚫ MENGO CAMPEÃO!', time: '21:26', isHighlighted: true },
  { id: 'c12', user: 'vaideFla', message: 'Gol anulado foi correto', time: '21:25' },
  { id: 'c13', user: 'SuaMae_Gosta', message: 'Se ganhar hoje é líder isolado', time: '21:24' },
  { id: 'c14', user: 'Porchat_nao', message: 'Palmeiras ainda vai virar, acredito!', time: '21:23' },
  { id: 'c15', user: 'bolasNaRede', message: 'QUE GÊNIO O TÉCNICO HOJE 👏👏👏', time: '21:22' },
];

export function getGameById(id: string): Game | undefined {
  return allGames.find(g => g.id === id);
}

export function getGamesByLeague(slug: string): Game[] {
  return allGames.filter(g => g.leagueSlug === slug);
}

export function getLeagueBySlug(slug: string): League | undefined {
  return leagues.find(l => l.slug === slug);
}

export function formatViewers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}
