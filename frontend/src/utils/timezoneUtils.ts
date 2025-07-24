export type Timezone = 'MST' | 'EST'

export const timezoneOffsets: Record<Timezone, string> = {
  MST: 'America/Denver',
  EST: 'America/New_York',
}

export const formatRelativeTimeInTimezone = (date: Date, _timezone: Timezone): string => {
  // Get the time difference in the specified timezone
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  
  if (diffInMs < 60000) { // Less than 1 minute
    return 'just now'
  } else if (diffInMs < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diffInMs / 60000)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  } else if (diffInMs < 86400000) { // Less than 1 day
    const hours = Math.floor(diffInMs / 3600000)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  } else {
    const days = Math.floor(diffInMs / 86400000)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }
}

export const formatClockTime = (timezone: Timezone): string => {
  const timeZone = timezoneOffsets[timezone]
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date())
}