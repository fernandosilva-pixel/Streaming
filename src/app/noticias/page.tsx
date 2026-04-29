import { Newspaper, Clock, TrendingUp } from 'lucide-react';
import { news } from '@/data/mock';

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Agora mesmo';
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

const categoryColors: Record<string, string> = {
  'Brasileirão': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Champions League': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Premier League': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'La Liga': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Libertadores': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Transferências': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Seleção': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const allCategories = ['Todos', ...new Set(news.map(n => n.category))];

export default function NoticiasPage() {
  const featured = news[0];
  const rest = news.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Notícias</h1>
            <p className="text-gray-500 text-sm">Últimas do futebol mundial</p>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 flex-wrap mb-7">
        {allCategories.map(cat => (
          <button
            key={cat}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
              cat === 'Todos'
                ? 'bg-orange-500 text-white border-orange-500'
                : (categoryColors[cat] ?? 'bg-[#1A1A26] text-gray-400 border-[#2A2A3A] hover:border-orange-500/30')
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured */}
      <div className="rounded-2xl border border-[#2A2A3A] bg-gradient-to-br from-[#1A1A26] to-[#12121A] overflow-hidden mb-7 group cursor-pointer hover:border-orange-500/40 transition-all">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="h-64 lg:h-auto bg-gradient-to-br from-orange-500/20 via-[#2A1A0A] to-[#12121A] flex items-center justify-center text-8xl">
            ⚽
          </div>
          <div className="p-7 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 text-orange-500">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase">Destaque</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${categoryColors[featured.category] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                {featured.category}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white leading-snug mb-3 group-hover:text-orange-400 transition-colors">
              {featured.title}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">{featured.summary}</p>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs">{featured.readTime} min de leitura</span>
              </div>
              <span className="text-xs">{timeAgo(featured.publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* News grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rest.map(item => (
          <div
            key={item.id}
            className="group rounded-xl border border-[#2A2A3A] bg-[#1A1A26] overflow-hidden hover:border-orange-500/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="h-44 bg-gradient-to-br from-orange-500/10 via-[#1A0A00] to-[#12121A] flex items-center justify-center text-5xl">
              ⚽
            </div>
            <div className="p-5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${categoryColors[item.category] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                {item.category}
              </span>
              <h3 className="text-white font-bold text-sm mt-3 mb-2 leading-snug group-hover:text-orange-400 transition-colors line-clamp-2">
                {item.title}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4">{item.summary}</p>
              <div className="flex items-center justify-between text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{item.readTime} min</span>
                </div>
                <span className="text-xs">{timeAgo(item.publishedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
