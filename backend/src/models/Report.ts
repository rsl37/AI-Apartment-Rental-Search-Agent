export interface ReportCreateInput {
  date?: Date;
  type?: 'daily' | 'weekly' | 'custom';
  totalListings: number;
  newListings: number;
  updatedListings: number;
  removedListings: number;
  averagePrice: number;
  medianPrice: number;
  lowestPrice: number;
  highestPrice: number;
  summary?: string;
  details?: Record<string, any>;
  listings?: string[]; // Array of apartment IDs
  csvData?: string;
  pdfUrl?: string;
}

export interface ReportUpdateInput extends Partial<ReportCreateInput> {}

export interface ReportFilter {
  type?: 'daily' | 'weekly' | 'custom';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ReportStats {
  totalReports: number;
  averageNewListings: number;
  averagePrice: number;
  trendsData: {
    date: string;
    totalListings: number;
    newListings: number;
    averagePrice: number;
  }[];
}

export interface DailyReportData {
  date: string;
  summary: {
    totalListings: number;
    newListings: number;
    updatedListings: number;
    removedListings: number;
    priceStats: {
      average: number;
      median: number;
      lowest: number;
      highest: number;
    };
  };
  newApartments: any[];
  updatedApartments: any[];
  removedApartments: any[];
  priceChanges: any[];
  insights: string[];
  recommendations: string[];
}

export interface WeeklyReportData extends DailyReportData {
  weekOf: string;
  dailyBreakdown: DailyReportData[];
  trendsAnalysis: {
    priceDirection: 'up' | 'down' | 'stable';
    inventoryDirection: 'up' | 'down' | 'stable';
    hotNeighborhoods: string[];
    bestDeals: any[];
  };
}