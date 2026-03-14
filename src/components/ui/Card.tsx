import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'interactive'
  noPadding?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', noPadding, children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface-1 border border-border rounded-[var(--radius-lg)]',
      outlined: 'border border-border bg-transparent rounded-[var(--radius-lg)]',
      elevated: 'bg-surface-1 rounded-[var(--radius-lg)] shadow-lg',
      interactive: 'bg-surface-1 border border-border rounded-[var(--radius-lg)] card-hover cursor-pointer',
    }

    return (
      <div
        ref={ref}
        className={`${variants[variant]} ${noPadding ? '' : 'p-5'} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
)

export const CardTitle = ({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold text-text-primary ${className}`} {...props}>
    {children}
  </h3>
)

export const CardDescription = ({ className = '', children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-text-secondary text-sm mt-1 ${className}`} {...props}>
    {children}
  </p>
)

export const CardContent = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props}>
    {children}
  </div>
)
