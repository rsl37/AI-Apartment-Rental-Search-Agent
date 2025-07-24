import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import { Home, Assessment, TableChart, Notifications } from '@mui/icons-material'

export const Header = () => {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Home /> },
    { path: '/reports', label: 'Reports', icon: <Assessment /> },
    { path: '/spreadsheet', label: 'Spreadsheet', icon: <TableChart /> },
    { path: '/notifications', label: 'Notifications', icon: <Notifications /> },
  ]

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AI Apartment Rental Agent
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              color="inherit"
              startIcon={item.icon}
              variant={location.pathname === item.path ? 'outlined' : 'text'}
              sx={{
                color: 'white',
                borderColor: location.pathname === item.path ? 'white' : 'transparent',
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