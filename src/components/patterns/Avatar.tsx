/** `sm` fits a table row or a cell's second line; `md` is the standalone
    card avatar; `lg` heads a detail page, where it sits beside a 20px name and
    a 36px disc reads as an afterthought. All three carry the same colours. */
const AVATAR_SIZES = {
  sm: 'h-5 w-5 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
} as const

export type AvatarSize = keyof typeof AVATAR_SIZES

export function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

/**
 * A person's initials, in **one design everywhere in the app**: an
 * `accent-subtle` disc with `accent` initials.
 *
 * There is deliberately **no tone prop**. Colour-coding people by their role —
 * a green avatar for the person responsible, a grey one for a contact — made
 * the same person render two different ways on two screens, and made the colour
 * look like it meant something it didn't. One fill, one text colour, so a
 * person is recognisable as a person at a glance on any screen.
 */
export function Avatar({ name, size = 'md' }: { name: string; size?: AvatarSize }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent-subtle font-semibold text-accent ${AVATAR_SIZES[size]}`}
    >
      {initials(name)}
    </span>
  )
}
