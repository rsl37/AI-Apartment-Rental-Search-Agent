import { PrismaClient } from '@prisma/client';
import { ApartmentImportData } from '../utils/reportImportUtils';
import logger from '../config/logger';
import { sendSMS } from '../utils/smsUtils';

const prisma = new PrismaClient();

export interface SyncResult {
  newApartments: string[];
  updatedApartments: string[];
  removedApartments: string[];
  errors: Array<{
    externalId: string;
    error: string;
  }>;
  stats: {
    totalProcessed: number;
    newCount: number;
    updatedCount: number;
    removedCount: number;
    errorCount: number;
  };
}

export class DatabaseSyncService {
  /**
   * Synchronize apartment data with database
   */
  static async syncApartments(
    apartments: ApartmentImportData[],
    reportId: string,
    markOthersInactive = false
  ): Promise<SyncResult> {
    const result: SyncResult = {
      newApartments: [],
      updatedApartments: [],
      removedApartments: [],
      errors: [],
      stats: {
        totalProcessed: apartments.length,
        newCount: 0,
        updatedCount: 0,
        removedCount: 0,
        errorCount: 0,
      },
    };

    logger.info(`Starting sync of ${apartments.length} apartments for report ${reportId}`);

    // Process each apartment
    for (const apartmentData of apartments) {
      try {
        await this.syncSingleApartment(apartmentData, result);
      } catch (error) {
        logger.error(`Error syncing apartment ${apartmentData.externalId}:`, error);
        result.errors.push({
          externalId: apartmentData.externalId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        result.stats.errorCount++;
      }
    }

    // Mark apartments not in this report as inactive if requested
    if (markOthersInactive) {
      const processedExternalIds = apartments.map(apt => apt.externalId);
      const removed = await this.markInactiveApartments(processedExternalIds);
      result.removedApartments = removed;
      result.stats.removedCount = removed.length;
    }

    // Update statistics
    result.stats.newCount = result.newApartments.length;
    result.stats.updatedCount = result.updatedApartments.length;

    logger.info(`Sync completed: ${result.stats.newCount} new, ${result.stats.updatedCount} updated, ${result.stats.removedCount} removed, ${result.stats.errorCount} errors`);

    return result;
  }

  /**
   * Sync a single apartment with the database
   */
  private static async syncSingleApartment(
    apartmentData: ApartmentImportData,
    result: SyncResult
  ): Promise<void> {
    // Check if apartment already exists
    const existingApartment = await prisma.apartment.findUnique({
      where: { externalId: apartmentData.externalId },
    });

    const apartmentForDb = {
      ...apartmentData,
      lastScraped: new Date(),
      isActive: true,
      isArchived: false,
    };

    if (existingApartment) {
      // Check if apartment has meaningful changes
      if (this.hasSignificantChanges(existingApartment, apartmentForDb)) {
        const updatedApartment = await prisma.apartment.update({
          where: { id: existingApartment.id },
          data: apartmentForDb,
        });
        result.updatedApartments.push(updatedApartment.id);
        logger.debug(`Updated apartment ${apartmentData.externalId}`);
      } else {
        // Just update the lastScraped timestamp
        await prisma.apartment.update({
          where: { id: existingApartment.id },
          data: { 
            lastScraped: new Date(),
            isActive: true, // Ensure it's marked as active
          },
        });
        logger.debug(`No changes for apartment ${apartmentData.externalId}, updated timestamp only`);
      }
    } else {
      // Create new apartment
      const newApartment = await prisma.apartment.create({
        data: apartmentForDb,
      });
      result.newApartments.push(newApartment.id);
      logger.debug(`Created new apartment ${apartmentData.externalId}`);
    }
  }

  /**
   * Check if apartment has significant changes that warrant an update
   */
  private static hasSignificantChanges(existing: any, incoming: any): boolean {
    const significantFields = [
      'price', 'brokerFee', 'securityDeposit', 'isNoFee',
      'title', 'address', 'neighborhood', 
      'bedrooms', 'bathrooms', 'sqft',
      'availableFrom', 'availableTo',
      'isDoorman', 'hasConcierge', 'hasAC', 'hasDishwasher', 
      'hasElevator', 'hasLaundryUnit', 'hasLaundryBuilding', 'isCatFriendly',
      'hasAsbestos', 'hasLeadPaint', 'hasBedbugs', 'hasMold',
      'contactName', 'contactPhone', 'contactEmail',
      'description'
    ];

    for (const field of significantFields) {
      const existingValue = existing[field];
      const incomingValue = incoming[field];
      
      // Handle null/undefined comparisons
      if (existingValue !== incomingValue) {
        // Special handling for dates
        if (field.includes('available') && existingValue && incomingValue) {
          const existingDate = new Date(existingValue).getTime();
          const incomingDate = new Date(incomingValue).getTime();
          if (existingDate !== incomingDate) {
            logger.debug(`Field ${field} changed: ${existingValue} -> ${incomingValue}`);
            return true;
          }
        } else if (existingValue !== incomingValue) {
          logger.debug(`Field ${field} changed: ${existingValue} -> ${incomingValue}`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Mark apartments not in the current list as inactive
   */
  private static async markInactiveApartments(
    activeExternalIds: string[]
  ): Promise<string[]> {
    if (activeExternalIds.length === 0) {
      return [];
    }

    const inactiveApartments = await prisma.apartment.findMany({
      where: {
        AND: [
          { isActive: true },
          { externalId: { notIn: activeExternalIds } },
          // Only mark as inactive if not scraped recently (within last 7 days)
          { lastScraped: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
      select: { id: true, externalId: true },
    });

    if (inactiveApartments.length > 0) {
      await prisma.apartment.updateMany({
        where: {
          id: { in: inactiveApartments.map(apt => apt.id) },
        },
        data: {
          isActive: false,
        },
      });

      logger.info(`Marked ${inactiveApartments.length} apartments as inactive`);
    }

    return inactiveApartments.map(apt => apt.id);
  }

  /**
   * Send notifications for new no-fee apartments
   */
  static async sendNoFeeNotifications(
    newApartmentIds: string[],
    reportId: string
  ): Promise<void> {
    if (newApartmentIds.length === 0) {
      return;
    }

    try {
      // Get new no-fee apartments
      const noFeeApartments = await prisma.apartment.findMany({
        where: {
          AND: [
            { id: { in: newApartmentIds } },
            { isNoFee: true },
            { isActive: true },
          ],
        },
        select: {
          id: true,
          title: true,
          address: true,
          neighborhood: true,
          price: true,
          bedrooms: true,
          url: true,
        },
      });

      if (noFeeApartments.length === 0) {
        logger.info('No new no-fee apartments found for notifications');
        return;
      }

      // Get verified users with SMS notifications enabled
      const users = await prisma.user.findMany({
        where: { isVerified: true },
      });

      const usersWithSMSEnabled = users.filter(user => {
        const alertPrefs = user.alertPrefs as any;
        return alertPrefs?.enableSMS !== false && alertPrefs?.noFeeAlerts !== false;
      });

      if (usersWithSMSEnabled.length === 0) {
        logger.info('No users with no-fee SMS notifications enabled');
        return;
      }

      // Create notification message
      const apartmentSummary = noFeeApartments.slice(0, 3).map(apt => 
        `${apt.bedrooms === 0 ? 'Studio' : `${apt.bedrooms}BR`} in ${apt.neighborhood || 'Manhattan'} - $${Math.round(apt.price / 100)}`
      ).join(', ');

      const moreText = noFeeApartments.length > 3 ? ` and ${noFeeApartments.length - 3} more` : '';
      const message = `🏠 NEW NO-FEE APARTMENTS: ${apartmentSummary}${moreText}. Check your dashboard for details!`;

      // Send notifications
      for (const user of usersWithSMSEnabled) {
        try {
          const smsSent = await sendSMS(user.phoneNumber, message);
          
          // Log notification
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'sms',
              title: 'New No-Fee Apartments Alert',
              message,
              payload: {
                reportId,
                noFeeApartments: noFeeApartments.map(apt => apt.id),
                count: noFeeApartments.length,
              },
              status: smsSent ? 'sent' : 'failed',
              sentAt: smsSent ? new Date() : null,
              errorMessage: smsSent ? null : 'SMS delivery failed',
            },
          });
        } catch (error) {
          logger.error(`Failed to send no-fee notification to user ${user.id}:`, error);
        }
      }

      logger.info(`No-fee notifications sent to ${usersWithSMSEnabled.length} users for ${noFeeApartments.length} apartments`);
    } catch (error) {
      logger.error('Failed to send no-fee notifications:', error);
    }
  }

  /**
   * Generate detailed sync summary
   */
  static generateSyncSummary(result: SyncResult, reportSource: string): string {
    const { stats } = result;
    const totalProcessed = stats.totalProcessed;
    const successRate = totalProcessed > 0 
      ? Math.round(((stats.newCount + stats.updatedCount) / totalProcessed) * 100) 
      : 0;

    return `Database Sync Summary (${reportSource}):
- Total processed: ${totalProcessed}
- New apartments: ${stats.newCount}
- Updated apartments: ${stats.updatedCount}
- Removed/inactive: ${stats.removedCount}
- Errors: ${stats.errorCount}
- Success rate: ${successRate}%
${result.errors.length > 0 ? `\nFirst few errors:\n${result.errors.slice(0, 3).map(e => `${e.externalId}: ${e.error}`).join('\n')}` : ''}`;
  }
}

export default DatabaseSyncService;