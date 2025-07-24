import { useState, useEffect } from 'react'
import { Box, Typography, Avatar } from '@mui/material'
import { formatClockTime, type Timezone } from '@/utils/timezoneUtils'

interface RealTimeClockProps {
  timezone: Timezone
}

export const RealTimeClock = ({ timezone }: RealTimeClockProps) => {
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(formatClockTime(timezone))
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [timezone])

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      p: 2,
      bgcolor: 'rgba(59, 130, 246, 0.05)',
      borderRadius: 2,
      border: '1px solid rgba(59, 130, 246, 0.1)',
    }}>
      <Avatar sx={{ 
        bgcolor: 'rgba(59, 130, 246, 0.1)', 
        color: '#3b82f6', 
        fontSize: '1.2rem',
        width: 40,
        height: 40
      }}>
        🕰️
      </Avatar>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
          {currentTime}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {currentDate} • {timezone === 'MST' ? 'Mountain Time' : 'Eastern Time'}
        </Typography>
      </Box>
    </Box>
  )
}