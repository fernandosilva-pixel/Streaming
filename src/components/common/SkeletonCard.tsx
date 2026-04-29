export function SkeletonGameCard() {
  return (
    <div className="rounded-xl border border-[#2A2A3A] bg-[#1A1A26] p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 skeleton rounded" />
        <div className="h-4 w-14 skeleton rounded" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <div className="w-8 h-8 skeleton rounded-full" />
          <div className="h-3 w-20 skeleton rounded" />
        </div>
        <div className="h-6 w-12 skeleton rounded" />
        <div className="flex-1 flex items-center justify-end gap-2">
          <div className="h-3 w-20 skeleton rounded" />
          <div className="w-8 h-8 skeleton rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonFeaturedCard() {
  return (
    <div className="rounded-2xl border border-[#2A2A3A] bg-[#1A1A26] p-6 animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="h-3 w-32 skeleton rounded" />
        <div className="h-5 w-16 skeleton rounded" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-12 h-12 skeleton rounded-full" />
          <div className="h-3 w-16 skeleton rounded" />
        </div>
        <div className="h-8 w-20 skeleton rounded" />
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-12 h-12 skeleton rounded-full" />
          <div className="h-3 w-16 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonNewsCard() {
  return (
    <div className="rounded-xl border border-[#2A2A3A] bg-[#1A1A26] overflow-hidden animate-pulse">
      <div className="h-44 skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-24 skeleton rounded mt-2" />
      </div>
    </div>
  );
}
