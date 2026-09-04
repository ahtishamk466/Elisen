import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export interface UrlFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** A link is only worth storing if it can be opened. */
export function isOpenableUrl(value: string) {
  return /^(https?:\/\/|\/)\S+$/i.test(value.trim())
}

/**
 * A URL input with **Go To** beside it — the same control in every form that
 * stores a link, so a link is never something you have to copy out of a text
 * box to use. Disabled until the value is actually openable, which doubles as
 * a validity hint without an error message.
 */
export function UrlField({ id, value, onChange, placeholder = 'Link to the file...' }: UrlFieldProps) {
  const openable = isOpenableUrl(value)
  return (
    <div className="flex gap-sm">
      <Input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <Button
        variant="secondary"
        className="shrink-0"
        disabled={!openable}
        leadingIcon={<ExternalLink size={16} />}
        onClick={() => window.open(value.trim(), '_blank', 'noopener,noreferrer')}
      >
        Go To
      </Button>
    </div>
  )
}
