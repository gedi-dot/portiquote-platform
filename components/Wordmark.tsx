// The FreightPair logo.
//
// There is no separate symbol: the logo IS the name, split in two colours —
// "Freight" in ink, "Pair" in saffron. The pairing the product is named for is
// carried by the colour break itself rather than by a mark bolted alongside it.
//
// Practical consequence: a two-tone treatment of our own name cannot collide
// with anyone else's mark the way an abstract shape can, and there is no
// symbol to redraw when the brand grows.
//
// Sizing and tracking are passed in by the caller, because the navbar, footer
// and auth pages each want a different treatment of the same logo.
export default function Wordmark({
  className = "font-display font-bold text-[19px] tracking-[-0.01em]",
  onDark = false,
}: {
  className?: string;
  /** On dark grounds "Freight" flips to paper; ink would be invisible. */
  onDark?: boolean;
}) {
  return (
    <span className={className}>
      <span className={onDark ? "text-paper" : "text-ink"}>Freight</span>
      <span className="text-saffron">Pair</span>
    </span>
  );
}
