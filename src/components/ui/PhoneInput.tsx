import { SearchableSelect } from './SearchableSelect'

/** Common business-context codes — the countries already in use across the
    app's company/contact fixtures, plus a few more frequent ones. Flag
    shown next to the code so the selected country is unambiguous at a
    glance (a bare "+1" alone doesn't say US vs. Canada vs. the Caribbean),
    and the country name rides along as the searchable hint. */
export const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+356', flag: '🇲🇹', name: 'Malta' },
  { code: '+675', flag: '🇵🇬', name: 'Papua New Guinea' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
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
  countryCodeOptions?: { code: string; flag: string; name?: string }[]
}

/** One field, not two — a fixed-width code+flag segment on the left, a
    divider, then the number. Same tokens as Input/Select (h-11, rounded-sm,
    border-border-default, shadow-textfield) merged into a single box, and
    full-width like every other field so forms line up on one right edge.
    The code segment is a `SearchableSelect variant="bare"`, so its open state
    is the same panel as every other dropdown in the app — one design, and the
    country name is searchable rather than requiring a scroll by dial code. */
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
      <div className="flex h-full shrink-0 items-center border-r border-border-default" style={{ width: 96 }}>
        <SearchableSelect
          id={codeId ?? 'phone-country-code'}
          variant="bare"
          ariaLabel="Country code"
          value={countryCode}
          onChange={onCountryCodeChange}
          disabled={disabled}
          error={error}
          placeholder="Code"
          indicator="radio"
          menuMinWidth={260}
          options={countryCodeOptions.map((c) => ({
            value: c.code,
            label: `${c.flag} ${c.code}`,
            hint: c.name,
          }))}
        />
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
