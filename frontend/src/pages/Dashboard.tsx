import { 
  Grid, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Stack
} from '@mui/material'

export const Dashboard = () => {
  const statCards = [
    {
      title: 'Total Listings',
      value: '142',
      change: '+12%',
      trend: 'up',
      icon: '🏠',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      title: 'New Today',
      value: '8',
      change: '+25%',
      trend: 'up',
      icon: '📅',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Avg Price',
      value: '$3,245',
      change: '-2%',
      trend: 'down',
      icon: '💰',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      title: 'Verified Users',
      value: '5',
      change: '+1',
      trend: 'up',
      icon: '👥',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
  ]

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time insights into your apartment search progress
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Enhanced Stats Cards */}
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                '&:hover': {
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: stat.bgColor,
                      color: stat.color,
                      width: 48,
                      height: 48,
                      fontSize: '1.5rem',
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ fontSize: '1.2rem' }}>⋮</Box>
                </Box>
                
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: stat.color }}>
                  {stat.value}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {stat.title}
                </Typography>
                
                <Chip
                  label={`${stat.trend === 'up' ? '↗' : '↘'} ${stat.change}`}
                  size="small"
                  sx={{
                    bgcolor: stat.trend === 'up' ? '#ecfdf5' : '#fef2f2',
                    color: stat.trend === 'up' ? '#065f46' : '#991b1b',
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Enhanced Activity Feed */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            height: '400px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '1.2rem' }}>
                    📊
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Activity
                  </Typography>
                </Box>
                <Box sx={{ fontSize: '1.2rem' }}>⋮</Box>
              </Box>
              
              <Stack spacing={3}>
                {[
                  { action: 'New listing found', time: '2 minutes ago', details: '1BR in SoHo - $3,200/month', status: '🟢' },
                  { action: 'Price drop alert', time: '1 hour ago', details: 'Studio in East Village - Now $2,800', status: '🟡' },
                  { action: 'User verification', time: '3 hours ago', details: 'New verified user added', status: '🔵' },
                  { action: 'Daily report generated', time: '6 hours ago', details: '15 new listings processed', status: '⚪' },
                ].map((activity, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ fontSize: '0.8rem' }}>{activity.status}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {activity.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.details} • {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Search Health */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '400px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '1.2rem' }}>
                    🔍
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Search Health
                  </Typography>
                </Box>
                <Chip
                  label="Healthy"
                  size="small"
                  sx={{
                    bgcolor: '#ecfdf5',
                    color: '#065f46',
                  }}
                />
              </Box>
              
              <Stack spacing={3}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      API Status
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      100%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={100} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: '#f3f4f6',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#10b981',
                      },
                    }} 
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Scraper Success Rate
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      94%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={94} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: '#f3f4f6',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#3b82f6',
                      },
                    }} 
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Filter Accuracy
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      98%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={98} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: '#f3f4f6',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#8b5cf6',
                      },
                    }} 
                  />
                </Box>
                
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Last updated: 5 minutes ago
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}