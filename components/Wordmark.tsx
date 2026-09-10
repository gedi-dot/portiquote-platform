// The PortiQuote logo: the name in two colours.
//
// "Porti" in ink, "Quote" in saffron. The colour break falls exactly on the
// seam of the compound word, so the split explains the name rather than just
// decorating it.
//
// This is real HTML text, not SVG <text>, so the name stays selectable,
// searchable, and rendered in the site's own font at whatever weight the
// browser has actually loaded.
//
// A saffron route arc used to sweep over the first word. It was removed
// deliberately. Its geometry was pinned to the pixel width of whatever the
// first word happened to be, so every rename — Freight, GassDi, Porti — meant
// remeasuring the type and redrawing the curve by hand, four times in all. A
// wordmark that survives its own name change is worth more than the flourish.
// The arc lives on as the standalone mark in app/icon.svg, where nothing
// constrains it.
export default function Wordmark({
  className = "font-display font-bold text-[19px] tracking-[-0.01em]",
  onDark = false,
}: {
  className?: string;
  /** On dark grounds "Porti" flips to paper; ink would be invisible. */
  onDark?: boolean;
}) {
  return (
    <span className={`inline-block leading-none ${className}`}>
      <span className={onDark ? "text-paper" : "text-ink"}>Porti</span>
      <span className="text-saffron">Quote</span>
    </span>
  );
}
