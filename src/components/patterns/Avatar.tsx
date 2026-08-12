export const AVATAR_TONES = {
  accent: 'bg-accent-subtle text-accent',
  success: 'bg-success-subtle text-success',
} as const

export type AvatarTone = keyof typeof AVATAR_TONES

export function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function Avatar({ name, tone = 'accent' }: { name: string; tone?: AvatarTone }) {
  return (
    <span
      aria-hidden
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_TONES[tone]}`}
    >
      {initials(name)}
    </span>
  )
}
