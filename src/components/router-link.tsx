import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

// make Link Accept disabled prop
export function RouterLink(
  props: LinkProps &
    React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      disabled?: boolean
      className?: string
    },
) {
  const { disabled, className, onClick, ...rest } = props

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onClick?.(e)
  }

  return (
    <Link
      aria-disabled={disabled}
      className={cn(
        'aria-disabled:opacity-50 aria-disabled:pointer-events-none',
        className,
      )}
      onClick={handleClick}
      {...rest}
    >
      {props.children}
    </Link>
  )
}
