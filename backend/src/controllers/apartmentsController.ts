import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApartmentFilter, ApartmentCreateInput, ApartmentUpdateInput, ApartmentSortOptions, PaginationOptions } from '../models/Apartment';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class ApartmentsController {
  // Get all apartments with filtering, sorting, and pagination
  async getApartments(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        minSqft,
        neighborhoods,
        borough = 'Manhattan',
        isDoorman,
        hasConcierge,
        hasAC,
        hasDishwasher,
        hasElevator,
        hasLaundryUnit,
        hasLaundryBuilding,
        isCatFriendly,
        availableFrom,
        availableTo,
        excludeHealthIssues,
        search
      } = req.query;

      const filters: any = {
        isActive: true,
        isArchived: false,
      };

      // Apply price filters
      if (minPrice) filters.price = { ...filters.price, gte: parseInt(minPrice as string, 10) * 100 };
      if (maxPrice) filters.price = { ...filters.price, lte: parseInt(maxPrice as string, 10) * 100 };

      // Apply property filters
      if (bedrooms) {
        const bedroomArray = Array.isArray(bedrooms) ? bedrooms : [bedrooms];
        filters.bedrooms = { in: bedroomArray.map(b => parseInt(b as string, 10)) };
      }
      if (bathrooms) filters.bathrooms = { gte: parseInt(bathrooms as string, 10) };
      if (minSqft) filters.sqft = { gte: parseInt(minSqft as string, 10) };

      // Apply location filters
      if (borough) filters.borough = borough;
      if (neighborhoods) {
        const neighborhoodArray = Array.isArray(neighborhoods) ? neighborhoods : [neighborhoods];
        filters.neighborhood = { in: neighborhoodArray };
      }

      // Apply amenity filters
      if (isDoorman === 'true') filters.isDoorman = true;
      if (hasConcierge === 'true') filters.hasConcierge = true;
      if (hasAC === 'true') filters.hasAC = true;
      if (hasDishwasher === 'true') filters.hasDishwasher = true;
      if (hasElevator === 'true') filters.hasElevator = true;
      if (hasLaundryUnit === 'true') filters.hasLaundryUnit = true;
      if (hasLaundryBuilding === 'true') filters.hasLaundryBuilding = true;
      if (isCatFriendly === 'true') filters.isCatFriendly = true;

      // Apply availability filters
      if (availableFrom) filters.availableFrom = { gte: new Date(availableFrom as string) };
      if (availableTo) filters.availableTo = { lte: new Date(availableTo as string) };

      // Exclude health issues
      if (excludeHealthIssues === 'true') {
        filters.hasAsbestos = false;
        filters.hasLeadPaint = false;
        filters.hasBedbugs = false;
        filters.hasMold = false;
      }

      // Apply search filter
      if (search) {
        filters.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { address: { contains: search as string, mode: 'insensitive' } },
          { neighborhood: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [apartments, total] = await Promise.all([
        prisma.apartment.findMany({
          where: filters,
          skip,
          take,
          orderBy: { [sortBy as string]: sortOrder },
        }),
        prisma.apartment.count({ where: filters }),
      ]);

      const totalPages = Math.ceil(total / take);

      res.json({
        apartments: apartments.map(apt => ({
          ...apt,
          price: apt.price / 100, // Convert from cents to dollars
          brokerFee: apt.brokerFee ? apt.brokerFee / 100 : null,
          securityDeposit: apt.securityDeposit ? apt.securityDeposit / 100 : null,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          totalPages,
        },
      });
    } catch (error) {
      logger.error('Error fetching apartments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get single apartment by ID
  async getApartment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const apartment = await prisma.apartment.findUnique({
        where: { id },
        include: {
          searchLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          savedApartments: {
            include: { user: true },
          },
        },
      });

      if (!apartment) {
        return res.status(404).json({ error: 'Apartment not found' });
      }

      res.json({
        ...apartment,
        price: apartment.price / 100,
        brokerFee: apartment.brokerFee ? apartment.brokerFee / 100 : null,
        securityDeposit: apartment.securityDeposit ? apartment.securityDeposit / 100 : null,
      });
    } catch (error) {
      logger.error('Error fetching apartment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create new apartment
  async createApartment(req: Request, res: Response) {
    try {
      const data: ApartmentCreateInput = req.body;

      // Convert price from dollars to cents
      const apartmentData = {
        ...data,
        price: data.price * 100,
        brokerFee: data.brokerFee ? data.brokerFee * 100 : null,
        securityDeposit: data.securityDeposit ? data.securityDeposit * 100 : null,
      };

      const apartment = await prisma.apartment.create({
        data: apartmentData,
      });

      res.status(201).json({
        ...apartment,
        price: apartment.price / 100,
        brokerFee: apartment.brokerFee ? apartment.brokerFee / 100 : null,
        securityDeposit: apartment.securityDeposit ? apartment.securityDeposit / 100 : null,
      });
    } catch (error) {
      logger.error('Error creating apartment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update apartment
  async updateApartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: ApartmentUpdateInput = req.body;

      // Convert price from dollars to cents if provided
      const updateData: any = { ...data };
      if (data.price) updateData.price = data.price * 100;
      if (data.brokerFee) updateData.brokerFee = data.brokerFee * 100;
      if (data.securityDeposit) updateData.securityDeposit = data.securityDeposit * 100;

      const apartment = await prisma.apartment.update({
        where: { id },
        data: updateData,
      });

      res.json({
        ...apartment,
        price: apartment.price / 100,
        brokerFee: apartment.brokerFee ? apartment.brokerFee / 100 : null,
        securityDeposit: apartment.securityDeposit ? apartment.securityDeposit / 100 : null,
      });
    } catch (error) {
      logger.error('Error updating apartment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete apartment (soft delete)
  async deleteApartment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.apartment.update({
        where: { id },
        data: { isActive: false, isArchived: true },
      });

      res.json({ message: 'Apartment deleted successfully' });
    } catch (error) {
      logger.error('Error deleting apartment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Export apartments to CSV
  async exportCSV(req: Request, res: Response) {
    try {
      const apartments = await prisma.apartment.findMany({
        where: { isActive: true, isArchived: false },
        orderBy: { createdAt: 'desc' },
      });

      const csvHeaders = [
        'ID', 'Title', 'Address', 'Neighborhood', 'Price', 'Bedrooms', 'Bathrooms', 'Sqft',
        'Doorman', 'AC', 'Dishwasher', 'Elevator', 'Laundry', 'Cat Friendly',
        'Available From', 'Source', 'URL', 'Created At'
      ];

      const csvData = apartments.map(apt => [
        apt.id,
        apt.title,
        apt.address,
        apt.neighborhood || '',
        apt.price / 100,
        apt.bedrooms,
        apt.bathrooms,
        apt.sqft || '',
        apt.isDoorman ? 'Yes' : 'No',
        apt.hasAC ? 'Yes' : 'No',
        apt.hasDishwasher ? 'Yes' : 'No',
        apt.hasElevator ? 'Yes' : 'No',
        apt.hasLaundryUnit ? 'In-Unit' : apt.hasLaundryBuilding ? 'In-Building' : 'No',
        apt.isCatFriendly ? 'Yes' : 'No',
        apt.availableFrom ? apt.availableFrom.toISOString().split('T')[0] : '',
        apt.source,
        apt.url,
        apt.createdAt.toISOString().split('T')[0]
      ]);

      const csv = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="apartments.csv"');
      res.send(csv);
    } catch (error) {
      logger.error('Error exporting CSV:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new ApartmentsController();