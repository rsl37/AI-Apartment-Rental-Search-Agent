import { Paper, Typography, Box } from '@mui/material'

export const Reports = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Daily Reports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View current and historical daily research reports with date navigation and export options.
        </Typography>
      </Paper>
    </Box>
  )
}