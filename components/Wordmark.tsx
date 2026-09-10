// The PortiQuote logo: the name in two colours, with a route arcing over it.
//
// "Porti" in ink, "Quote" in saffron. The colour break falls exactly on the
// seam of the compound word, so the split explains the name rather than just
// decorating it. The saffron arc lifts off left of the P, sweeps over "Porti",
// and its arrowhead lands just before the Q. Route and destination share a
// colour on purpose: the journey ends at the quote.
//
// The arc is an absolutely positioned SVG sitting OVER real HTML text, rather
// than SVG <text>. The name stays selectable, searchable and rendered in the
// site's own font at whatever weight the browser has actually loaded.
//
// The arc path was REDRAWN for this name, not merely refitted. The previous
// path lived in a 394x124 viewBox tuned to a ~3.1em first word ("Freight" is
// 3.14em, "GassDi" 3.08em). "Porti" is 2.16em. Scaled down to fit, that curve
// peaked below cap height and sliced straight through the letters; kept at its
// old height, it overshot the word entirely. The current path is a 262x124 box
// whose curve rises faster, so it clears the caps over a shorter word.
//
// Two traps if you ever re-derive these. Width and height must keep the
// viewBox's 2.113 ratio or the arc skews. And the bottom edge has to stay at
// 0.89em below the top of the line box, where the tail meets the baseline;
// scaling both dimensions proportionally floats the tail up into the x-height.
// Set height from the ratio, then set top to 0.89 minus height.
//
// leading-none is required — it fixes the line box at 1em so the baseline sits
// predictably and the arc cannot drift.
const ROUTE = {
  left: "-0.31em",
  top: "-0.28em",
  width: "2.48em",
  height: "1.17em",
};

export default function Wordmark({
  className = "font-display font-bold text-[19px] tracking-[-0.01em]",
  onDark = false,
  withRoute = false,
}: {
  className?: string;
  /** On dark grounds "Porti" flips to paper; ink would be invisible. */
  onDark?: boolean;
  /**
   * Draw the route arc. Off by default because the offsets above are tuned to
   * the mixed-case wordmark; uppercase or heavily tracked settings change the
   * proportions and the arc would no longer land on the Q.
   */
  withRoute?: boolean;
}) {
  return (
    <span className={`relative inline-block leading-none ${className}`}>
      {withRoute && (
        <svg
          viewBox="0 0 262 124"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={ROUTE}
        >
          <path
            d="M 7 119 C 34 34, 150 6, 235 24"
            stroke="#F2A83B"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path d="M 227 8 L 258 24 L 227 40 Z" fill="#F2A83B" />
        </svg>
      )}
      <span className={onDark ? "text-paper" : "text-ink"}>Porti</span>
      <span className="text-saffron">Quote</span>
    </span>
  );
}
