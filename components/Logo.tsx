// The FreightPair mark: two interlocked containers.
//
// One box is the cargo owner, the other the forwarder — genuinely linked, and
// offset on the diagonal so the pair reads as movement rather than as a static
// emblem.
//
// Why boxes and not rings: interlocked rings are one of the most heavily used
// logo forms there is. Mastercard is two overlapping circles meaning exactly
// "connection and exchange", Audi is four, the Olympics five. Rounded squares
// say freight — a container end-on — and are far rarer, so the mark is much
// more defensible as something only we use.
//
// GEOMETRY (verified by pixel inspection, not by eye)
// Sea box     x[2,24]  y[2,24]  rx6, stroke 3
// Saffron box x[14,36] y[10,32] rx6, stroke 3
// The diagonal offset is what makes a real weave possible: the outlines cross
// at (24,10) and (14,24), and both crossings land on STRAIGHT edge runs rather
// than in the corner radii, so the overlap is clean. A purely horizontal offset
// gives two boxes whose outlines never cross, and so cannot be woven at all.
//
// THE WEAVE is done by painting order plus one redrawn segment — no SVG mask
// and no clipPath, so the mark needs no unique ids, renders identically in
// every browser, and survives being pasted into email HTML:
//   1. sea box        2. saffron box (now over sea at BOTH crossings)
//   3. an 8-unit piece of the sea box's bottom edge, redrawn on top, putting
//      sea back over saffron at (14,24) only.
// The redrawn piece lies exactly on the existing sea line, so it is invisible
// except where it crosses the saffron.
export default function Logo({
  size = 26,
  className,
  secondary = "#0B4A54",
}: {
  size?: number;
  className?: string;
  /** Second box colour. Defaults to sea; pass a lighter tone on dark grounds,
   *  where sea (#0B4A54) sits too close to ink to read. */
  secondary?: string;
}) {
  return (
    <svg
      width={(size * 38) / 34}
      height={size}
      viewBox="0 0 38 34"
      fill="none"
      className={className}
      role="img"
      aria-label="FreightPair"
    >
      <rect x="2" y="2" width="22" height="22" rx="6" stroke={secondary} strokeWidth="3" />
      <rect x="14" y="10" width="22" height="22" rx="6" stroke="#F2A83B" strokeWidth="3" />
      {/* puts the sea box back on top at the lower-left crossing */}
      <path d="M 10 24 H 18" stroke={secondary} strokeWidth="3" />
    </svg>
  );
}
