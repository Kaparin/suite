import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'
  size?: 'sm' | 'md'
  dot?: boolean
}

export function Badge({
  className = '',
  variant = 'default',
  size = 'md',
  dot,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-surface-2 text-text-secondary border border-border',
    success: 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/20',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning)]/20',
    danger: 'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)]/20',
    info: 'bg-accent-light text-accent border border-accent/20',
    accent: 'bg-accent text-white border border-accent',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-[var(--radius-full)] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-[var(--success)]' :
          variant === 'warning' ? 'bg-[var(--warning)]' :
          variant === 'danger' ? 'bg-[var(--danger)]' :
          variant === 'accent' ? 'bg-white' :
          'bg-accent'
        } ${variant === 'success' ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  )
}
