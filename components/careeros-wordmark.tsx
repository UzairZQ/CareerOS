export function CareerOSWordmark() {
  return (
    <svg
      aria-label="CareerOS"
      className="careeros-wordmark"
      role="img"
      viewBox="0 0 188 42"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>CareerOS</title>
      <defs>
        <linearGradient id="careeros-wordmark-accent" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6FA8FF" />
          <stop offset="0.5" stopColor="#B5CFFF" />
          <stop offset="1" stopColor="#2C7BE5" />
        </linearGradient>
        <linearGradient id="careeros-wordmark-sweep" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.75" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      <text
        className="careeros-wordmark__text"
        fill="currentColor"
        fontFamily="Lora, Georgia, serif"
        fontSize="25"
        fontWeight="500"
        letterSpacing="-0.5"
        x="1"
        y="28"
      >
        CareerOS
      </text>
      <path
        className="careeros-wordmark__track"
        d="M2 36H186"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        className="careeros-wordmark__accent"
        d="M2 36H55"
        fill="none"
        stroke="url(#careeros-wordmark-accent)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        className="careeros-wordmark__sweep"
        d="M-24 36H30"
        fill="none"
        stroke="url(#careeros-wordmark-sweep)"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle
        className="careeros-wordmark__dot"
        cx="184"
        cy="36"
        fill="#6FA8FF"
        r="2"
      />
    </svg>
  );
}
