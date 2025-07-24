import { Paper, Typography, Box } from '@mui/material'

export const Notifications = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Notification Settings
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          SMS Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add and verify phone numbers via Twilio SMS, toggle alert preferences, and view delivery history.
        </Typography>
      </Paper>
    </Box>
  )
}