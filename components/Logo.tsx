// The FreightPair mark: a shipping route lifting off and arriving.
//
// Taken from the full lockup, where this same arc sweeps up over the wordmark
// and lands with its head above "Pair". On its own — in the navbar, the tab
// icon, an avatar — it reads as a route: rise, cruise, arrive.
//
// Drawn as one stroked curve plus a filled head, with no gradients, masks or
// ids, so it renders identically everywhere and survives being pasted into
// email HTML.
export default function Logo({
  size = 26,
  className,
  tone = "#F2A83B",
}: {
  size?: number;
  className?: string;
  /** Mark colour. Saffron by default; pass a lighter tone on very dark grounds. */
  tone?: string;
}) {
  return (
    <svg
      width={(size * 32) / 25}
      height={size}
      viewBox="0 0 32 25"
      fill="none"
      className={className}
      role="img"
      aria-label="FreightPair"
    >
      <path
        d="M 3 20.5 C 7 8, 16 4.5, 22 8"
        stroke={tone}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path d="M 18 2.5 L 30 9 L 18 15.5 Z" fill={tone} />
    </svg>
  );
}
