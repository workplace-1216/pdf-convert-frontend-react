interface StatusBadgeProps {
  status: 'Success' | 'Pending' | 'Failed'
  failureReason?: string | null
}

/**
 * Status badge component for file status display
 */
export function StatusBadge({ status, failureReason }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'Success':
        return 'bg-green-100 text-green-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'Success':
        return 'Ready'
      case 'Pending':
        return 'Processing'
      case 'Failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-[2px] text-xs font-medium ${getStatusStyles()}`}
      title={status === 'Failed' && failureReason ? failureReason : undefined}
    >
      {getStatusText()}
    </span>
  )
}
