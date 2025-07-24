import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'

export const Header = () => {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/reports', label: 'Reports' },
    { path: '/spreadsheet', label: 'Spreadsheet' },
    { path: '/notifications', label: 'Notifications' },
  ]

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Avatar sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.15)', 
            mr: 2,
            backdropFilter: 'blur(10px)',
          }}>
            🤖
          </Avatar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              fontSize: '1.25rem',
              background: 'linear-gradient(45deg, #ffffff 30%, #f0f9ff 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI Apartment Rental Agent
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              sx={{
                color: 'white',
                fontWeight: 500,
                px: 2,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                backgroundColor: location.pathname === item.path 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'transparent',
                backdropFilter: location.pathname === item.path ? 'blur(10px)' : 'none',
                border: location.pathname === item.path 
                  ? '1px solid rgba(255, 255, 255, 0.2)' 
                  : '1px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}