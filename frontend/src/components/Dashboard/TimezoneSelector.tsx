import { 
  FormControl, 
  Select, 
  MenuItem, 
  Box, 
  Typography, 
  Avatar,
  SelectChangeEvent 
} from '@mui/material'

export type Timezone = 'MST' | 'EST'

interface TimezoneSelectorProps {
  timezone: Timezone
  onTimezoneChange: (timezone: Timezone) => void
}

export const TimezoneSelector = ({ timezone, onTimezoneChange }: TimezoneSelectorProps) => {
  const handleChange = (event: SelectChangeEvent) => {
    onTimezoneChange(event.target.value as Timezone)
  }

  const timezones = [
    { value: 'MST', label: 'Mountain Standard Time', icon: '🏔️' },
    { value: 'EST', label: 'Eastern Standard Time', icon: '🌅' },
  ]

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar sx={{ 
        bgcolor: 'rgba(59, 130, 246, 0.1)', 
        color: '#3b82f6', 
        fontSize: '1rem',
        width: 32,
        height: 32
      }}>
        🕐
      </Avatar>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Timezone
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={timezone}
            onChange={handleChange}
            displayEmpty
            sx={{
              fontSize: '0.875rem',
              '& .MuiSelect-select': {
                py: 0.5,
              },
            }}
          >
            {timezones.map((tz) => (
              <MenuItem key={tz.value} value={tz.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{tz.icon}</span>
                  <span>{tz.label}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  )
}