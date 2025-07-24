import { format, parseISO, isValid } from 'date-fns'

export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return 'Invalid date'
    return format(dateObj, 'MMM dd, yyyy')
  } catch {
    return 'Invalid date'
  }
}

export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return 'Invalid date'
    return format(dateObj, 'MMM dd, yyyy hh:mm a')
  } catch {
    return 'Invalid date'
  }
}

export const formatDateForInput = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    return format(dateObj, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export const getDateRange = (days: number): { start: Date; end: Date } => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return { start, end }
}

export const isDateInRange = (date: string | Date, start: Date, end: Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) && dateObj >= start && dateObj <= end
  } catch {
    return false
  }
}