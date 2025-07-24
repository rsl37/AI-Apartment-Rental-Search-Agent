import ReportImportUtils from '../utils/reportImportUtils';

// Mock logger to avoid dependencies
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

describe('Daily Report Import Features', () => {
  describe('ReportImportUtils', () => {
    test('should validate and parse valid apartment data', () => {
      const validApartmentData = {
        externalId: 'test-123',
        source: 'streeteasy',
        url: 'https://streeteasy.com/test-123',
        title: 'Beautiful Studio Apartment',
        address: '123 Main St, New York, NY',
        neighborhood: 'East Village',
        price: 3000, // $3000
        bedrooms: 0,
        bathrooms: 1,
        isNoFee: true,
        isDoorman: true,
        hasAC: true,
        isCatFriendly: true,
      };

      const result = ReportImportUtils['validateAndTransformData'](validApartmentData);
      
      expect(result.externalId).toBe('test-123');
      expect(result.price).toBe(300000); // Should be converted to cents
      expect(result.isNoFee).toBe(true);
      expect(result.bedrooms).toBe(0);
      expect(result.isDoorman).toBe(true);
    });

    test('should handle CSV parsing', async () => {
      const csvData = `externalId,source,url,title,address,price,bedrooms,isNoFee,isDoorman
test-1,streeteasy,https://streeteasy.com/1,Studio Apt,123 Main St,2500,0,true,false
test-2,zillow,https://zillow.com/2,1BR Apt,456 Oak Ave,3200,1,false,true`;

      const result = await ReportImportUtils.parseCSV(csvData);
      
      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.valid[0].externalId).toBe('test-1');
      expect(result.valid[0].price).toBe(250000); // $2500 in cents
      expect(result.valid[0].isNoFee).toBe(true);
      expect(result.valid[1].bedrooms).toBe(1);
    });

    test('should handle JSON parsing', async () => {
      const jsonData = JSON.stringify([
        {
          externalId: 'test-json-1',
          source: 'apartments',
          url: 'https://apartments.com/1',
          title: 'Luxury Studio',
          address: '789 Park Ave',
          price: 4000,
          bedrooms: 0,
          isNoFee: true,
          isDoorman: true,
        }
      ]);

      const result = await ReportImportUtils.parseJSON(jsonData);
      
      expect(result.valid).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.valid[0].externalId).toBe('test-json-1');
      expect(result.valid[0].price).toBe(400000); // $4000 in cents
      expect(result.valid[0].isNoFee).toBe(true);
    });

    test('should handle validation errors gracefully', async () => {
      const invalidData = `externalId,source,url,title,address,price,bedrooms
,invalid-source,not-a-url,title,address,invalid-price,invalid-bedrooms`;

      const result = await ReportImportUtils.parseCSV(invalidData);
      
      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Validation failed');
    });

    test('should generate import summary correctly', () => {
      const mockResult = {
        valid: new Array(5).fill({}),
        errors: [
          { row: 1, data: {}, error: 'Test error' },
          { row: 2, data: {}, error: 'Another error' }
        ]
      };

      const summary = ReportImportUtils.generateImportSummary(mockResult, 'test.csv', 'csv');
      
      expect(summary).toContain('Total records: 7');
      expect(summary).toContain('Successfully parsed: 5');
      expect(summary).toContain('Errors: 2');
      expect(summary).toContain('Success rate: 71%');
    });
  });

  describe('Data Type Parsing', () => {
    test('should parse boolean values correctly', () => {
      const testCases = [
        { input: 'true', expected: true },
        { input: 'false', expected: false },
        { input: 'yes', expected: true },
        { input: 'no', expected: false },
        { input: '1', expected: true },
        { input: '0', expected: false },
        { input: true, expected: true },
        { input: false, expected: false },
        { input: 1, expected: true },
        { input: 0, expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = ReportImportUtils['parseBoolean'](input);
        expect(result).toBe(expected);
      });
    });

    test('should parse number values correctly', () => {
      const testCases = [
        { input: '3000', expected: 3000 },
        { input: '$3,000', expected: 3000 },
        { input: '3000.50', expected: 3000.5 },
        { input: 3000, expected: 3000 },
        { input: 'invalid', expected: null },
        { input: '', expected: null },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = ReportImportUtils['parseNumber'](input);
        expect(result).toBe(expected);
      });
    });

    test('should parse array values correctly', () => {
      const testCases = [
        { input: '["item1", "item2"]', expected: ['item1', 'item2'] },
        { input: 'item1,item2,item3', expected: ['item1', 'item2', 'item3'] },
        { input: ['item1', 'item2'], expected: ['item1', 'item2'] },
        { input: '', expected: [] },
        { input: 'single-item', expected: ['single-item'] },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = ReportImportUtils['parseArray'](input);
        expect(result).toEqual(expected);
      });
    });
  });
});