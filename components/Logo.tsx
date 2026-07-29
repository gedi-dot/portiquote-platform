// The FreightPair mark: two interlocked rings.
//
// One ring is the cargo owner, the other the forwarder — linked. The rings are
// genuinely woven: the saffron ring passes over at the top crossing, the sea
// ring over at the bottom. That weave is what stops it reading as two loose
// circles sitting on top of each other.
//
// The weave is drawn with an explicit arc path rather than an SVG mask, so it
// needs no unique ids, renders identically in every browser, and survives
// being pasted into email HTML.
//
// Geometry: sea ring centred (12,13) r9.5, saffron ring centred (26,13) r9.5.
// They cross at (19, 6.58) and (19, 19.42). The sea ring is drawn as one long
// arc with a gap from -65.1° to -19.9°, centred on the top crossing (-42.5°),
// which is where the saffron shows through.
//
// The gap is 45.2° — deliberately wider than it first looks necessary. Round
// caps extend the stroke by half its width at each end, eating 3 units of the
// 7.5-unit arc, so a narrower gap leaves the caps crowding the saffron ring and
// the weave reads as mud. 45.2° leaves 4.5 units of clear space for a 3-unit
// ring to pass through.
export default function Logo({
  size = 26,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={(size * 38) / 26}
      height={size}
      viewBox="0 0 38 26"
      fill="none"
      className={className}
      role="img"
      aria-label="FreightPair"
    >
      {/* saffron ring — full circle, shows through the gap at the top crossing */}
      <circle cx="26" cy="13" r="9.5" stroke="#F2A83B" strokeWidth="3" />

      {/* sea ring — near-full arc with a gap at the top crossing, drawn over the
          saffron ring so it passes over at the bottom crossing */}
      <path
        d="M 20.934 9.769 A 9.5 9.5 0 1 1 15.997 4.382"
        stroke="#0B4A54"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
