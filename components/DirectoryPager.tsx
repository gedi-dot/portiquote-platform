import Link from "next/link";

// Server component: builds Previous / Next links that keep the current
// search params and only change ?page=. No client JS needed.
export default function DirectoryPager({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  // Compact window of page numbers around the current page.
  const windowSize = 2;
  const pages: number[] = [];
  for (let p = Math.max(1, page - windowSize); p <= Math.min(totalPages, page + windowSize); p++) {
    pages.push(p);
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-6" aria-label="Directory pages">
      <Link
        href={makeHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
          page === 1
            ? "border-ink/10 text-ink/30 pointer-events-none"
            : "border-ink/15 text-ink/70 hover:bg-mist"
        }`}
      >
        ← Prev
      </Link>

      {pages[0] > 1 && (
        <>
          <Link href={makeHref(1)} className="px-3 py-2 rounded-lg text-sm text-ink/60 hover:bg-mist">1</Link>
          {pages[0] > 2 && <span className="px-1 text-ink/30">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={makeHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
            p === page
              ? "bg-sea text-paper"
              : "text-ink/70 hover:bg-mist"
          }`}
        >
          {p}
        </Link>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-ink/30">…</span>}
          <Link href={makeHref(totalPages)} className="px-3 py-2 rounded-lg text-sm text-ink/60 hover:bg-mist">
            {totalPages}
          </Link>
        </>
      )}

      <Link
        href={makeHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
          page === totalPages
            ? "border-ink/10 text-ink/30 pointer-events-none"
            : "border-ink/15 text-ink/70 hover:bg-mist"
        }`}
      >
        Next →
      </Link>
    </nav>
  );
}
