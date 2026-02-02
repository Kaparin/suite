'use client'

type ProjectStatus = 'DRAFT' | 'UPCOMING' | 'PRESALE' | 'PUBLISHED' | 'LAUNCHED' | 'ARCHIVED'

interface TokenStatusBadgeProps {
  status: ProjectStatus
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string; icon?: string }> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    icon: 'pencil'
  },
  UPCOMING: {
    label: 'Upcoming',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: 'clock'
  },
  PRESALE: {
    label: 'Presale',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    icon: 'fire'
  },
  PUBLISHED: {
    label: 'Published',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    icon: 'check'
  },
  LAUNCHED: {
    label: 'Launched',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    icon: 'rocket'
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'text-gray-500',
    bgColor: 'bg-gray-600/20',
    icon: 'archive'
  }
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-sm'
}

export function TokenStatusBadge({ status, size = 'md' }: TokenStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT

  const renderIcon = () => {
    switch (config.icon) {
      case 'pencil':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )
      case 'clock':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'fire':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        )
      case 'check':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'rocket':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        )
      case 'archive':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      {renderIcon()}
      {config.label}
    </span>
  )
}
