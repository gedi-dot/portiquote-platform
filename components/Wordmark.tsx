// The FreightPair logo: the name in two colours, with a route arcing over it.
//
// "Freight" in ink, "Pair" in saffron — the pairing the product is named for
// is carried by the colour break itself. The saffron arc lifts off left of the
// F, sweeps over "Freight", and its arrowhead lands where "Pair" begins. Route
// and destination are the same colour on purpose: the journey delivers you to
// the pair.
//
// The arc is an absolutely positioned SVG sitting OVER real HTML text, rather
// than SVG <text>. The name stays selectable, searchable and rendered in the
// site's own font at whatever weight the browser has actually loaded.
//
// Every offset below is in em, so the whole lockup scales from one font-size.
// They are derived from the drawn artwork: the arc spans from 0.31em left of
// the F to 4.21em right of it (where "Pair" starts), and rises 1.33em above
// the baseline. leading-none is required — it fixes the line box at 1em so the
// baseline sits predictably and the arc cannot drift.
const ROUTE = {
  left: "-0.31em",
  top: "-0.53em",
  width: "4.52em",
  height: "1.42em",
};

export default function Wordmark({
  className = "font-display font-bold text-[19px] tracking-[-0.01em]",
  onDark = false,
  withRoute = false,
}: {
  className?: string;
  /** On dark grounds "Freight" flips to paper; ink would be invisible. */
  onDark?: boolean;
  /**
   * Draw the route arc. Off by default because the offsets above are tuned to
   * the lowercase wordmark; uppercase or heavily tracked settings change the
   * proportions and the arc would no longer land on "Pair".
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
      <span className={onDark ? "text-paper" : "text-ink"}>Freight</span>
      <span className="text-saffron">Pair</span>
    </span>
  );
}
