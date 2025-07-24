import Database from 'better-sqlite3';
import path from 'path';

// Simple database client using better-sqlite3
const dbPath = path.join(__dirname, '../../dev.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Database utility functions
export const dbUtils = {
  // Get all apartments
  getApartments: (filters: any = {}) => {
    let query = 'SELECT * FROM apartments WHERE isActive = 1';
    const params: any[] = [];
    
    if (filters.minPrice) {
      query += ' AND price >= ?';
      params.push(filters.minPrice * 100);
    }
    if (filters.maxPrice) {
      query += ' AND price <= ?';
      params.push(filters.maxPrice * 100);
    }
    if (filters.isNoFee) {
      query += ' AND isNoFee = 1';
    }
    
    query += ' ORDER BY createdAt DESC LIMIT 50';
    
    return db.prepare(query).all(...params);
  },

  // Get reports
  getReports: () => {
    return db.prepare('SELECT * FROM reports ORDER BY date DESC LIMIT 20').all();
  },

  // Create apartment
  createApartment: (data: any) => {
    const stmt = db.prepare(`
      INSERT INTO apartments (
        id, externalId, source, url, title, address, neighborhood, price, 
        bedrooms, bathrooms, isNoFee, isDoorman, hasAC, isCatFriendly
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const id = 'apt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    return stmt.run(
      id, data.externalId, data.source, data.url, data.title, data.address,
      data.neighborhood, data.price, data.bedrooms, data.bathrooms,
      data.isNoFee ? 1 : 0, data.isDoorman ? 1 : 0, data.hasAC ? 1 : 0, data.isCatFriendly ? 1 : 0
    );
  },

  // Create report
  createReport: (data: any) => {
    const stmt = db.prepare(`
      INSERT INTO reports (
        id, date, type, source, filename, importStatus, totalListings, 
        newListings, updatedListings, summary, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const id = 'rpt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    return stmt.run(
      id, new Date().toISOString(), data.type, data.source, data.filename,
      data.importStatus, data.totalListings, data.newListings, data.updatedListings,
      data.summary, JSON.stringify(data.details || {})
    );
  },

  // Update apartment
  updateApartment: (id: string, data: any) => {
    const stmt = db.prepare(`
      UPDATE apartments SET 
        title = ?, address = ?, price = ?, isNoFee = ?, 
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(data.title, data.address, data.price, data.isNoFee ? 1 : 0, id);
  },

  // Find apartment by external ID
  findApartmentByExternalId: (externalId: string) => {
    return db.prepare('SELECT * FROM apartments WHERE externalId = ?').get(externalId);
  },

  // Get apartment count
  getApartmentCount: () => {
    return db.prepare('SELECT COUNT(*) as count FROM apartments WHERE isActive = 1').get();
  }
};