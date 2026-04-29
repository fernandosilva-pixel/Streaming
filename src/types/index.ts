export type GameStatus = 'live' | 'upcoming' | 'finished';

export interface Team {
  name: string;
  shortName: string;
  logo: string;
  score?: number;
}

export interface Game {
  id: string;
  teamHome: Team;
  teamAway: Team;
  time: string;
  status: GameStatus;
  league: string;
  leagueSlug: string;
  leagueLogo: string;
  viewers?: number;
  thumbnail?: string;
  minute?: number;
  isPopular?: boolean;
  servers?: Server[];
}

export interface Server {
  id: string;
  name: string;
  quality: string;
  url?: string;
}

export interface League {
  id: string;
  name: string;
  slug: string;
  logo: string;
  country: string;
  flag: string;
  gamesCount?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  image: string;
  category: string;
  publishedAt: string;
  readTime: number;
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  time: string;
  isHighlighted?: boolean;
}
