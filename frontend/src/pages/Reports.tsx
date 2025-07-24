import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Tab,
  Tabs,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import ReportImport from '../components/ReportImport';

interface Report {
  id: string;
  date: string;
  type: string;
  source?: string;
  filename?: string;
  importStatus?: string;
  totalListings: number;
  newListings: number;
  updatedListings: number;
  removedListings: number;
  averagePrice: number;
  summary?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        setError('Failed to fetch reports');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'processing':
        return <Chip label="Processing" color="warning" size="small" />;
      case 'failed':
        return <Chip label="Failed" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return `$${Math.round(price / 100).toLocaleString()}`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Data Management
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Report History" />
          <Tab label="Import Data" />
          <Tab label="Export & Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Daily Reports & Import History
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchReports}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">New</TableCell>
                    <TableCell align="right">Updated</TableCell>
                    <TableCell align="right">Avg Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>{formatDate(report.date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={report.type}
                          variant="outlined"
                          size="small"
                          color={report.type === 'imported' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {report.filename ? (
                          <Box>
                            <Typography variant="body2">{report.filename}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {report.source}
                            </Typography>
                          </Box>
                        ) : (
                          report.source || 'automated'
                        )}
                      </TableCell>
                      <TableCell>
                        {report.importStatus ? getStatusChip(report.importStatus) : '-'}
                      </TableCell>
                      <TableCell align="right">{report.totalListings.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Chip label={report.newListings} color="success" variant="outlined" size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={report.updatedListings} color="info" variant="outlined" size="small" />
                      </TableCell>
                      <TableCell align="right">{formatPrice(report.averagePrice)}</TableCell>
                    </TableRow>
                  ))}
                  {reports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">No reports found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ReportImport />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Export & Analytics
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Export apartment data and view analytics across all reports and time periods.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Export Current Listings (CSV)
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Export Report History
            </Button>
          </Box>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Statistics
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {reports.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Reports
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {reports.reduce((sum, r) => sum + r.newListings, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New Listings (All Time)
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.averagePrice, 0) / reports.length / 100) : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Price (All Reports)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </TabPanel>
    </Box>
  );
};