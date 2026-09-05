// The GassDi Caravan logo: the name in two colours, with a route arcing over it.
//
// "GassDi" in ink, "Caravan" in saffron — the journey the product is named for
// is carried by the colour break itself. The saffron arc lifts off left of the
// G, sweeps over "GassDi", and its arrowhead lands where "Caravan" begins.
// Route and destination are the same colour on purpose: the journey delivers
// you to the caravan.
//
// The arc is an absolutely positioned SVG sitting OVER real HTML text, rather
// than SVG <text>. The name stays selectable, searchable and rendered in the
// site's own font at whatever weight the browser has actually loaded.
//
// Every offset below is in em, so the whole lockup scales from one font-size.
// They are measured, not guessed: "GassDi" advances 3.08em in Bricolage at
// weight 700, so "Caravan" begins around 3.33em and the arrowhead — which sits
// at 99.2% of the SVG width — is placed just before it.
//
// Two traps if you ever re-derive these. The viewBox is 394x124, so width and
// height must keep that 3.177 ratio or the arc skews. And the bottom edge has
// to stay at 0.89em below the top of the line box, where the arc's tail meets
// the baseline; scaling both dimensions proportionally floats the tail up into
// the x-height. Set height from the ratio, then set top to 0.89 minus height.
//
// leading-none is required — it fixes the line box at 1em so the baseline sits
// predictably and the arc cannot drift.
const ROUTE = {
  left: "-0.31em",
  top: "-0.41em",
  width: "4.14em",
  height: "1.30em",
};

export default function Wordmark({
  className = "font-display font-bold text-[19px] tracking-[-0.01em]",
  onDark = false,
  withRoute = false,
}: {
  className?: string;
  /** On dark grounds "GassDi" flips to paper; ink would be invisible. */
  onDark?: boolean;
  /**
   * Draw the route arc. Off by default because the offsets above are tuned to
   * the mixed-case wordmark; uppercase or heavily tracked settings change the
   * proportions and the arc would no longer land on "Caravan".
   */
  withRoute?: boolean;
}) {
  return (
    <span className={`relative inline-block leading-none ${className}`}>
      {withRoute && (
        <svg
          viewBox="0 0 394 124"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={ROUTE}
        >
          <path
            d="M 7 119 C 59 29, 249 7, 367 25"
            stroke="#F2A83B"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path d="M 359 9 L 391 25 L 359 41 Z" fill="#F2A83B" />
        </svg>
      )}
      <span className={onDark ? "text-paper" : "text-ink"}>GassDi</span>
      <span className="text-saffron">&nbsp;Caravan</span>
    </span>
  );
}
