"use client";

import { useRouter, useSearchParams } from "next/navigation";

// Sort control for the directory. Preserves the current search (origin,
// destination, service, q) while changing the sort order.
export default function SortBar({ count }: { count: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const sort = params.get("sort") ?? "rating";

  function setSort(value: string) {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (value) next.set("sort", value);
    else next.delete("sort");
    router.push(`/?${next.toString()}`);
  }

  return (
    <div className="flex items-baseline justify-between mb-5">
      <h2 className="font-display font-semibold text-xl">Forwarder directory</h2>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-ink/50 mr-1">{count} shown</span>
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/45">Sort</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-xs font-medium bg-mist rounded-md px-2.5 py-1.5 outline-none"
        >
          <option value="rating">Top rated</option>
          <option value="reviews">Most reviewed</option>
          <option value="name">A–Z</option>
        </select>
      </div>
    </div>
  );
}
