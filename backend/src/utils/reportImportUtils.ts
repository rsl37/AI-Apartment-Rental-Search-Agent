import csv from 'csv-parser';
import { Readable } from 'stream';
import Joi from 'joi';
import logger from '../config/logger';

// Schema for validating apartment data from external reports
export const apartmentImportSchema = Joi.object({
  externalId: Joi.string().required(),
  source: Joi.string().valid('streeteasy', 'zillow', 'apartments', 'other').required(),
  url: Joi.string().uri().required(),
  title: Joi.string().required(),
  address: Joi.string().required(),
  neighborhood: Joi.string().allow('', null),
  borough: Joi.string().default('Manhattan'),
  latitude: Joi.number().allow(null),
  longitude: Joi.number().allow(null),
  
  // Pricing (convert to cents for storage)
  price: Joi.number().min(0).required(),
  brokerFee: Joi.number().min(0).allow(null),
  securityDeposit: Joi.number().min(0).allow(null),
  isNoFee: Joi.boolean().default(false),
  
  // Property details
  bedrooms: Joi.number().integer().min(0).default(0),
  bathrooms: Joi.number().integer().min(1).default(1),
  sqft: Joi.number().integer().min(0).allow(null),
  floor: Joi.string().allow('', null),
  totalFloors: Joi.string().allow('', null),
  
  // Amenities
  isDoorman: Joi.boolean().default(false),
  hasConcierge: Joi.boolean().default(false),
  hasAC: Joi.boolean().default(false),
  hasDishwasher: Joi.boolean().default(false),
  hasElevator: Joi.boolean().default(false),
  hasLaundryUnit: Joi.boolean().default(false),
  hasLaundryBuilding: Joi.boolean().default(false),
  isCatFriendly: Joi.boolean().default(false),
  
  // Availability
  availableFrom: Joi.date().allow(null),
  availableTo: Joi.date().allow(null),
  
  // Health/Safety flags
  hasAsbestos: Joi.boolean().default(false),
  hasLeadPaint: Joi.boolean().default(false),
  hasBedbugs: Joi.boolean().default(false),
  hasMold: Joi.boolean().default(false),
  
  // Contact info
  contactName: Joi.string().allow('', null),
  contactPhone: Joi.string().allow('', null),
  contactEmail: Joi.string().email().allow('', null),
  
  // Metadata
  description: Joi.string().allow('', null),
  images: Joi.array().items(Joi.string().uri()).default([]),
  features: Joi.array().items(Joi.string()).default([]),
  
  // Optional fields for external imports
  lastUpdated: Joi.date().default(() => new Date()),
});

export interface ApartmentImportData {
  externalId: string;
  source: string;
  url: string;
  title: string;
  address: string;
  neighborhood?: string;
  borough: string;
  latitude?: number;
  longitude?: number;
  price: number; // In dollars (will be converted to cents)
  brokerFee?: number;
  securityDeposit?: number;
  isNoFee: boolean;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  floor?: string;
  totalFloors?: string;
  isDoorman: boolean;
  hasConcierge: boolean;
  hasAC: boolean;
  hasDishwasher: boolean;
  hasElevator: boolean;
  hasLaundryUnit: boolean;
  hasLaundryBuilding: boolean;
  isCatFriendly: boolean;
  availableFrom?: Date;
  availableTo?: Date;
  hasAsbestos: boolean;
  hasLeadPaint: boolean;
  hasBedbugs: boolean;
  hasMold: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  images: string[];
  features: string[];
  lastUpdated?: Date;
}

