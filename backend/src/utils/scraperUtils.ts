import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../config/env';
import logger from '../config/logger';
import { ApartmentCreateInput } from '../models/Apartment';

export interface ScraperResult {
  success: boolean;
  apartments: ApartmentCreateInput[];
  error?: string;
  source: string;
}

export class ApartmentScraper {
  private readonly scraperApiKey: string;
  private readonly scraperBaseUrl: string;

  constructor() {
    this.scraperApiKey = config.scraperApi.key;
    this.scraperBaseUrl = config.scraperApi.baseUrl;
  }

  async scrapeAll(): Promise<ScraperResult[]> {
    const results = await Promise.allSettled([
      this.scrapeStreetEasy(),
      this.scrapeZillow(),
      this.scrapeApartmentsDotCom(),
      this.scrapeRedfin(),
      this.scrapeTrulia(),
    ]);

    return results.map((result, index) => {
      const sources = ['streeteasy', 'zillow', 'apartments', 'redfin', 'trulia'];
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          apartments: [],
          error: result.reason?.message || 'Unknown error',
          source: sources[index],
        };
      }
    });
  }

  async scrapeStreetEasy(): Promise<ScraperResult> {
    try {
      // Example StreetEasy URL for Manhattan rentals below 80th Street
      const url = 'https://streeteasy.com/for-rent/manhattan/price:2000-4500%7Cbeds%3C=1%7Carea:3,78,82,84,85,86,87,88,89,90%7Camenities:cats_ok,dishwasher,doorman,elevator,laundry_in_building';
      
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response);
      
      const apartments: ApartmentCreateInput[] = [];
      
      $('.item').each((index, element) => {
        try {
          const $el = $(element);
          const title = $el.find('.item-title-link').text().trim();
          const address = $el.find('.item-subtitle').text().trim();
          const priceText = $el.find('.price').text().trim();
          const price = this.extractPrice(priceText);
          const url = 'https://streeteasy.com' + $el.find('.item-title-link').attr('href');
          
          if (title && address && price && url) {
            apartments.push({
              externalId: `se-${this.extractIdFromUrl(url)}`,
              source: 'streeteasy',
              url,
              title,
              address,
              neighborhood: this.extractNeighborhood(address),
              borough: 'Manhattan',
              price: price * 100, // Convert to cents
              bedrooms: this.extractBedrooms(title),
              bathrooms: 1,
              isCatFriendly: true, // Filtered for cat-friendly
              isDoorman: true, // Filtered for doorman
              hasElevator: true, // Filtered for elevator
              hasDishwasher: true, // Filtered for dishwasher
              hasLaundryBuilding: true, // Filtered for laundry
            });
          }
        } catch (error) {
          logger.warn('Error parsing StreetEasy listing:', error);
        }
      });

      return {
        success: true,
        apartments,
        source: 'streeteasy',
      };
    } catch (error) {
      logger.error('StreetEasy scraping failed:', error);
      return {
        success: false,
        apartments: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'streeteasy',
      };
    }
  }

  async scrapeZillow(): Promise<ScraperResult> {
    try {
      // Example Zillow search URL
      const url = 'https://www.zillow.com/manhattan-new-york-ny/rentals/';
      
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response);
      
      const apartments: ApartmentCreateInput[] = [];
      
      // Zillow uses dynamic loading, so this is a simplified example
      $('[data-test="property-card"]').each((index, element) => {
        try {
          const $el = $(element);
          const title = $el.find('[data-test="property-card-addr"]').text().trim();
          const priceText = $el.find('[data-test="property-card-price"]').text().trim();
          const price = this.extractPrice(priceText);
          const url = 'https://www.zillow.com' + $el.find('a').attr('href');
          
          if (title && price && url) {
            apartments.push({
              externalId: `zillow-${this.extractIdFromUrl(url)}`,
              source: 'zillow',
              url,
              title,
              address: title,
              neighborhood: this.extractNeighborhood(title),
              borough: 'Manhattan',
              price: price * 100,
              bedrooms: 0, // Default to studio
              bathrooms: 1,
            });
          }
        } catch (error) {
          logger.warn('Error parsing Zillow listing:', error);
        }
      });

      return {
        success: true,
        apartments,
        source: 'zillow',
      };
    } catch (error) {
      logger.error('Zillow scraping failed:', error);
      return {
        success: false,
        apartments: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'zillow',
      };
    }
  }

  async scrapeApartmentsDotCom(): Promise<ScraperResult> {
    try {
      const url = 'https://www.apartments.com/manhattan-ny/';
      
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response);
      
      const apartments: ApartmentCreateInput[] = [];
      
      $('.mortar-wrapper').each((index, element) => {
        try {
          const $el = $(element);
          const title = $el.find('.property-title').text().trim();
          const address = $el.find('.property-address').text().trim();
          const priceText = $el.find('.property-pricing').text().trim();
          const price = this.extractPrice(priceText);
          const url = $el.find('.property-link').attr('href');
          
          if (title && address && price && url) {
            apartments.push({
              externalId: `apt-${this.extractIdFromUrl(url)}`,
              source: 'apartments',
              url: url.startsWith('http') ? url : `https://www.apartments.com${url}`,
              title,
              address,
              neighborhood: this.extractNeighborhood(address),
              borough: 'Manhattan',
              price: price * 100,
              bedrooms: 0,
              bathrooms: 1,
            });
          }
        } catch (error) {
          logger.warn('Error parsing Apartments.com listing:', error);
        }
      });

      return {
        success: true,
        apartments,
        source: 'apartments',
      };
    } catch (error) {
      logger.error('Apartments.com scraping failed:', error);
      return {
        success: false,
        apartments: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'apartments',
      };
    }
  }

  async scrapeRedfin(): Promise<ScraperResult> {
    try {
      // Redfin search URL for Manhattan rentals with our criteria
      const url = 'https://www.redfin.com/apartments-for-rent/Manhattan-New-York-NY/filter/property-type=condo+co-op+house+townhouse+multi-family+land+other,max-price=4500,min-price=2000,beds-max=1,include[]=cat-friendly,include[]=doorman,include[]=elevator,include[]=laundry-in-unit-or-building,include[]=dishwasher';
      
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response);
      
      const apartments: ApartmentCreateInput[] = [];
      
      // Redfin property cards
      $('.SearchResultsContainer .MapResultItem, .cluster-result').each((index, element) => {
        try {
          const $el = $(element);
          const titleElement = $el.find('.address .link-text, .address a');
          const title = titleElement.text().trim();
          const priceElement = $el.find('.price, .homecards-Price');
          const priceText = priceElement.text().trim();
          const price = this.extractPrice(priceText);
          const linkElement = $el.find('.address a, .link-text').first();
          const relativeUrl = linkElement.attr('href');
          const url = relativeUrl ? `https://www.redfin.com${relativeUrl}` : '';
          
          // Extract bedrooms/bathrooms from details
          const detailsText = $el.find('.stats, .homecards-Stats').text();
          const bedrooms = this.extractBedroomsFromDetails(detailsText);
          const bathrooms = this.extractBathroomsFromDetails(detailsText);
          
          if (title && price && url && price >= 2000 && price <= 4500) {
            apartments.push({
              externalId: `redfin-${this.extractIdFromUrl(url)}`,
              source: 'redfin',
              url,
              title,
              address: title,
              neighborhood: this.extractNeighborhood(title),
              borough: 'Manhattan',
              price: price * 100, // Convert to cents
              bedrooms: bedrooms,
              bathrooms: bathrooms,
              isCatFriendly: true, // Filtered for cat-friendly
              isDoorman: true, // Filtered for doorman
              hasElevator: true, // Filtered for elevator
              hasDishwasher: true, // Filtered for dishwasher
              hasLaundryBuilding: true, // Filtered for laundry
            });
          }
        } catch (error) {
          logger.warn('Error parsing Redfin listing:', error);
        }
      });

      return {
        success: true,
        apartments,
        source: 'redfin',
      };
    } catch (error) {
      logger.error('Redfin scraping failed:', error);
      return {
        success: false,
        apartments: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'redfin',
      };
    }
  }

  async scrapeTrulia(): Promise<ScraperResult> {
    try {
      // Trulia search URL for Manhattan rentals
      const url = 'https://www.trulia.com/for_rent/Manhattan,New_York_NY/2000-4500_price/0-1_beds/APARTMENT,CONDO,TOWNHOUSE_type/cat_friendly,doorman,elevator,dishwasher,laundry_amenities/';
      
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response);
      
      const apartments: ApartmentCreateInput[] = [];
      
      // Trulia property cards
      $('[data-testid="property-card"], .SearchResultsCard').each((index, element) => {
        try {
          const $el = $(element);
          const titleElement = $el.find('[data-testid="property-address"], .property-address a');
          const title = titleElement.text().trim();
          const priceElement = $el.find('[data-testid="property-price"], .property-price');
          const priceText = priceElement.text().trim();
          const price = this.extractPrice(priceText);
          const linkElement = $el.find('a').first();
          const relativeUrl = linkElement.attr('href');
          const url = relativeUrl ? (relativeUrl.startsWith('http') ? relativeUrl : `https://www.trulia.com${relativeUrl}`) : '';
          
          // Extract bedrooms from property details
          const bedroomText = $el.find('[data-testid="property-beds"], .property-beds').text();
          const bedrooms = this.extractBedroomsFromDetails(bedroomText);
          
          if (title && price && url && price >= 2000 && price <= 4500) {
            apartments.push({
              externalId: `trulia-${this.extractIdFromUrl(url)}`,
              source: 'trulia',
              url,
              title,
              address: title,
              neighborhood: this.extractNeighborhood(title),
              borough: 'Manhattan',
              price: price * 100, // Convert to cents
              bedrooms: bedrooms,
              bathrooms: 1, // Default to 1 bathroom
              isCatFriendly: true, // Filtered for cat-friendly
              isDoorman: true, // Filtered for doorman
              hasElevator: true, // Filtered for elevator
              hasDishwasher: true, // Filtered for dishwasher
              hasLaundryBuilding: true, // Filtered for laundry
            });
          }
        } catch (error) {
          logger.warn('Error parsing Trulia listing:', error);
        }
      });

      return {
        success: true,
        apartments,
        source: 'trulia',
      };
    } catch (error) {
      logger.error('Trulia scraping failed:', error);
      return {
        success: false,
        apartments: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'trulia',
      };
    }
  }

  private async makeRequest(url: string): Promise<string> {
    if (this.scraperApiKey) {
      // Use ScraperAPI
      const response = await axios.get(`${this.scraperBaseUrl}`, {
        params: {
          api_key: this.scraperApiKey,
          url: url,
          render: true,
        },
        timeout: 30000,
      });
      return response.data;
    } else {
      // Direct request (less reliable)
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000,
      });
      return response.data;
    }
  }

  private extractPrice(priceText: string): number {
    const match = priceText.match(/\$?([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  private extractBedrooms(title: string): number {
    if (title.toLowerCase().includes('studio')) return 0;
    const match = title.match(/(\d+)\s*(?:bed|br)/i);
    return match ? parseInt(match[1]) : 0;
  }

  private extractNeighborhood(address: string): string {
    // Simple neighborhood extraction logic
    const neighborhoods = [
      'Upper East Side', 'Upper West Side', 'Midtown', 'Chelsea', 'Greenwich Village',
      'SoHo', 'Tribeca', 'Lower East Side', 'Financial District', 'Murray Hill',
      'Kips Bay', 'Gramercy', 'Flatiron', 'NoMad', 'Hell\'s Kitchen', 'Theater District'
    ];
    
    for (const neighborhood of neighborhoods) {
      if (address.toLowerCase().includes(neighborhood.toLowerCase())) {
        return neighborhood;
      }
    }
    
    return 'Manhattan';
  }

  private extractIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)\/?/);
    return match ? match[1] : Date.now().toString();
  }

  private extractBedroomsFromDetails(text: string): number {
    if (text.toLowerCase().includes('studio')) return 0;
    const match = text.match(/(\d+)\s*(?:bed|br|bedroom)/i);
    return match ? parseInt(match[1]) : 0;
  }

  private extractBathroomsFromDetails(text: string): number {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
    return match ? parseFloat(match[1]) : 1;
  }
}

export default new ApartmentScraper();