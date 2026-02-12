import {
  CreateDBInstanceCommand,
  CreateDBSnapshotCommand,
  DeleteDBInstanceCommand,
  DescribeDBInstancesCommand,
  DescribeDBSnapshotsCommand,
  ModifyDBInstanceCommand,
} from '@aws-sdk/client-rds';

import crypto from 'crypto';
import { getRdsClient } from './aws.config.js';
import logger from '../../utils/logger.js';

/**
 * Generate secure database password
 */
const generateDbPassword = () => {
  return crypto.randomBytes(32).toString('base64').slice(0, 32);
};

/**
 * Create RDS database instance
 */
export const createDatabase = async (options) => {
  try {
    const {
      domainName,
      engine = 'mysql',
      engineVersion = '8.0.35',
      instanceClass = 'db.t3.micro',
      allocatedStorage = 20,
      databaseName,
      masterUsername = 'admin',
      masterPassword,
      publiclyAccessible = false,
    } = options;

    const rdsClient = getRdsClient();
    const dbInstanceIdentifier = `${domainName.replace(/\./g, '-')}-db`;
    const finalPassword = masterPassword || generateDbPassword();

    const command = new CreateDBInstanceCommand({
      DBInstanceIdentifier: dbInstanceIdentifier,
      DBInstanceClass: instanceClass,
      Engine: engine,
      EngineVersion: engineVersion,
      MasterUsername: masterUsername,
      MasterUserPassword: finalPassword,
      AllocatedStorage: allocatedStorage,
      StorageType: 'gp3',
      StorageEncrypted: true,
      PubliclyAccessible: publiclyAccessible,
      DBName: databaseName || domainName.replace(/[.-]/g, '_'),
      BackupRetentionPeriod: 7, // 7 days backup
      PreferredBackupWindow: '03:00-04:00', // 3-4 AM UTC
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00', // Sunday 4-5 AM UTC
      EnableCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      Tags: [
        { Key: 'Name', Value: `${domainName}-database` },
        { Key: 'Domain', Value: domainName },
        { Key: 'ManagedBy', Value: 'SaaSify' },
      ],
    });

    const response = await rdsClient.send(command);
    const dbInstance = response.DBInstance;

    logger.info(`✅ RDS instance created: ${dbInstanceIdentifier}`);

    return {
      dbInstanceIdentifier: dbInstance.DBInstanceIdentifier,
      engine: dbInstance.Engine,
      engineVersion: dbInstance.EngineVersion,
      instanceClass: dbInstance.DBInstanceClass,
      allocatedStorage: dbInstance.AllocatedStorage,
      status: dbInstance.DBInstanceStatus,
      endpoint: dbInstance.Endpoint?.Address || null,
      port: dbInstance.Endpoint?.Port || null,
      masterUsername,
      masterPassword: finalPassword,
      databaseName: dbInstance.DBName,
    };
  } catch (error) {
    logger.error('Error creating RDS instance:', error);
    throw error;
  }
};

/**
 * Get RDS database instance details
 */
export const getDatabase = async (dbInstanceIdentifier) => {
  try {
    const rdsClient = getRdsClient();
    const command = new DescribeDBInstancesCommand({
      DBInstanceIdentifier: dbInstanceIdentifier,
    });

    const response = await rdsClient.send(command);

    if (response.DBInstances.length === 0) {
      throw new Error('Database instance not found');
    }

    const dbInstance = response.DBInstances[0];

    return {
      dbInstanceIdentifier: dbInstance.DBInstanceIdentifier,
      engine: dbInstance.Engine,
      engineVersion: dbInstance.EngineVersion,
      instanceClass: dbInstance.DBInstanceClass,
      allocatedStorage: dbInstance.AllocatedStorage,
      status: dbInstance.DBInstanceStatus,
      endpoint: dbInstance.Endpoint?.Address || null,
      port: dbInstance.Endpoint?.Port || null,
      masterUsername: dbInstance.MasterUsername,
      databaseName: dbInstance.DBName,
      createdTime: dbInstance.InstanceCreateTime,
      publiclyAccessible: dbInstance.PubliclyAccessible,
    };
  } catch (error) {
    logger.error('Error getting RDS instance:', error);
    throw error;
  }
};

/**
 * Wait for database to be available
 */
export const waitForDatabaseAvailable = async (dbInstanceIdentifier, maxWaitTime = 600000) => {
  const startTime = Date.now();
  const pollInterval = 10000; // 10 seconds

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const dbInstance = await getDatabase(dbInstanceIdentifier);

      if (dbInstance.status === 'available') {
        logger.info(`✅ Database ${dbInstanceIdentifier} is available`);
        return dbInstance;
      }

      logger.info(`Waiting for database ${dbInstanceIdentifier} to be available... (current: ${dbInstance.status})`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      logger.error('Error checking database status:', error);
      throw error;
    }
  }

  throw new Error(`Timeout waiting for database ${dbInstanceIdentifier} to be available`);
};

