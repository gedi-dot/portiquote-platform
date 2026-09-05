// The GasDi Caravan logo: the name in two colours, with a route arcing over it.
//
// "GasDi" in ink, "Caravan" in saffron — the journey the product is named for
// is carried by the colour break itself. The saffron arc lifts off left of the
// G, sweeps over "GasDi", and its arrowhead lands where "Caravan" begins.
// Route and destination are the same colour on purpose: the journey delivers
// you to the caravan.
//
// The arc is an absolutely positioned SVG sitting OVER real HTML text, rather
// than SVG <text>. The name stays selectable, searchable and rendered in the
// site's own font at whatever weight the browser has actually loaded.
//
// Every offset below is in em, so the whole lockup scales from one font-size.
// NOTE: these were re-derived for "GasDi" (shorter than the old "Freight"),
// so the arc now spans from 0.31em left of the G to about 3.3em right of it.
// They are an estimate — check the arrowhead lands on the C of "Caravan" on a
// real screen, and nudge `width` up or down by 0.1em until it does.
const ROUTE = {
  left: "-0.31em",
  top: "-0.25em",
  width: "3.62em",
  height: "1.14em",
};

export default function Wordmark({
  className = "font-display font-bold text-[19px] tracking-[-0.01em]",
  onDark = false,
  withRoute = false,
}: {
  className?: string;
  /** On dark grounds "GasDi" flips to paper; ink would be invisible. */
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
      <span className={onDark ? "text-paper" : "text-ink"}>GasDi</span>
      <span className="text-saffron">&nbsp;Caravan</span>
    </span>
  );
}