export interface ImportValidationResult {
  valid: ApartmentImportData[];
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

export class ReportImportUtils {
  /**
   * Parse CSV data into apartment objects
   */
  static async parseCSV(csvData: string): Promise<ImportValidationResult> {
    return new Promise((resolve, reject) => {
      const valid: ApartmentImportData[] = [];
      const errors: Array<{ row: number; data: any; error: string }> = [];
      let rowNumber = 0;

      const stream = Readable.from([csvData]);
      
      stream
        .pipe(csv())
        .on('data', (row: any) => {
          rowNumber++;
          try {
            const validatedData = this.validateAndTransformData(row);
            valid.push(validatedData);
          } catch (error) {
            errors.push({
              row: rowNumber,
              data: row,
              error: error instanceof Error ? error.message : 'Unknown validation error'
            });
          }
        })
        .on('end', () => {
          resolve({ valid, errors });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Parse JSON data into apartment objects
   */
  static async parseJSON(jsonData: string): Promise<ImportValidationResult> {
    try {
      const data = JSON.parse(jsonData);
      const apartments = Array.isArray(data) ? data : [data];
      
      const valid: ApartmentImportData[] = [];
      const errors: Array<{ row: number; data: any; error: string }> = [];

      apartments.forEach((apartment, index) => {
        try {
          const validatedData = this.validateAndTransformData(apartment);
          valid.push(validatedData);
        } catch (error) {
          errors.push({
            row: index + 1,
            data: apartment,
            error: error instanceof Error ? error.message : 'Unknown validation error'
          });
        }
      });

      return { valid, errors };
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and transform apartment data according to schema
   */
  private static validateAndTransformData(data: any): ApartmentImportData {
    // Convert string fields to appropriate types
    const transformedData = {
      ...data,
      price: this.parseNumber(data.price),
      brokerFee: data.brokerFee ? this.parseNumber(data.brokerFee) : null,
      securityDeposit: data.securityDeposit ? this.parseNumber(data.securityDeposit) : null,
      isNoFee: this.parseBoolean(data.isNoFee) || this.parseBoolean(data.no_fee) || this.parseBoolean(data.noFee),
      bedrooms: this.parseNumber(data.bedrooms) || 0,
      bathrooms: this.parseNumber(data.bathrooms) || 1,
      sqft: data.sqft ? this.parseNumber(data.sqft) : null,
      latitude: data.latitude ? this.parseNumber(data.latitude) : null,
      longitude: data.longitude ? this.parseNumber(data.longitude) : null,
      
      // Amenities - handle various boolean formats
      isDoorman: this.parseBoolean(data.isDoorman) || this.parseBoolean(data.doorman),
      hasConcierge: this.parseBoolean(data.hasConcierge) || this.parseBoolean(data.concierge),
      hasAC: this.parseBoolean(data.hasAC) || this.parseBoolean(data.ac) || this.parseBoolean(data.air_conditioning),
      hasDishwasher: this.parseBoolean(data.hasDishwasher) || this.parseBoolean(data.dishwasher),
      hasElevator: this.parseBoolean(data.hasElevator) || this.parseBoolean(data.elevator),
      hasLaundryUnit: this.parseBoolean(data.hasLaundryUnit) || this.parseBoolean(data.laundry_unit),
      hasLaundryBuilding: this.parseBoolean(data.hasLaundryBuilding) || this.parseBoolean(data.laundry_building),
      isCatFriendly: this.parseBoolean(data.isCatFriendly) || this.parseBoolean(data.cat_friendly) || this.parseBoolean(data.pets_allowed),
      
      // Health/Safety
      hasAsbestos: this.parseBoolean(data.hasAsbestos) || this.parseBoolean(data.asbestos),
      hasLeadPaint: this.parseBoolean(data.hasLeadPaint) || this.parseBoolean(data.lead_paint),
      hasBedbugs: this.parseBoolean(data.hasBedbugs) || this.parseBoolean(data.bedbugs),
      hasMold: this.parseBoolean(data.hasMold) || this.parseBoolean(data.mold),
      
      // Handle date fields
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
      availableTo: data.availableTo ? new Date(data.availableTo) : null,
      
      // Handle arrays
      images: this.parseArray(data.images),
      features: this.parseArray(data.features),
    };

    // Validate against schema
    const { error, value } = apartmentImportSchema.validate(transformedData, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      throw new Error(`Validation failed: ${error.details.map(d => d.message).join(', ')}`);
    }

    // Convert price fields to cents for database storage
    const result = {
      ...value,
      price: Math.round(value.price * 100),
      brokerFee: value.brokerFee ? Math.round(value.brokerFee * 100) : null,
      securityDeposit: value.securityDeposit ? Math.round(value.securityDeposit * 100) : null,
    };

    return result;
  }

  /**
   * Parse number from various string formats
   */
  private static parseNumber(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove currency symbols and commas
      const cleaned = value.replace(/[$,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  /**
   * Parse boolean from various string formats
   */
  private static parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return ['true', 'yes', '1', 'y', 'on'].includes(lower);
    }
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  /**
   * Parse array from string or return existing array
   */
  private static parseArray(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // Try splitting by comma
        return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    return [];
  }

  /**
   * Generate import summary
   */
  static generateImportSummary(
    result: ImportValidationResult, 
    filename: string,
    importType: 'csv' | 'json'
  ): string {
    const totalRows = result.valid.length + result.errors.length;
    const successRate = totalRows > 0 ? Math.round((result.valid.length / totalRows) * 100) : 0;
    
    return `Import Summary for ${filename}:
- Format: ${importType.toUpperCase()}
- Total records: ${totalRows}
- Successfully parsed: ${result.valid.length}
- Errors: ${result.errors.length}
- Success rate: ${successRate}%
${result.errors.length > 0 ? `\nFirst few errors:\n${result.errors.slice(0, 3).map(e => `Row ${e.row}: ${e.error}`).join('\n')}` : ''}`;
  }
}

export default ReportImportUtils;