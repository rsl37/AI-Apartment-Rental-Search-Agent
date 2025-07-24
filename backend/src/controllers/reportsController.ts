import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportCreateInput } from '../models/Report';
import ReportImportUtils, { ImportValidationResult } from '../utils/reportImportUtils';
import DatabaseSyncService from '../services/databaseSyncService';
import logger from '../config/logger';
import multer from 'multer';

const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/json', 'text/plain'];
    const allowedExtensions = ['.csv', '.json'];
    
    const hasValidType = allowedTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));
    
    if (hasValidType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and JSON files are allowed.'));
    }
  },
});

export { upload };

export class ReportsController {
  // Get all reports
  async getReports(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, type, dateFrom, dateTo } = req.query;

      const filters: any = {};
      if (type) filters.type = type;
      if (dateFrom || dateTo) {
        filters.date = {};
        if (dateFrom) filters.date.gte = new Date(dateFrom as string);
        if (dateTo) filters.date.lte = new Date(dateTo as string);
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where: filters,
          skip,
          take,
          orderBy: { date: 'desc' },
        }),
        prisma.report.count({ where: filters }),
      ]);

      res.json({
        reports,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      logger.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get single report
  async getReport(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const report = await prisma.report.findUnique({
        where: { id },
      });

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.json(report);
    } catch (error) {
      logger.error('Error fetching report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get latest daily report
  async getLatestDailyReport(req: Request, res: Response) {
    try {
      const report = await prisma.report.findFirst({
        where: { type: 'daily' },
        orderBy: { date: 'desc' },
      });

      if (!report) {
        return res.status(404).json({ error: 'No daily reports found' });
      }

      res.json(report);
    } catch (error) {
      logger.error('Error fetching latest daily report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create report
  async createReport(req: Request, res: Response) {
    try {
      const data: ReportCreateInput = req.body;

      const report = await prisma.report.create({
        data,
      });

      res.status(201).json(report);
    } catch (error) {
      logger.error('Error creating report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Generate daily report
  async generateDailyReport(req: Request, res: Response) {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get today's apartments
      const todayApartments = await prisma.apartment.findMany({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
          isActive: true,
        },
      });

      // Get updated apartments
      const updatedApartments = await prisma.apartment.findMany({
        where: {
          updatedAt: {
            gte: yesterday,
            lt: today,
          },
          createdAt: {
            lt: yesterday,
          },
          isActive: true,
        },
      });

      // Get total active apartments
      const totalApartments = await prisma.apartment.count({
        where: { isActive: true },
      });

      // Calculate price statistics
      const apartments = await prisma.apartment.findMany({
        where: { isActive: true },
        select: { price: true },
      });

      const prices = apartments.map(apt => apt.price / 100); // Convert to dollars
      const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const sortedPrices = prices.sort((a, b) => a - b);
      const medianPrice = sortedPrices.length > 0 
        ? sortedPrices[Math.floor(sortedPrices.length / 2)] 
        : 0;
      const lowestPrice = sortedPrices.length > 0 ? sortedPrices[0] : 0;
      const highestPrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1] : 0;

      const reportData: ReportCreateInput = {
        date: today,
        type: 'daily',
        totalListings: totalApartments,
        newListings: todayApartments.length,
        updatedListings: updatedApartments.length,
        removedListings: 0, // TODO: Track removals
        averagePrice: Math.round(averagePrice * 100), // Store in cents
        medianPrice: Math.round(medianPrice * 100),
        lowestPrice: Math.round(lowestPrice * 100),
        highestPrice: Math.round(highestPrice * 100),
        summary: `Daily report for ${today.toDateString()}: ${todayApartments.length} new listings found.`,
        details: {
          newApartments: todayApartments.map(apt => apt.id),
          updatedApartments: updatedApartments.map(apt => apt.id),
          priceRange: { min: lowestPrice, max: highestPrice, avg: averagePrice },
        },
        listings: [...todayApartments.map(apt => apt.id), ...updatedApartments.map(apt => apt.id)],
      };

      const report = await prisma.report.create({
        data: reportData,
      });

      res.status(201).json({
        ...report,
        averagePrice: report.averagePrice / 100,
        medianPrice: report.medianPrice / 100,
        lowestPrice: report.lowestPrice / 100,
        highestPrice: report.highestPrice / 100,
      });
    } catch (error) {
      logger.error('Error generating daily report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get report statistics
  async getReportStats(req: Request, res: Response) {
    try {
      const totalReports = await prisma.report.count();
      
      const recentReports = await prisma.report.findMany({
        take: 30,
        orderBy: { date: 'desc' },
        select: {
          date: true,
          totalListings: true,
          newListings: true,
          averagePrice: true,
        },
      });

      const averageNewListings = recentReports.length > 0
        ? recentReports.reduce((sum, report) => sum + report.newListings, 0) / recentReports.length
        : 0;

      const averagePrice = recentReports.length > 0
        ? recentReports.reduce((sum, report) => sum + report.averagePrice, 0) / recentReports.length / 100
        : 0;

      const trendsData = recentReports.map(report => ({
        date: report.date.toISOString().split('T')[0],
        totalListings: report.totalListings,
        newListings: report.newListings,
        averagePrice: report.averagePrice / 100,
      }));

      res.json({
        totalReports,
        averageNewListings: Math.round(averageNewListings),
        averagePrice: Math.round(averagePrice),
        trendsData,
      });
    } catch (error) {
      logger.error('Error fetching report stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Import daily report from CSV/JSON file
  async importDailyReport(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { markInactive = 'false' } = req.body;
      const markOthersInactive = markInactive === 'true';
      const fileContent = req.file.buffer.toString('utf-8');
      const filename = req.file.originalname;
      const fileType = filename.toLowerCase().endsWith('.csv') ? 'csv' : 'json';

      logger.info(`Starting import of ${filename} (${fileType})`);

      // Create report record with pending status
      const report = await prisma.report.create({
        data: {
          date: new Date(),
          type: 'imported',
          source: fileType,
          filename,
          importStatus: 'processing',
          summary: `Importing ${filename}...`,
        },
      });

      try {
        // Parse the file
        let importResult: ImportValidationResult;
        if (fileType === 'csv') {
          importResult = await ReportImportUtils.parseCSV(fileContent);
        } else {
          importResult = await ReportImportUtils.parseJSON(fileContent);
        }

        // Update report with parsing results
        const importSummary = ReportImportUtils.generateImportSummary(importResult, filename, fileType);
        
        if (importResult.valid.length === 0) {
          await prisma.report.update({
            where: { id: report.id },
            data: {
              importStatus: 'failed',
              importErrors: importResult.errors,
              summary: `Import failed: No valid records found in ${filename}`,
              details: { importSummary, errors: importResult.errors },
            },
          });

          return res.status(400).json({
            error: 'No valid records found in file',
            importResult,
            importSummary,
          });
        }

        // Sync with database
        const syncResult = await DatabaseSyncService.syncApartments(
          importResult.valid,
          report.id,
          markOthersInactive
        );

        // Send notifications for new no-fee apartments
        await DatabaseSyncService.sendNoFeeNotifications(
          syncResult.newApartments,
          report.id
        );

        // Calculate statistics
        const totalListings = await prisma.apartment.count({ where: { isActive: true } });
        const apartments = await prisma.apartment.findMany({
          where: { isActive: true },
          select: { price: true },
        });

        const prices = apartments.map(apt => apt.price);
        const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
        const sortedPrices = prices.sort((a, b) => a - b);
        const medianPrice = sortedPrices.length > 0 ? sortedPrices[Math.floor(sortedPrices.length / 2)] : 0;
        const lowestPrice = sortedPrices.length > 0 ? sortedPrices[0] : 0;
        const highestPrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1] : 0;

        // Generate final summary
        const syncSummary = DatabaseSyncService.generateSyncSummary(syncResult, filename);
        const finalSummary = `${importSummary}\n\n${syncSummary}`;

        // Update report with final results
        const updatedReport = await prisma.report.update({
          where: { id: report.id },
          data: {
            importStatus: 'completed',
            importErrors: [...importResult.errors, ...syncResult.errors],
            totalListings,
            newListings: syncResult.stats.newCount,
            updatedListings: syncResult.stats.updatedCount,
            removedListings: syncResult.stats.removedCount,
            averagePrice: Math.round(averagePrice),
            medianPrice: Math.round(medianPrice),
            lowestPrice: Math.round(lowestPrice),
            highestPrice: Math.round(highestPrice),
            summary: finalSummary,
            details: {
              importSummary,
              syncSummary,
              importResult,
              syncResult,
              filename,
              fileType,
              markOthersInactive,
            },
            listings: [...syncResult.newApartments, ...syncResult.updatedApartments],
          },
        });

        logger.info(`Import completed for ${filename}: ${syncResult.stats.newCount} new, ${syncResult.stats.updatedCount} updated`);

        res.status(201).json({
          report: {
            ...updatedReport,
            averagePrice: updatedReport.averagePrice / 100,
            medianPrice: updatedReport.medianPrice / 100,
            lowestPrice: updatedReport.lowestPrice / 100,
            highestPrice: updatedReport.highestPrice / 100,
          },
          importResult,
          syncResult,
          summary: finalSummary,
        });

      } catch (error) {
        // Update report with error status
        await prisma.report.update({
          where: { id: report.id },
          data: {
            importStatus: 'failed',
            importErrors: [{ error: error instanceof Error ? error.message : 'Unknown error' }],
            summary: `Import failed for ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        });

        throw error;
      }

    } catch (error) {
      logger.error('Error importing daily report:', error);
      res.status(500).json({ 
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get import status for a report
  async getImportStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const report = await prisma.report.findUnique({
        where: { id },
        select: {
          id: true,
          filename: true,
          importStatus: true,
          importErrors: true,
          summary: true,
          details: true,
          newListings: true,
          updatedListings: true,
          removedListings: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.json(report);
    } catch (error) {
      logger.error('Error fetching import status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Process daily report manually (for automated systems)
  async processDailyReportData(req: Request, res: Response) {
    try {
      const { apartments, source = 'api', markInactive = false } = req.body;

      if (!Array.isArray(apartments) || apartments.length === 0) {
        return res.status(400).json({ error: 'Invalid apartments data' });
      }

      logger.info(`Processing ${apartments.length} apartments from ${source}`);

      // Create report record
      const report = await prisma.report.create({
        data: {
          date: new Date(),
          type: 'imported',
          source,
          importStatus: 'processing',
          summary: `Processing ${apartments.length} apartments from ${source}...`,
        },
      });

      try {
        // Validate apartments data
        const importResult = await ReportImportUtils.parseJSON(JSON.stringify(apartments));

        if (importResult.valid.length === 0) {
          await prisma.report.update({
            where: { id: report.id },
            data: {
              importStatus: 'failed',
              importErrors: importResult.errors,
              summary: `Processing failed: No valid records from ${source}`,
            },
          });

          return res.status(400).json({
            error: 'No valid records found',
            errors: importResult.errors,
          });
        }

        // Sync with database
        const syncResult = await DatabaseSyncService.syncApartments(
          importResult.valid,
          report.id,
          markInactive
        );

        // Send notifications
        await DatabaseSyncService.sendNoFeeNotifications(
          syncResult.newApartments,
          report.id
        );

        // Update report
        const summary = DatabaseSyncService.generateSyncSummary(syncResult, source);
        await prisma.report.update({
          where: { id: report.id },
          data: {
            importStatus: 'completed',
            importErrors: syncResult.errors,
            newListings: syncResult.stats.newCount,
            updatedListings: syncResult.stats.updatedCount,
            removedListings: syncResult.stats.removedCount,
            summary,
            details: { syncResult, source },
            listings: [...syncResult.newApartments, ...syncResult.updatedApartments],
          },
        });

        logger.info(`Processing completed for ${source}: ${syncResult.stats.newCount} new, ${syncResult.stats.updatedCount} updated`);

        res.status(200).json({
          reportId: report.id,
          syncResult,
          summary,
        });

      } catch (error) {
        await prisma.report.update({
          where: { id: report.id },
          data: {
            importStatus: 'failed',
            importErrors: [{ error: error instanceof Error ? error.message : 'Unknown error' }],
            summary: `Processing failed for ${source}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        });

        throw error;
      }

    } catch (error) {
      logger.error('Error processing daily report data:', error);
      res.status(500).json({ 
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new ReportsController();