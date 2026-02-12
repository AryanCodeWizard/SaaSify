import * as acmService from '../modules/aws/acm.service.js';
import * as cloudfrontService from '../modules/aws/cloudfront.service.js';
import * as route53Service from '../modules/aws/route53.service.js';
import * as s3Service from '../modules/aws/s3.service.js';

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

// Create hosting provisioning queue
export const hostingProvisioningQueue = new Queue('hosting-provisioning', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

/**
 * Add hosting provisioning job to queue
 */
export const addProvisioningJob = async (hostingServiceId, enableSsl = true) => {
  try {
    const job = await hostingProvisioningQueue.add(
      'provision-static-hosting',
      {
        hostingServiceId,
        enableSsl,
      },
      {
        jobId: `provision-${hostingServiceId}`,
      }
    );

    logger.info(`✅ Provisioning job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('❌ Error adding provisioning job:', error);
    throw error;
  }
};

/**
 * Add hosting termination job to queue
 */
export const addTerminationJob = async (hostingServiceId) => {
  try {
    const job = await hostingProvisioningQueue.add(
      'terminate-hosting',
      {
        hostingServiceId,
      },
      {
        jobId: `terminate-${hostingServiceId}`,
      }
    );

    logger.info(`✅ Termination job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('❌ Error adding termination job:', error);
    throw error;
  }
};

// Worker to process hosting provisioning jobs
export const hostingProvisioningWorker = new Worker(
  'hosting-provisioning',
  async (job) => {
    const { name, data } = job;

    logger.info(`🔧 Processing job: ${name} (${job.id})`);

    if (name === 'provision-static-hosting') {
      await provisionStaticHosting(data.hostingServiceId, data.enableSsl, job);
    } else if (name === 'terminate-hosting') {
      await terminateHosting(data.hostingServiceId, job);
    } else {
      logger.warn(`⚠️ Unknown job type: ${name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Process up to 3 jobs concurrently
  }
);

/**
 * Provision static hosting service
 */
const provisionStaticHosting = async (hostingServiceId, enableSsl, job) => {
  const hostingService = await HostingService.findById(hostingServiceId).populate('domain');

  if (!hostingService) {
    throw new Error('Hosting service not found');
  }

  try {
    const domain = hostingService.domain;
    await job.updateProgress(10);

    // Step 1: Create S3 bucket
    hostingService.updateProvisioningStep('create_s3_bucket', 'in-progress');
    hostingService.addLog('Creating S3 bucket...');
    await hostingService.save();

    const bucket = await s3Service.createBucket(domain.domainName);
    hostingService.static.bucketName = bucket.bucketName;
    hostingService.static.bucketRegion = bucket.region;
    hostingService.updateProvisioningStep('create_s3_bucket', 'completed');
    hostingService.addLog(`S3 bucket created: ${bucket.bucketName}`);
    await hostingService.save();
    await job.updateProgress(25);

    // Step 2: Configure static website hosting
    hostingService.updateProvisioningStep('configure_static_website', 'in-progress');
    hostingService.addLog('Configuring static website hosting...');
    await hostingService.save();

    const website = await s3Service.configureStaticWebsite(bucket.bucketName);
    hostingService.static.websiteUrl = website.websiteUrl;
    hostingService.updateProvisioningStep('configure_static_website', 'completed');
    hostingService.addLog(`Website URL: ${website.websiteUrl}`);
    await hostingService.save();
    await job.updateProgress(35);

    // Step 3: Set bucket policy (public read)
    hostingService.updateProvisioningStep('set_bucket_policy', 'in-progress');
    await hostingService.save();

    await s3Service.setBucketPolicy(bucket.bucketName);
    hostingService.updateProvisioningStep('set_bucket_policy', 'completed');
    hostingService.addLog('Bucket policy set to public read');
    await hostingService.save();
    await job.updateProgress(45);

    // Step 4: Configure CORS
    hostingService.updateProvisioningStep('configure_cors', 'in-progress');
    await hostingService.save();

    await s3Service.configureCors(bucket.bucketName);
    hostingService.updateProvisioningStep('configure_cors', 'completed');
    hostingService.addLog('CORS configured');
    await hostingService.save();
    await job.updateProgress(55);

    let certificateArn = null;

    // Step 5 & 6: Request and validate SSL certificate (if enabled)
    if (enableSsl) {
      hostingService.updateProvisioningStep('request_ssl_certificate', 'in-progress');
      hostingService.addLog('Requesting SSL certificate...');
      await hostingService.save();

      const certificate = await acmService.requestCertificate(domain.domainName);
      certificateArn = certificate.certificateArn;
      hostingService.ssl.certificateArn = certificateArn;
      hostingService.ssl.status = 'validating';
      hostingService.updateProvisioningStep('request_ssl_certificate', 'completed');
      hostingService.addLog(`SSL certificate requested: ${certificateArn}`);
      await hostingService.save();
      await job.updateProgress(65);

      // Get DNS validation records
      hostingService.updateProvisioningStep('validate_ssl_certificate', 'in-progress');
      hostingService.addLog('Configuring SSL certificate validation...');
      await hostingService.save();

      const certDetails = await acmService.getCertificate(certificateArn);

      // If Route53 is enabled, add DNS validation records automatically
      if (domain.aws?.hostedZoneId) {
        for (const validationRecord of certDetails.dnsValidationRecords) {
          if (validationRecord.resourceRecord) {
            try {
              await route53Service.upsertDnsRecord(
                domain.aws.hostedZoneId,
                {
                  name: validationRecord.resourceRecord.name,
                  type: validationRecord.resourceRecord.type,
                  ttl: 300,
                  values: [validationRecord.resourceRecord.value],
                }
              );
              hostingService.addLog(`Added DNS validation record for SSL`);
            } catch (err) {
              hostingService.addLog(
                `Failed to add DNS validation record: ${err.message}`,
                'warning'
              );
            }
          }
        }
        await hostingService.save();
      }

      hostingService.updateProvisioningStep('validate_ssl_certificate', 'completed');
      hostingService.addLog('SSL validation configured (validation in progress)');
      await hostingService.save();
      await job.updateProgress(75);
    }

    // Step 7: Create CloudFront distribution
    hostingService.updateProvisioningStep('create_cloudfront_distribution', 'in-progress');
    hostingService.addLog('Creating CloudFront distribution...');
    await hostingService.save();

    const distribution = await cloudfrontService.createDistribution(
      bucket.bucketName,
      domain.domainName,
      certificateArn
    );
    hostingService.static.cloudfrontId = distribution.distributionId;
    hostingService.static.cloudfrontUrl = distribution.domainName;
    hostingService.static.cloudfrontStatus = distribution.status;
    hostingService.updateProvisioningStep('create_cloudfront_distribution', 'completed');
    hostingService.addLog(`CloudFront distribution created: ${distribution.domainName}`);
    await hostingService.save();
    await job.updateProgress(85);

    // Step 8: Update DNS records (if Route53 is enabled)
    if (domain.aws?.hostedZoneId) {
      hostingService.updateProvisioningStep('update_dns_records', 'in-progress');
      hostingService.addLog('Updating DNS records...');
      await hostingService.save();

      // Create CNAME record pointing to CloudFront
      try {
        await route53Service.upsertDnsRecord(domain.aws.hostedZoneId, {
          name: domain.domainName,
          type: 'CNAME',
          ttl: 300,
          values: [distribution.domainName],
        });
        hostingService.addLog('DNS CNAME record created');
      } catch (err) {
        hostingService.addLog(`DNS update failed: ${err.message}`, 'warning');
      }

      hostingService.updateProvisioningStep('update_dns_records', 'completed');
      await hostingService.save();
    }
    await job.updateProgress(95);

    // Mark as active
    hostingService.status = 'active';
    hostingService.provisioning.completedAt = new Date();
    hostingService.addLog('Provisioning completed successfully!');
    await hostingService.save();
    await job.updateProgress(100);

    logger.info(`✅ Static hosting provisioned for ${domain.domainName}`);
  } catch (error) {
    logger.error('❌ Provisioning failed:', error);
    hostingService.status = 'failed';
    hostingService.addLog(`Provisioning failed: ${error.message}`, 'error');
    await hostingService.save();
    throw error;
  }
};

/**
 * Terminate hosting service
 */
const terminateHosting = async (hostingServiceId, job) => {
  const hostingService = await HostingService.findById(hostingServiceId);

  if (!hostingService) {
    throw new Error('Hosting service not found');
  }

  try {
    await job.updateProgress(10);

    // Delete CloudFront distribution
    if (hostingService.static.cloudfrontId) {
      logger.info('Deleting CloudFront distribution...');
      await cloudfrontService.deleteDistribution(
        hostingService.static.cloudfrontId
      );
      await job.updateProgress(40);
    }

    // Delete S3 bucket
    if (hostingService.static.bucketName) {
      logger.info('Deleting S3 bucket...');
      await s3Service.deleteBucket(hostingService.static.bucketName);
      await job.updateProgress(70);
    }

    // Delete SSL certificate (if not in use)
    if (hostingService.ssl.certificateArn) {
      try {
        logger.info('Deleting SSL certificate...');
        await acmService.deleteCertificate(hostingService.ssl.certificateArn);
      } catch (err) {
        logger.warn('Could not delete SSL certificate:', err.message);
      }
      await job.updateProgress(90);
    }

    hostingService.status = 'terminated';
    await hostingService.save();
    await job.updateProgress(100);

    logger.info(`✅ Hosting terminated for ${hostingService.domainName}`);
  } catch (error) {
    logger.error('❌ Termination failed:', error);
    hostingService.status = 'failed';
    await hostingService.save();
    throw error;
  }
};

// Worker event handlers
hostingProvisioningWorker.on('completed', (job) => {
  logger.info(`✅ Job completed: ${job.id}`);
});

hostingProvisioningWorker.on('failed', (job, err) => {
  logger.error(`❌ Job failed: ${job.id}`, err);
});

hostingProvisioningWorker.on('error', (err) => {
  logger.error('❌ Worker error:', err);
});

logger.info('🔧 Hosting provisioning worker started');
