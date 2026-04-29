import HeroBanner from '@/components/home/HeroBanner';
import GameCarousel from '@/components/home/GameCarousel';
import NewsSection from '@/components/home/NewsSection';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      <HeroBanner />
      <GameCarousel />
      <NewsSection />
    </div>
  );
}