/**
 * Delete RDS database instance
 */
export const deleteDatabase = async (dbInstanceIdentifier, skipFinalSnapshot = false) => {
  try {
    const rdsClient = getRdsClient();

    const deleteParams = {
      DBInstanceIdentifier: dbInstanceIdentifier,
      SkipFinalSnapshot: skipFinalSnapshot,
    };

    // If not skipping snapshot, create one
    if (!skipFinalSnapshot) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      deleteParams.FinalDBSnapshotIdentifier = `${dbInstanceIdentifier}-final-${timestamp}`;
    }

    const command = new DeleteDBInstanceCommand(deleteParams);
    const response = await rdsClient.send(command);

    logger.info(`✅ RDS instance deletion initiated: ${dbInstanceIdentifier}`);

    return {
      dbInstanceIdentifier: response.DBInstance.DBInstanceIdentifier,
      status: response.DBInstance.DBInstanceStatus,
    };
  } catch (error) {
    logger.error('Error deleting RDS instance:', error);
    throw error;
  }
};

/**
 * Create database snapshot
 */
export const createSnapshot = async (dbInstanceIdentifier, snapshotName) => {
  try {
    const rdsClient = getRdsClient();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotIdentifier = snapshotName || `${dbInstanceIdentifier}-snapshot-${timestamp}`;

    const command = new CreateDBSnapshotCommand({
      DBSnapshotIdentifier: snapshotIdentifier,
      DBInstanceIdentifier: dbInstanceIdentifier,
      Tags: [
        { Key: 'CreatedBy', Value: 'SaaSify' },
        { Key: 'CreatedAt', Value: new Date().toISOString() },
      ],
    });

    const response = await rdsClient.send(command);
    const snapshot = response.DBSnapshot;

    logger.info(`✅ Database snapshot created: ${snapshotIdentifier}`);

    return {
      snapshotIdentifier: snapshot.DBSnapshotIdentifier,
      dbInstanceIdentifier: snapshot.DBInstanceIdentifier,
      status: snapshot.Status,
      allocatedStorage: snapshot.AllocatedStorage,
      snapshotCreateTime: snapshot.SnapshotCreateTime,
    };
  } catch (error) {
    logger.error('Error creating database snapshot:', error);
    throw error;
  }
};

/**
 * List database snapshots
 */
export const listSnapshots = async (dbInstanceIdentifier) => {
  try {
    const rdsClient = getRdsClient();
    const command = new DescribeDBSnapshotsCommand({
      DBInstanceIdentifier: dbInstanceIdentifier,
    });

    const response = await rdsClient.send(command);

    return response.DBSnapshots.map(snapshot => ({
      snapshotIdentifier: snapshot.DBSnapshotIdentifier,
      dbInstanceIdentifier: snapshot.DBInstanceIdentifier,
      status: snapshot.Status,
      allocatedStorage: snapshot.AllocatedStorage,
      snapshotCreateTime: snapshot.SnapshotCreateTime,
      engine: snapshot.Engine,
      engineVersion: snapshot.EngineVersion,
    }));
  } catch (error) {
    logger.error('Error listing database snapshots:', error);
    throw error;
  }
};

/**
 * Get database connection string
 */
export const getConnectionString = (dbInstance, password) => {
  const { engine, endpoint, port, masterUsername, databaseName } = dbInstance;

  const connectionStrings = {
    mysql: `mysql://${masterUsername}:${password}@${endpoint}:${port}/${databaseName}`,
    postgres: `postgresql://${masterUsername}:${password}@${endpoint}:${port}/${databaseName}`,
    mongodb: `mongodb://${masterUsername}:${password}@${endpoint}:${port}/${databaseName}`,
  };

  return connectionStrings[engine] || `${engine}://${masterUsername}:${password}@${endpoint}:${port}/${databaseName}`;
};

/**
 * Modify database instance (resize)
 */
export const modifyDatabase = async (dbInstanceIdentifier, modifications) => {
  try {
    const rdsClient = getRdsClient();
    const command = new ModifyDBInstanceCommand({
      DBInstanceIdentifier: dbInstanceIdentifier,
      ...modifications,
      ApplyImmediately: false, // Apply during maintenance window
    });

    const response = await rdsClient.send(command);

    logger.info(`✅ Database modification initiated: ${dbInstanceIdentifier}`);

    return {
      dbInstanceIdentifier: response.DBInstance.DBInstanceIdentifier,
      status: response.DBInstance.DBInstanceStatus,
    };
  } catch (error) {
    logger.error('Error modifying RDS instance:', error);
    throw error;
  }
};
