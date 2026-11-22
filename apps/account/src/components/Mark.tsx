import { useId } from 'react'

/** The AppElent mark: slate tile, chalk A, teal dot. */
export function Mark({ size }: { size: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b4a6b" />
          <stop offset="1" stopColor="#1c2333" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${id})`} />
      <path
        d="M256 104 L376 408 H322 L296 336 H216 L190 408 H136 Z M232 290 H280 L256 222 Z"
        fill="#f4f6fb"
      />
      <circle cx="388" cy="132" r="34" fill="#7fd1c8" />
    </svg>
  )
}

export function AppIcon({ src, size }: { src: string; size: number }) {
  // Decorative: the app name is always next to it as text.
  return (
    <img
      className="app-icon"
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  )
}

export function Chevron({ back = false }: { back?: boolean }) {
  return (
    <svg
      width={back ? 18 : 20}
      height={back ? 18 : 20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={back ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}

export function External() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  )
}
