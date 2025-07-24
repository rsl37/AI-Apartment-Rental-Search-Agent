import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportCreateInput } from '../models/Report';
import logger from '../config/logger';

const prisma = new PrismaClient();

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
}

export default new ReportsController();