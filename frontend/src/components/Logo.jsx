/** Shield with two redaction bars: the product idea in one mark. */
export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
      <path d="M16 2.5c3 2.2 6.4 3.4 10 3.6v9.2c0 6.2-4.2 10.4-10 14.2C10.2 25.700 6 21.500 6 15.300V6.100c3.600-.2 7-1.400 10-3.600z" fill="currentColor" />
      <rect x="10.500" y="11" width="11" height="3.200" rx="1" fill="var(--logo-bar, #fff)" />
      <rect x="10.500" y="16.500" width="7" height="3.200" rx="1" fill="var(--logo-bar, #fff)" />
    </svg>
  );
}

export default function Logo({ size = 28 }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-word">PromptShield</span>
    </span>
  );
}
