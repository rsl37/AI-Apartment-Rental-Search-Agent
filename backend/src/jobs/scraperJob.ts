import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import apartmentScraper from '../utils/scraperUtils';
import { sendSMS } from '../utils/smsUtils';
import logger from '../config/logger';
import { config } from '../config/env';

const prisma = new PrismaClient();

export class ScraperJob {
  private isRunning = false;

  // Start the cron job
  start() {
    logger.info(`Starting scraper job with schedule: ${config.scraper.schedule}`);
    
    cron.schedule(config.scraper.schedule, async () => {
      if (this.isRunning) {
        logger.warn('Scraper job is already running, skipping...');
        return;
      }

      await this.runScraper();
    }, {
      timezone: config.scraper.timezone,
    });

    logger.info('Scraper job scheduled successfully');
  }

  // Run scraper manually
  async runScraper(): Promise<void> {
    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      logger.info('Starting apartment scraping job...');

      // Run scrapers for all sources
      const results = await apartmentScraper.scrapeAll();
      
      let totalNewApartments = 0;
      let totalUpdatedApartments = 0;
      const newApartmentIds: string[] = [];
      const updatedApartmentIds: string[] = [];

      // Process results from each source
      for (const result of results) {
        if (result.success) {
          logger.info(`${result.source}: Found ${result.apartments.length} apartments`);

          for (const apartmentData of result.apartments) {
            try {
              // Check if apartment already exists
              const existingApartment = await prisma.apartment.findUnique({
                where: { externalId: apartmentData.externalId },
              });

              if (existingApartment) {
                // Update existing apartment
                const updatedApartment = await prisma.apartment.update({
                  where: { id: existingApartment.id },
                  data: {
                    ...apartmentData,
                    lastScraped: new Date(),
                    isActive: true,
                  },
                });
                totalUpdatedApartments++;
                updatedApartmentIds.push(updatedApartment.id);
              } else {
                // Create new apartment
                const newApartment = await prisma.apartment.create({
                  data: {
                    ...apartmentData,
                    lastScraped: new Date(),
                    isActive: true,
                  },
                });
                totalNewApartments++;
                newApartmentIds.push(newApartment.id);
              }

              // Log search activity
              await prisma.searchLog.create({
                data: {
                  apartmentId: existingApartment?.id || newApartmentIds[newApartmentIds.length - 1],
                  source: result.source,
                  searchQuery: 'daily_scrape',
                  filters: {
                    priceRange: '2000-4500',
                    bedrooms: '0-1',
                    location: 'Manhattan below 80th St',
                    amenities: ['doorman', 'ac', 'dishwasher', 'elevator', 'laundry', 'cat_friendly'],
                  },
                  resultCount: result.apartments.length,
                  duration: Date.now() - startTime,
                  success: true,
                },
              });
            } catch (error) {
              logger.error(`Error processing apartment ${apartmentData.externalId}:`, error);
            }
          }
        } else {
          logger.error(`${result.source} scraping failed: ${result.error}`);
        }
      }

      // Generate daily report
      await this.generateDailyReport(totalNewApartments, totalUpdatedApartments, newApartmentIds, updatedApartmentIds);

      // Send notifications to verified users
      if (totalNewApartments > 0 || totalUpdatedApartments > 0) {
        await this.sendNotifications(totalNewApartments, totalUpdatedApartments);
      }

      const duration = Date.now() - startTime;
      logger.info(`Scraper job completed successfully in ${duration}ms. New: ${totalNewApartments}, Updated: ${totalUpdatedApartments}`);

    } catch (error) {
      logger.error('Scraper job failed:', error);
      
      // Log failed search
      await prisma.searchLog.create({
        data: {
          apartmentId: '', // No specific apartment
          source: 'all',
          searchQuery: 'daily_scrape',
          filters: {},
          resultCount: 0,
          duration: Date.now() - startTime,
          success: false,
          errorMessage: error.message,
        },
      });
    } finally {
      this.isRunning = false;
    }
  }

  private async generateDailyReport(
    newListings: number,
    updatedListings: number,
    newApartmentIds: readonly string[],
    updatedApartmentIds: readonly string[]
  ): Promise<void> {
    try {
      // Get total active apartments
      const totalListings = await prisma.apartment.count({
        where: { isActive: true },
      });

      // Calculate price statistics
      const apartments = await prisma.apartment.findMany({
        where: { isActive: true },
        select: { price: true },
      });

      const prices = apartments.map(apt => apt.price);
      const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const sortedPrices = prices.sort((a, b) => a - b);
      const medianPrice = sortedPrices.length > 0 
        ? sortedPrices[Math.floor(sortedPrices.length / 2)] 
        : 0;
      const lowestPrice = sortedPrices.length > 0 ? sortedPrices[0] : 0;
      const highestPrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1] : 0;

      const today = new Date();
      const summary = `Daily scraping report for ${today.toDateString()}: Found ${newListings} new listings and updated ${updatedListings} existing listings.`;

      await prisma.report.create({
        data: {
          date: today,
          type: 'daily',
          totalListings,
          newListings,
          updatedListings,
          removedListings: 0, // TODO: Track removals
          averagePrice: Math.round(averagePrice),
          medianPrice: Math.round(medianPrice),
          lowestPrice: Math.round(lowestPrice),
          highestPrice: Math.round(highestPrice),
          summary,
          details: {
            scrapingSources: ['streeteasy', 'zillow', 'apartments'],
            newApartments: newApartmentIds,
            updatedApartments: updatedApartmentIds,
            priceRange: {
              min: lowestPrice / 100,
              max: highestPrice / 100,
              avg: averagePrice / 100,
            },
          },
          listings: [...newApartmentIds, ...updatedApartmentIds],
        },
      });

      logger.info('Daily report generated successfully');
    } catch (error) {
      logger.error('Failed to generate daily report:', error);
    }
  }

  private async sendNotifications(newListings: number, updatedListings: number): Promise<void> {
    try {
      // Get all verified users with SMS notifications enabled
      const users = await prisma.user.findMany({
        where: {
          isVerified: true,
        },
      });

      const usersWithSMSEnabled = users.filter(user => {
        const alertPrefs = user.alertPrefs as any;
        return alertPrefs?.enableSMS !== false && alertPrefs?.dailyDigest !== false;
      });

      if (usersWithSMSEnabled.length === 0) {
        logger.info('No users with SMS notifications enabled');
        return;
      }

      const message = `AI Apartment Rental Agent Daily Update: ${newListings} new listings and ${updatedListings} updated listings found today. Visit your dashboard for details.`;

      // Send SMS to all eligible users
      for (const user of usersWithSMSEnabled) {
        try {
          const smsSent = await sendSMS(user.phoneNumber, message);
          
          // Log notification
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'sms',
              title: 'Daily Apartment Update',
              message,
              payload: {
                newListings,
                updatedListings,
                reportType: 'daily',
              },
              status: smsSent ? 'sent' : 'failed',
              sentAt: smsSent ? new Date() : null,
              errorMessage: smsSent ? null : 'SMS delivery failed',
            },
          });
        } catch (error) {
          logger.error(`Failed to send notification to user ${user.id}:`, error);
        }
      }

      logger.info(`Daily notifications sent to ${usersWithSMSEnabled.length} users`);
    } catch (error) {
      logger.error('Failed to send notifications:', error);
    }
  }

  // Check if scraper is currently running
  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }
}

export default new ScraperJob();