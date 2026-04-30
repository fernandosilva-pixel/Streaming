import { Newspaper } from 'lucide-react';

export default function NewsSection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-white">Notícias</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Featured card */}
        <div className="lg:col-span-1 h-full rounded-2xl border border-[#2A2A3A] bg-[#1A1A26] overflow-hidden">
          <div className="h-52 bg-gradient-to-br from-orange-500/30 via-[#2A1A0A] to-[#12121A] flex items-center justify-center text-6xl">
            ⚽
          </div>
          <div className="p-5 flex items-center justify-center" style={{ minHeight: 120 }}>
            <p className="text-gray-600 font-bold tracking-widest text-sm">EM BREVE</p>
          </div>
        </div>

        {/* Smaller cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-full flex gap-3 p-4 rounded-xl border border-[#2A2A3A] bg-[#1A1A26]">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-orange-500/20 to-[#2A1A0A] flex items-center justify-center text-2xl shrink-0">
                ⚽
              </div>
              <div className="flex-1 flex items-center">
                <p className="text-gray-600 font-bold tracking-widest text-xs">EM BREVE</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
