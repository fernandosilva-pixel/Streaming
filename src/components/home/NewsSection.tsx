import Link from 'next/link';
import { Newspaper, ArrowRight, Clock } from 'lucide-react';
import { news } from '@/data/mock';

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Agora';
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

const categoryColors: Record<string, string> = {
  'Brasileirão': 'bg-green-500/20 text-green-400',
  'Champions League': 'bg-blue-500/20 text-blue-400',
  'Premier League': 'bg-purple-500/20 text-purple-400',
  'La Liga': 'bg-red-500/20 text-red-400',
  'Libertadores': 'bg-orange-500/20 text-orange-400',
  'Transferências': 'bg-yellow-500/20 text-yellow-400',
  'Seleção': 'bg-green-600/20 text-green-500',
};

export default function NewsSection() {
  const featured = news[0];
  const rest = news.slice(1);

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-white">Notícias</h2>
        </div>
        <Link
          href="/noticias"
          className="flex items-center gap-1.5 text-orange-500 text-sm font-medium hover:text-orange-400 transition-colors"
        >
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Featured news */}
        <Link href="/noticias" className="lg:col-span-1">
          <div className="group h-full rounded-2xl border border-[#2A2A3A] bg-[#1A1A26] overflow-hidden hover:border-orange-500/40 hover:-translate-y-0.5 transition-all duration-200">
            <div className="h-52 bg-gradient-to-br from-orange-500/30 via-[#2A1A0A] to-[#12121A] flex items-center justify-center text-6xl">
              ⚽
            </div>
            <div className="p-5">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[featured.category] ?? 'bg-gray-500/20 text-gray-400'}`}>
                {featured.category}
              </span>
              <h3 className="text-white font-bold text-base mt-3 mb-2 leading-snug group-hover:text-orange-400 transition-colors line-clamp-2">
                {featured.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{featured.summary}</p>
              <div className="flex items-center gap-3 mt-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">{featured.readTime} min</span>
                </div>
                <span className="text-xs">{timeAgo(featured.publishedAt)}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Rest of news */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rest.slice(0, 4).map(item => (
            <Link key={item.id} href="/noticias">
              <div className="group h-full flex gap-3 p-4 rounded-xl border border-[#2A2A3A] bg-[#1A1A26] hover:border-orange-500/30 hover:bg-[#212132] transition-all duration-200">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-orange-500/20 to-[#2A1A0A] flex items-center justify-center text-2xl shrink-0">
                  ⚽
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${categoryColors[item.category] ?? 'bg-gray-500/20 text-gray-400'}`}>
                    {item.category}
                  </span>
                  <h3 className="text-white text-xs font-semibold mt-1.5 mb-1 leading-snug line-clamp-2 group-hover:text-orange-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-[10px]">{timeAgo(item.publishedAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
