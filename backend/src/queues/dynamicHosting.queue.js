import * as ec2Service from '../modules/aws/ec2.service.js';
import * as rdsService from '../modules/aws/rds.service.js';
import * as route53Service from '../modules/aws/route53.service.js';

import { Queue, Worker } from 'bullmq';

import HostingService from '../models/HostingService.js';
import Redis from 'ioredis';
import logger from '../utils/logger.js';

// Redis connection
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Create dynamic hosting provisioning queue
export const dynamicHostingQueue = new Queue('dynamic-hosting-provisioning', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2, // Fewer retries for dynamic hosting (more expensive)
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

/**
 * Add dynamic provisioning job to queue
 */
export const addDynamicProvisioningJob = async (hostingServiceId, options = {}) => {
  try {
    const job = await dynamicHostingQueue.add(
      'provision-dynamic-hosting',
      {
        hostingServiceId,
        ...options,
      },
      {
        jobId: `provision-dynamic-${hostingServiceId}`,
      }
    );

    logger.info(`✅ Dynamic provisioning job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('❌ Error adding dynamic provisioning job:', error);
    throw error;
  }
};

/**
 * Add dynamic termination job to queue
 */
export const addDynamicTerminationJob = async (hostingServiceId) => {
  try {
    const job = await dynamicHostingQueue.add(
      'terminate-dynamic-hosting',
      {
        hostingServiceId,
      },
      {
        jobId: `terminate-dynamic-${hostingServiceId}`,
      }
    );

    logger.info(`✅ Dynamic termination job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('❌ Error adding dynamic termination job:', error);
    throw error;
  }
};

// Worker to process dynamic hosting provisioning jobs
export const dynamicHostingWorker = new Worker(
  'dynamic-hosting-provisioning',
  async (job) => {
    const { name, data } = job;

    logger.info(`🔧 Processing job: ${name} (${job.id})`);

    if (name === 'provision-dynamic-hosting') {
      await provisionDynamicHosting(data.hostingServiceId, data, job);
    } else if (name === 'terminate-dynamic-hosting') {
      await terminateDynamicHosting(data.hostingServiceId, job);
    } else {
      logger.warn(`⚠️ Unknown job type: ${name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process up to 2 dynamic hosting jobs concurrently
  }
);

/**
 * Provision dynamic hosting service (EC2 + optional RDS)
 */
const provisionDynamicHosting = async (hostingServiceId, options, job) => {
  const hostingService = await HostingService.findById(hostingServiceId).populate('domain');

  if (!hostingService) {
    throw new Error('Hosting service not found');
  }

  let securityGroupId;
  let keyName;
  let dbPassword;

  try {
    const domain = hostingService.domain;
    await job.updateProgress(5);

    // Step 1: Create security group
    hostingService.updateProvisioningStep('create_security_group', 'in-progress');
    hostingService.addLog('Creating security group...');
    await hostingService.save();

    const securityGroup = await ec2Service.createSecurityGroup(domain.domainName);
    securityGroupId = securityGroup.securityGroupId;
    hostingService.dynamic.securityGroupId = securityGroupId;
    hostingService.updateProvisioningStep('create_security_group', 'completed');
    hostingService.addLog(`Security group created: ${securityGroupId}`);
    await hostingService.save();
    await job.updateProgress(15);

    // Step 2: Create key pair
    hostingService.updateProvisioningStep('create_key_pair', 'in-progress');
    hostingService.addLog('Creating SSH key pair...');
    await hostingService.save();

    const keyPair = await ec2Service.createKeyPair(domain.domainName);
    keyName = keyPair.keyName;
    hostingService.dynamic.keyName = keyName;
    hostingService.updateProvisioningStep('create_key_pair', 'completed');
    hostingService.addLog(`Key pair created: ${keyName}`);

    // Store private key securely (In production, use AWS Secrets Manager)
    if (keyPair.keyMaterial) {
      hostingService.addLog(
        `IMPORTANT: Save this private key - it cannot be retrieved later:\n\n${keyPair.keyMaterial}`,
        'warning'
      );
    }

    await hostingService.save();
    await job.updateProgress(25);

    // Step 3: Launch EC2 instance
    hostingService.updateProvisioningStep('launch_ec2_instance', 'in-progress');
    hostingService.addLog('Launching EC2 instance...');
    await hostingService.save();

    const instance = await ec2Service.launchInstance({
      domainName: domain.domainName,
      instanceType: hostingService.dynamic.instanceType,
      runtime: hostingService.dynamic.runtime,
      appPort: hostingService.dynamic.appPort,
      securityGroupId,
      keyName,
      volumeSize: Math.floor(hostingService.plan.specs.storage / 1000) || 20,
    });

    hostingService.dynamic.instanceId = instance.instanceId;
    hostingService.dynamic.instanceState = instance.state;
    hostingService.dynamic.privateIp = instance.privateIp;
    hostingService.updateProvisioningStep('launch_ec2_instance', 'completed');
    hostingService.addLog(`EC2 instance launched: ${instance.instanceId}`);
    await hostingService.save();
    await job.updateProgress(40);

    // Step 4: Wait for instance to be running
    hostingService.updateProvisioningStep('wait_for_instance_running', 'in-progress');
    hostingService.addLog('Waiting for instance to be running...');
    await hostingService.save();

    const runningInstance = await ec2Service.waitForInstanceRunning(instance.instanceId);
    hostingService.dynamic.instanceState = 'running';
    hostingService.dynamic.publicIp = runningInstance.publicIp;
    hostingService.updateProvisioningStep('wait_for_instance_running', 'completed');
    hostingService.addLog(`Instance is running (IP: ${runningInstance.publicIp})`);
    await hostingService.save();
    await job.updateProgress(55);

    // Step 5: Allocate and associate Elastic IP
    hostingService.updateProvisioningStep('allocate_elastic_ip', 'in-progress');
    hostingService.addLog('Allocating Elastic IP...');
    await hostingService.save();

    const elasticIp = await ec2Service.allocateElasticIp();
    const association = await ec2Service.associateElasticIp(
      instance.instanceId,
      elasticIp.allocationId
    );

    hostingService.dynamic.elasticIp = {
      allocationId: elasticIp.allocationId,
      publicIp: elasticIp.publicIp,
      associationId: association.associationId,
    };
    hostingService.updateProvisioningStep('allocate_elastic_ip', 'completed');
    hostingService.addLog(`Elastic IP allocated: ${elasticIp.publicIp}`);
    await hostingService.save();
    await job.updateProgress(65);

    // Step 6: Create RDS database (if enabled)
    if (options.database && hostingService.dynamic.database?.enabled) {
      hostingService.updateProvisioningStep('create_rds_database', 'in-progress');
      hostingService.addLog('Creating RDS database instance...');
      await hostingService.save();

      const db = await rdsService.createDatabase({
        domainName: domain.domainName,
        engine: hostingService.dynamic.database.engine,
        instanceClass: hostingService.dynamic.database.instanceClass,
        allocatedStorage: 20,
        databaseName: domain.domainName.replace(/[.-]/g, '_'),
      });

      hostingService.dynamic.database.instanceIdentifier = db.dbInstanceIdentifier;
      hostingService.dynamic.database.port = db.port;
      hostingService.dynamic.database.name = db.databaseName;
      hostingService.dynamic.database.username = db.masterUsername;
      dbPassword = db.masterPassword;
      hostingService.dynamic.database.status = db.status;
      hostingService.updateProvisioningStep('create_rds_database', 'completed');
      hostingService.addLog(`RDS instance created: ${db.dbInstanceIdentifier}`);
      hostingService.addLog(
        `Database credentials:\nUsername: ${db.masterUsername}\nPassword: ${dbPassword}\nDatabase: ${db.databaseName}`,
        'warning'
      );
      await hostingService.save();
      await job.updateProgress(75);

      // Step 7: Wait for database to be available
      hostingService.updateProvisioningStep('wait_for_database_available', 'in-progress');
      hostingService.addLog('Waiting for database to be available...');
      await hostingService.save();

      const availableDb = await rdsService.waitForDatabaseAvailable(db.dbInstanceIdentifier);
      hostingService.dynamic.database.endpoint = availableDb.endpoint;
      hostingService.dynamic.database.status = availableDb.status;
      hostingService.updateProvisioningStep('wait_for_database_available', 'completed');
      hostingService.addLog(`Database is available (Endpoint: ${availableDb.endpoint})`);
      await hostingService.save();
      await job.updateProgress(85);
    }

    // Step 8: Update DNS records (if Route53 is enabled)
    if (domain.aws?.hostedZoneId) {
      hostingService.updateProvisioningStep('update_dns_records', 'in-progress');
      hostingService.addLog('Updating DNS records...');
      await hostingService.save();

      try {
        await route53Service.upsertDnsRecord(domain.aws.hostedZoneId, {
          name: domain.domainName,
          type: 'A',
          ttl: 300,
          values: [hostingService.dynamic.elasticIp.publicIp],
        });
        hostingService.addLog('DNS A record created');
      } catch (err) {
        hostingService.addLog(`DNS update failed: ${err.message}`, 'warning');
      }

      hostingService.updateProvisioningStep('update_dns_records', 'completed');
      await hostingService.save();
    }
    await job.updateProgress(95);

    // Mark as active
    hostingService.status = 'active';
    hostingService.provisioning.completed = new Date();
    hostingService.addLog('✅ Provisioning completed successfully!');
    hostingService.addLog(
      `\nServer Access:\nSSH: ssh -i ~/.ssh/${keyName}.pem ubuntu@${hostingService.dynamic.elasticIp.publicIp}\nApp will be available at: http://${domain.domainName}:${hostingService.dynamic.appPort}`
    );
    await hostingService.save();
    await job.updateProgress(100);

    logger.info(`✅ Dynamic hosting provisioned for ${domain.domainName}`);
  } catch (error) {
    logger.error('❌ Dynamic provisioning failed:', error);
    hostingService.status = 'failed';
    hostingService.addLog(`Provisioning failed: ${error.message}`, 'error');
    await hostingService.save();
    throw error;
  }
};

/**
 * Terminate dynamic hosting service
 */
const terminateDynamicHosting = async (hostingServiceId, job) => {
  const hostingService = await HostingService.findById(hostingServiceId);

  if (!hostingService) {
    throw new Error('Hosting service not found');
  }

  try {
    await job.updateProgress(10);

    // Disassociate and release Elastic IP
    if (hostingService.dynamic.elasticIp?.associationId) {
      logger.info('Disassociating Elastic IP...');
      await ec2Service.disassociateElasticIp(hostingService.dynamic.elasticIp.associationId);
      await job.updateProgress(25);
    }

    if (hostingService.dynamic.elasticIp?.allocationId) {
      logger.info('Releasing Elastic IP...');
      await ec2Service.releaseElasticIp(hostingService.dynamic.elasticIp.allocationId);
      await job.updateProgress(40);
    }

    // Terminate EC2 instance
    if (hostingService.dynamic.instanceId) {
      logger.info('Terminating EC2 instance...');
      await ec2Service.terminateInstance(hostingService.dynamic.instanceId);
      await job.updateProgress(60);
    }

    // Delete RDS database (if exists)
    if (hostingService.dynamic.database?.instanceIdentifier) {
      logger.info('Deleting RDS database...');
      await rdsService.deleteDatabase(hostingService.dynamic.database.instanceIdentifier, true);
      await job.updateProgress(80);
    }

    // Delete key pair
    if (hostingService.dynamic.keyName) {
      try {
        logger.info('Deleting key pair...');
        await ec2Service.deleteKeyPair(hostingService.dynamic.keyName);
      } catch (err) {
        logger.warn('Could not delete key pair:', err.message);
      }
      await job.updateProgress(95);
    }

    hostingService.status = 'terminated';
    await hostingService.save();
    await job.updateProgress(100);

    logger.info(`✅ Dynamic hosting terminated for ${hostingService.domainName}`);
  } catch (error) {
    logger.error('❌ Dynamic termination failed:', error);
    hostingService.status = 'failed';
    await hostingService.save();
    throw error;
  }
};

// Worker event handlers
dynamicHostingWorker.on('completed', (job) => {
  logger.info(`✅ Dynamic hosting job completed: ${job.id}`);
});

dynamicHostingWorker.on('failed', (job, err) => {
  logger.error(`❌ Dynamic hosting job failed: ${job.id}`, err);
});

dynamicHostingWorker.on('error', (err) => {
  logger.error('❌ Dynamic hosting worker error:', err);
});

logger.info('🔧 Dynamic hosting provisioning worker started');
