// Signature element: trade-route arcs from an East African hub out to world
// ports. Draws in on load; static when the user prefers reduced motion.
export default function RouteMotif() {
  return (
    <svg
      className="hidden lg:block absolute right-0 top-0 h-full w-[46%]"
      viewBox="0 0 460 360"
      fill="none"
      aria-hidden="true"
    >
      <path className="route-line" d="M150 250 C 210 120, 300 90, 360 70" stroke="#F2A83B" strokeWidth="1.4" opacity="0.85" />
      <path className="route-line" d="M150 250 C 250 210, 330 170, 405 150" stroke="#F2A83B" strokeWidth="1.4" opacity="0.7" />
      <path className="route-line" d="M150 250 C 240 260, 320 275, 410 250" stroke="#F2A83B" strokeWidth="1.4" opacity="0.7" />
      <path className="route-line" d="M150 250 C 150 190, 130 120, 120 60" stroke="#F2A83B" strokeWidth="1.4" opacity="0.55" />

      <g className="route-node"><circle cx="360" cy="70" r="3.5" fill="#F2A83B" /></g>
      <g className="route-node"><circle cx="405" cy="150" r="3.5" fill="#F2A83B" /></g>
      <g className="route-node"><circle cx="410" cy="250" r="3.5" fill="#F2A83B" /></g>
      <g className="route-node"><circle cx="120" cy="60" r="3.5" fill="#F2A83B" /></g>

      <circle cx="150" cy="250" r="7" fill="none" stroke="#F2A83B" strokeWidth="1.4" />
      <circle cx="150" cy="250" r="3.2" fill="#FBFCFB" />
    </svg>
  );
}
