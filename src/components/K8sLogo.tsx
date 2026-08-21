export function K8sLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path
        d="M16 2 3.3 9.5v13L16 30l12.7-7.5v-13L16 2zm0 3.5 9.7 5.7v9.6L16 26.5l-9.7-5.7v-9.6L16 5.5z"
        fill="currentColor"
      />
      <circle cx="16" cy="16" r="4" fill="currentColor" />
    </svg>
  );
}
