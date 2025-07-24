import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { dbUtils } from './utils/simpleDb';
import ReportImportUtils from './utils/reportImportUtils';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get apartments
app.get('/api/apartments', (req, res) => {
  try {
    const filters = req.query;
    const apartments = dbUtils.getApartments(filters);
    
    res.json({
      apartments: apartments.map((apt: any) => ({
        ...apt,
        price: apt.price / 100, // Convert to dollars
        images: JSON.parse(apt.images || '[]'),
        features: JSON.parse(apt.features || '[]')
      })),
      total: apartments.length
    });
  } catch (error) {
    console.error('Error fetching apartments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reports
app.get('/api/reports', (req, res) => {
  try {
    const reports = dbUtils.getReports();
    
    res.json({
      reports: reports.map((report: any) => ({
        ...report,
        averagePrice: report.averagePrice || 0,
        details: JSON.parse(report.details || '{}'),
        importErrors: JSON.parse(report.importErrors || '[]')
      }))
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import report endpoint
app.post('/api/reports/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const fileType = filename.toLowerCase().endsWith('.csv') ? 'csv' : 'json';

    console.log(`Processing ${filename} (${fileType})`);

    // Parse file
    let importResult;
    if (fileType === 'csv') {
      importResult = await ReportImportUtils.parseCSV(fileContent);
    } else {
      importResult = await ReportImportUtils.parseJSON(fileContent);
    }

    if (importResult.valid.length === 0) {
      return res.status(400).json({
        error: 'No valid records found',
        importResult
      });
    }

    // Simulate database sync
    let newCount = 0;
    let updatedCount = 0;
    
    for (const apartment of importResult.valid) {
      const existing: any = dbUtils.findApartmentByExternalId(apartment.externalId);
      
      if (existing) {
        dbUtils.updateApartment(existing.id, apartment);
        updatedCount++;
      } else {
        dbUtils.createApartment(apartment);
        newCount++;
      }
    }

    // Create report record
    const summary = `Import completed: ${newCount} new, ${updatedCount} updated apartments from ${filename}`;
    const reportResult = dbUtils.createReport({
      type: 'imported',
      source: fileType,
      filename,
      importStatus: 'completed',
      totalListings: newCount + updatedCount,
      newListings: newCount,
      updatedListings: updatedCount,
      summary,
      details: { importResult, filename, fileType }
    });

    console.log(`Import completed: ${newCount} new, ${updatedCount} updated`);

    res.json({
      report: {
        id: reportResult.lastInsertRowid,
        newListings: newCount,
        updatedListings: updatedCount,
        summary
      },
      importResult: {
        valid: importResult.valid.length,
        errors: importResult.errors.length
      },
      syncResult: {
        stats: {
          newCount,
          updatedCount,
          totalProcessed: importResult.valid.length,
          errorCount: importResult.errors.length
        }
      },
      summary
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Import failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'AI Apartment Rental Agent API',
    version: '1.0.0',
    endpoints: {
      apartments: 'GET /api/apartments',
      reports: 'GET /api/reports',
      import: 'POST /api/reports/import',
      health: 'GET /health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API documentation: http://localhost:${PORT}/api`);
  console.log(`💾 Database: SQLite (dev.db)`);
  
  // Log initial data
  const count: any = dbUtils.getApartmentCount();
  console.log(`📋 Initial apartments in database: ${count?.count || 0}`);
});

export default app;