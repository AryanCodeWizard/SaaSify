#!/usr/bin/env node

// Load environment variables first
import dotenv from 'dotenv';
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';
dotenv.config({ path: envFile });

// Now import everything else
import { connectDB, disconnectDB } from '../src/config/database.js';
import logger from '../src/utils/logger.js';
import { runAllSeeds } from '../src/config/seed.js';

/**
 * Seed database script
 */
const seedDatabase = async () => {
  try {
    logger.info('='.repeat(50));
    logger.info('Database Seeding Script');
    logger.info('='.repeat(50));
    
    // Connect to database
    await connectDB();
    
    // Run all seeds
    await runAllSeeds();
    
    logger.info('='.repeat(50));
    logger.info('Database seeding completed successfully!');
    logger.info('='.repeat(50));
    
    // Disconnect from database
    await disconnectDB();
    
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

// Run the script
seedDatabase();
