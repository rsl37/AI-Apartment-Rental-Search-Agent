import { Routes, Route } from 'react-router-dom'
import { Container, Box } from '@mui/material'
import { Header } from '@/components/Shared/Header'
import { Dashboard } from '@/pages/Dashboard'
import { Reports } from '@/pages/Reports'
import { Spreadsheet } from '@/pages/Spreadsheet'
import { Notifications } from '@/pages/Notifications'

function App() {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Header />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/spreadsheet" element={<Spreadsheet />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App