#!/usr/bin/env node

// Load environment variables first
import dotenv from 'dotenv';
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';
dotenv.config({ path: envFile });

// Now import everything else
import { connectDB, disconnectDB } from '../src/config/database.js';
import { createIndexes } from '../src/config/indexes.js';
import logger from '../src/utils/logger.js';

/**
 * Create indexes script
 */
const createDatabaseIndexes = async () => {
  try {
    logger.info('='.repeat(50));
    logger.info('Database Indexes Creation Script');
    logger.info('='.repeat(50));
    
    // Connect to database
    await connectDB();
    
    // Create all indexes
    await createIndexes();
    
    logger.info('='.repeat(50));
    logger.info('Database indexes created successfully!');
    logger.info('='.repeat(50));
    
    // Disconnect from database
    await disconnectDB();
    
    process.exit(0);
  } catch (error) {
    logger.error('Index creation failed:', error);
    process.exit(1);
  }
};

// Run the script
createDatabaseIndexes();
