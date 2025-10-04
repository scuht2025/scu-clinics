/**
 * Database connection manager
 * Handles connection pooling and resource management
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logger } from '../utils/logger';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database.Database | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public initialize(dbPath?: string): Database.Database {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    try {
      // Use provided path or default
      const finalDbPath = dbPath || this.getDefaultDbPath();
      
      // Ensure directory exists
      const dbDir = join(finalDbPath, '..');
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(finalDbPath);
      this.configureDatabase();
      this.isInitialized = true;
      
      logger.info('Database initialized successfully', { path: finalDbPath });
      return this.db;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  public getDatabase(): Database.Database {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public close(): void {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        this.isInitialized = false;
        logger.info('Database connection closed');
      } catch (error) {
        logger.error('Error closing database connection:', error);
      }
    }
  }

  public isConnected(): boolean {
    return this.isInitialized && this.db !== null;
  }

  private getDefaultDbPath(): string {
    return join('C:\\clinics-db', 'clinics.db');
  }

  private configureDatabase(): void {
    if (!this.db) return;

    // Enable foreign keys and optimize performance
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    this.db.pragma('synchronous = NORMAL'); // Balance between safety and performance
    this.db.pragma('cache_size = 10000'); // Increase cache size for better performance
    this.db.pragma('temp_store = MEMORY'); // Store temp tables in memory
    this.db.pragma('mmap_size = 268435456'); // 256MB memory mapping
    this.db.pragma('optimize'); // Optimize the database
  }

  public backup(backupPath: string): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      this.db.backup(backupPath);
      logger.info('Database backup created', { backupPath });
    } catch (error) {
      logger.error('Failed to create database backup:', error);
      throw error;
    }
  }

  public getDatabaseInfo(): {
    size: string;
    lastModified: string;
    version: number;
    pageCount: number;
    pageSize: number;
  } {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const pageCount = this.db.prepare('PRAGMA page_count').get() as { page_count: number };
      const pageSize = this.db.prepare('PRAGMA page_size').get() as { page_size: number };
      const userVersion = this.db.prepare('PRAGMA user_version').get() as { user_version: number };
      const fileStats = require('fs').statSync(this.db.name);
      
      return {
        size: `${(pageCount.page_count * pageSize.page_size / 1024).toFixed(2)} KB`,
        lastModified: fileStats.mtime.toLocaleDateString('ar-EG'),
        version: userVersion.user_version,
        pageCount: pageCount.page_count,
        pageSize: pageSize.page_size
      };
    } catch (error) {
      logger.error('Failed to get database info:', error);
      throw error;
    }
  }
}

export const dbConnection = DatabaseConnection.getInstance();
