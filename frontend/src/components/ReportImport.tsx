import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  FormControlLabel,
  Checkbox,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  FileUpload as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface ImportResult {
  report: any;
  importResult: {
    valid: any[];
    errors: Array<{ row: number; data: any; error: string }>;
  };
  syncResult: {
    stats: {
      totalProcessed: number;
      newCount: number;
      updatedCount: number;
      removedCount: number;
      errorCount: number;
    };
    errors: Array<{ externalId: string; error: string }>;
  };
  summary: string;
}

export const ReportImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [markInactive, setMarkInactive] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['text/csv', 'application/json'];
      const validExtensions = ['.csv', '.json'];
      
      const hasValidType = validTypes.includes(selectedFile.type);
      const hasValidExtension = validExtensions.some(ext => 
        selectedFile.name.toLowerCase().endsWith(ext)
      );

      if (hasValidType || hasValidExtension) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please select a CSV or JSON file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('markInactive', markInactive.toString());

      const response = await fetch('/api/reports/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const validExtensions = ['.csv', '.json'];
      const hasValidExtension = validExtensions.some(ext => 
        droppedFile.name.toLowerCase().endsWith(ext)
      );

      if (hasValidExtension) {
        setFile(droppedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please select a CSV or JSON file');
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Import Daily Report
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload Apartment Listings
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a CSV or JSON file containing apartment listings to sync with the database.
            The system will automatically validate, process, and integrate the data.
          </Typography>

          {/* File Upload Area */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              borderStyle: 'dashed',
              bgcolor: 'grey.50',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'grey.100' },
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {file ? (
              <Box>
                <FileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">{file.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={clearFile} size="small">
                    Remove
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Drag & drop your file here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or click to select a CSV or JSON file
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Options */}
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={markInactive}
                  onChange={(e) => setMarkInactive(e.target.checked)}
                />
              }
              label="Mark apartments not in this report as inactive"
            />
            <Typography variant="caption" display="block" color="text.secondary">
              Enable this to automatically deactivate listings not found in the uploaded report
            </Typography>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Upload Button */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
              size="large"
            >
              {uploading ? 'Processing...' : 'Import Report'}
            </Button>
          </Box>

          {/* Progress */}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Parsing file and syncing with database...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SuccessIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="h6">Import Completed</Typography>
            </Box>

            {/* Summary Stats */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip
                label={`${result.syncResult.stats.newCount} New`}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`${result.syncResult.stats.updatedCount} Updated`}
                color="info"
                variant="outlined"
              />
              {result.syncResult.stats.removedCount > 0 && (
                <Chip
                  label={`${result.syncResult.stats.removedCount} Removed`}
                  color="warning"
                  variant="outlined"
                />
              )}
              {result.syncResult.stats.errorCount > 0 && (
                <Chip
                  label={`${result.syncResult.stats.errorCount} Errors`}
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Detailed Summary */}
            <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {result.summary}
              </Typography>
            </Paper>

            {/* Errors */}
            {(result.importResult.errors.length > 0 || result.syncResult.errors.length > 0) && (
              <Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ErrorIcon sx={{ color: 'error.main', mr: 1 }} />
                  <Typography variant="h6">Errors and Warnings</Typography>
                </Box>
                
                {result.importResult.errors.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Parsing Errors ({result.importResult.errors.length})
                    </Typography>
                    <List dense>
                      {result.importResult.errors.slice(0, 5).map((error, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`Row ${error.row}: ${error.error}`}
                            secondary={JSON.stringify(error.data).substring(0, 100) + '...'}
                          />
                        </ListItem>
                      ))}
                      {result.importResult.errors.length > 5 && (
                        <ListItem>
                          <ListItemText
                            primary={`... and ${result.importResult.errors.length - 5} more errors`}
                            secondary="Check the full report for details"
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}

                {result.syncResult.errors.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Sync Errors ({result.syncResult.errors.length})
                    </Typography>
                    <List dense>
                      {result.syncResult.errors.slice(0, 5).map((error, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`${error.externalId}: ${error.error}`}
                          />
                        </ListItem>
                      ))}
                      {result.syncResult.errors.length > 5 && (
                        <ListItem>
                          <ListItemText
                            primary={`... and ${result.syncResult.errors.length - 5} more errors`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}
              </Box>
            )}

            {/* Success Message */}
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Report import completed successfully! Check the dashboard for updated apartment listings.
                {result.syncResult.stats.newCount > 0 && ' SMS notifications have been sent for new no-fee apartments.'}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReportImport;