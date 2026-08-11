import { ChevronDown } from 'lucide-react'

/** Common business-context codes — the countries already in use across the
    app's company/contact fixtures, plus a few more frequent ones. Flag
    shown next to the code so the selected country is unambiguous at a
    glance (a bare "+1" alone doesn't say US vs. Canada vs. the Caribbean). */
export const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+33', flag: '🇫🇷' },
  { code: '+49', flag: '🇩🇪' },
  { code: '+65', flag: '🇸🇬' },
  { code: '+61', flag: '🇦🇺' },
  { code: '+971', flag: '🇦🇪' },
  { code: '+356', flag: '🇲🇹' },
  { code: '+675', flag: '🇵🇬' },
  { code: '+81', flag: '🇯🇵' },
  { code: '+91', flag: '🇮🇳' },
]

export interface PhoneInputProps {
  countryCode: string
  onCountryCodeChange: (value: string) => void
  number: string
  onNumberChange: (value: string) => void
  /** Applied to the number input; the code select gets `${id}-code`. */
  id?: string
  placeholder?: string
  disabled?: boolean
  error?: boolean
  countryCodeOptions?: { code: string; flag: string }[]
}

/** One field, not two — a fixed-width code+flag segment on the left, a
    divider, then the number. Same tokens as Input/Select (h-11, rounded-sm,
    border-border-default, shadow-textfield) merged into a single box, and
    full-width like every other field so forms line up on one right edge. */
export function PhoneInput({
  countryCode, onCountryCodeChange, number, onNumberChange,
  id, placeholder = 'Phone number', disabled = false, error = false,
  countryCodeOptions = COUNTRY_CODES,
}: PhoneInputProps) {
  const codeId = id ? `${id}-code` : undefined
  return (
    <div
      className={`flex h-11 items-center rounded-sm border bg-neutral-25 shadow-textfield transition-colors duration-fast
        ${error ? 'border-danger' : 'border-border-default focus-within:border-text-primary'}
        ${disabled ? 'opacity-40' : ''}`}
    >
      <div className="relative flex h-full shrink-0 items-center border-r border-border-default" style={{ width: 88 }}>
        <label htmlFor={codeId} className="sr-only">Country code</label>
        <select
          id={codeId}
          value={countryCode}
          disabled={disabled}
          aria-invalid={error || undefined}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="h-full w-full appearance-none bg-transparent py-0 pl-base pr-xl text-sm text-text-primary outline-none disabled:cursor-not-allowed"
        >
          <option value="" disabled>Code</option>
          {countryCodeOptions.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-xs text-text-muted" aria-hidden />
      </div>
      <input
        id={id}
        type="tel"
        value={number}
        disabled={disabled}
        aria-invalid={error || undefined}
        placeholder={placeholder}
        onChange={(e) => onNumberChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent px-base text-sm text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
      />
    </div>
  )
}
