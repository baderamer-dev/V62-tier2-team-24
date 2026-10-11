export function PathBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 900"
        className="h-full w-full opacity-[0.55] dark:opacity-[0.7]"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="landing-path" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <filter
            id="landing-glow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M-40 380 C 180 220, 380 520, 640 340 S 1100 200, 1500 420"
          fill="none"
          stroke="url(#landing-path)"
          strokeWidth="1.5"
          opacity="0.35"
        />

        <path
          id="hero-path"
          className="landing-path"
          d="M-40 320 C 220 180, 420 460, 720 310 S 1180 180, 1500 380"
          fill="none"
          stroke="url(#landing-path)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#landing-glow)"
        />

        <circle cx="180" cy="255" r="6" fill="#34d399" />
        <circle cx="420" cy="400" r="6" fill="#34d399" />
        <circle cx="720" cy="310" r="7" fill="#8b5cf6" />
        <circle cx="1100" cy="230" r="6" fill="#22d3ee" opacity="0.7" />
      </svg>
    </div>
  );
}
