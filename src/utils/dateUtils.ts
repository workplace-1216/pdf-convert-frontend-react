/**
 * Formats an ISO date string to local time
 * @param isoString - ISO 8601 date string
 * @returns Formatted local date string
 */
export function formatDateLocal(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleString()
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}
