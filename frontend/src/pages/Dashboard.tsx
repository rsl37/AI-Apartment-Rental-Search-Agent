import { useState } from 'react'
import { 
  Grid, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Avatar,
  LinearProgress,
  Chip,
  Stack,
  Button,
  Fade,
  CircularProgress
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { TimezoneSelector, type Timezone } from '@/components/Dashboard/TimezoneSelector'
import { RealTimeClock } from '@/components/Dashboard/RealTimeClock'
import { useLiveDashboard } from '@/hooks/useLiveDashboard'
import { formatRelativeTimeInTimezone } from '@/utils/timezoneUtils'

export const Dashboard = () => {
  const [timezone, setTimezone] = useState<Timezone>('EST')
  const { stats, activities, searchHealth, isLoading, lastRefresh, refresh } = useLiveDashboard(timezone)

  const statCards = [
    {
      title: 'Total Listings',
      value: stats.totalListings.toString(),
      change: stats.totalListingsChange,
      trend: 'up' as const,
      icon: '🏠',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      title: 'New Today',
      value: stats.newToday.toString(),
      change: stats.newTodayChange,
      trend: 'up' as const,
      icon: '📅',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Avg Price',
      value: `$${stats.avgPrice.toLocaleString()}`,
      change: stats.avgPriceChange,
      trend: stats.avgPriceChange.startsWith('+') ? 'up' : 'down' as const,
      icon: '💰',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      title: 'Verified Users',
      value: stats.verifiedUsers.toString(),
      change: stats.verifiedUsersChange,
      trend: 'up' as const,
      icon: '👥',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
  ]

  return (
    <Box>
      {/* Enhanced Header with Live Clock and Timezone */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
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
              Live Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time insights with automatic updates every 30 seconds
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <TimezoneSelector timezone={timezone} onTimezoneChange={setTimezone} />
            <Button
              variant="outlined"
              size="small"
              startIcon={isLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={refresh}
              disabled={isLoading}
              sx={{ 
                borderColor: 'rgba(59, 130, 246, 0.3)',
                color: '#3b82f6',
                '&:hover': {
                  borderColor: '#3b82f6',
                  bgcolor: 'rgba(59, 130, 246, 0.05)',
                },
              }}
            >
              {isLoading ? 'Updating...' : 'Refresh'}
            </Button>
          </Box>
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <RealTimeClock timezone={timezone} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 2,
              bgcolor: 'rgba(16, 185, 129, 0.05)',
              borderRadius: 2,
              border: '1px solid rgba(16, 185, 129, 0.1)',
            }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(16, 185, 129, 0.1)', 
                color: '#10b981', 
                fontSize: '1.2rem',
                width: 40,
                height: 40
              }}>
                🔄
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Last Updated
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatRelativeTimeInTimezone(lastRefresh, timezone)} • Auto-refresh enabled
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <Grid container spacing={3}>
        {/* Enhanced Stats Cards with Live Data */}
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Fade in timeout={500 + index * 100}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1px solid rgba(229, 231, 235, 0.8)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
                    transform: 'translateY(-4px)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${stat.color}, ${stat.color}80)`,
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: stat.bgColor,
                        color: stat.color,
                        width: 56,
                        height: 56,
                        fontSize: '1.75rem',
                        border: `2px solid ${stat.color}20`,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    {isLoading && (
                      <CircularProgress size={20} sx={{ color: stat.color }} />
                    )}
                  </Box>
                  
                  <Typography variant="h3" sx={{ 
                    fontWeight: 800, 
                    mb: 1, 
                    color: stat.color,
                    fontSize: '2.25rem',
                    lineHeight: 1.2,
                  }}>
                    {stat.value}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                    {stat.title}
                  </Typography>
                  
                  <Chip
                    label={`${stat.trend === 'up' ? '↗' : '↘'} ${stat.change}`}
                    size="small"
                    sx={{
                      bgcolor: stat.trend === 'up' ? '#dcfce7' : '#fef2f2',
                      color: stat.trend === 'up' ? '#166534' : '#991b1b',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}

        {/* Enhanced Activity Feed with Live Updates */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            height: '450px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
          }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(59, 130, 246, 0.1)', 
                    color: '#3b82f6', 
                    fontSize: '1.2rem',
                    width: 48,
                    height: 48,
                  }}>
                    📊
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Live Activity Feed
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Real-time updates • {timezone === 'MST' ? 'Mountain Time' : 'Eastern Time'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: '#10b981',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }} />
                  <Typography variant="caption" color="text.secondary">
                    Live
                  </Typography>
                </Box>
              </Box>
              
              <Stack spacing={3} sx={{ maxHeight: '320px', overflow: 'auto' }}>
                {activities.map((activity, index) => (
                  <Fade in timeout={300 + index * 100} key={activity.id}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(248, 250, 252, 0.5)',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      '&:hover': {
                        bgcolor: 'rgba(248, 250, 252, 0.8)',
                        transform: 'translateX(4px)',
                      },
                      transition: 'all 0.2s ease',
                    }}>
                      <Box sx={{ fontSize: '1rem', minWidth: '20px', textAlign: 'center' }}>
                        {activity.status}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {activity.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.details} • {formatRelativeTimeInTimezone(activity.time, timezone)}
                        </Typography>
                      </Box>
                    </Box>
                  </Fade>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Search Health with Live Metrics */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '450px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
          }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(16, 185, 129, 0.1)', 
                    color: '#10b981', 
                    fontSize: '1.2rem',
                    width: 48,
                    height: 48,
                  }}>
                    🔍
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      System Health
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Live monitoring
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="Healthy"
                  size="small"
                  sx={{
                    bgcolor: '#dcfce7',
                    color: '#166534',
                    fontWeight: 600,
                  }}
                />
              </Box>
              
              <Stack spacing={4}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      API Status
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {searchHealth.apiStatus}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={searchHealth.apiStatus} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: '#f1f5f9',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#10b981',
                        borderRadius: 4,
                      },
                    }} 
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Scraper Success Rate
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {searchHealth.scraperSuccessRate}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={searchHealth.scraperSuccessRate} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: '#f1f5f9',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#3b82f6',
                        borderRadius: 4,
                      },
                    }} 
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Filter Accuracy
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {searchHealth.filterAccuracy}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={searchHealth.filterAccuracy} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: '#f1f5f9',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#8b5cf6',
                        borderRadius: 4,
                      },
                    }} 
                  />
                </Box>
                
                <Box sx={{ 
                  mt: 4, 
                  p: 3, 
                  bgcolor: 'rgba(59, 130, 246, 0.05)', 
                  borderRadius: 3,
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Last system check:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatRelativeTimeInTimezone(searchHealth.lastUpdated, timezone)}
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