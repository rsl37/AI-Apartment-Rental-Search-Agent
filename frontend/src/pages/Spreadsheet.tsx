import { Paper, Typography, Box } from '@mui/material'

export const Spreadsheet = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Living Spreadsheet
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Apartment Listings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sortable and filterable apartment listings with full details and CSV download capability.
        </Typography>
      </Paper>
    </Box>
  )
}