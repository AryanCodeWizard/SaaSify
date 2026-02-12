import {
  CreateDistributionCommand,
  CreateInvalidationCommand,
  DeleteDistributionCommand,
  GetDistributionCommand,
  GetDistributionConfigCommand,
  ListDistributionsCommand,
  UpdateDistributionCommand,
} from '@aws-sdk/client-cloudfront';

import { getCloudFrontClient } from './aws.config.js';
import logger from '../../utils/logger.js';

/**
 * Create CloudFront distribution for S3 static website
 * @param {string} bucketName - S3 bucket name
 * @param {string} domainName - Custom domain name (optional)
 * @param {string} certificateArn - ACM certificate ARN (optional, for HTTPS)
 * @returns {Object} Distribution details
 */
const createDistribution = async (
  bucketName,
  domainName = null,
  certificateArn = null
) => {
  try {
    const client = getCloudFrontClient();
    const callerReference = `${bucketName}-${Date.now()}`;

    // S3 website endpoint as origin
    const region = process.env.AWS_REGION || 'us-east-1';
    const originDomain = `${bucketName}.s3-website-${region}.amazonaws.com`;

    const distributionConfig = {
      CallerReference: callerReference,
      Comment: `CloudFront distribution for ${domainName || bucketName}`,
      Enabled: true,
      DefaultRootObject: 'index.html',
      Origins: {
        Quantity: 1,
        Items: [
          {
            Id: `S3-${bucketName}`,
            DomainName: originDomain,
            CustomOriginConfig: {
              HTTPPort: 80,
              HTTPSPort: 443,
              OriginProtocolPolicy: 'http-only',
              OriginSslProtocols: {
                Quantity: 3,
                Items: ['TLSv1', 'TLSv1.1', 'TLSv1.2'],
              },
            },
          },
        ],
      },
      DefaultCacheBehavior: {
        TargetOriginId: `S3-${bucketName}`,
        ViewerProtocolPolicy: certificateArn ? 'redirect-to-https' : 'allow-all',
        AllowedMethods: {
          Quantity: 2,
          Items: ['GET', 'HEAD'],
          CachedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD'],
          },
        },
        Compress: true,
        ForwardedValues: {
          QueryString: false,
          Cookies: {
            Forward: 'none',
          },
          Headers: {
            Quantity: 0,
          },
        },
        MinTTL: 0,
        DefaultTTL: 86400, // 1 day
        MaxTTL: 31536000, // 1 year
        TrustedSigners: {
          Enabled: false,
          Quantity: 0,
        },
      },
      CustomErrorResponses: {
        Quantity: 2,
        Items: [
          {
            ErrorCode: 403,
            ResponsePagePath: '/error.html',
            ResponseCode: '404',
            ErrorCachingMinTTL: 300,
          },
          {
            ErrorCode: 404,
            ResponsePagePath: '/error.html',
            ResponseCode: '404',
            ErrorCachingMinTTL: 300,
          },
        ],
      },
      PriceClass: 'PriceClass_100', // Use only North America and Europe edges
    };

    // Add custom domain and SSL certificate if provided
    if (domainName && certificateArn) {
      distributionConfig.Aliases = {
        Quantity: 2,
        Items: [domainName, `www.${domainName}`],
      };
      distributionConfig.ViewerCertificate = {
        ACMCertificateArn: certificateArn,
        SSLSupportMethod: 'sni-only',
        MinimumProtocolVersion: 'TLSv1.2_2021',
        Certificate: certificateArn,
        CertificateSource: 'acm',
      };
    } else {
      distributionConfig.ViewerCertificate = {
        CloudFrontDefaultCertificate: true,
        MinimumProtocolVersion: 'TLSv1',
      };
    }

    const command = new CreateDistributionCommand({
      DistributionConfig: distributionConfig,
    });

    const response = await client.send(command);
    const distribution = response.Distribution;

    logger.info(`✅ Created CloudFront distribution: ${distribution.Id}`);

    return {
      distributionId: distribution.Id,
      domainName: distribution.DomainName,
      status: distribution.Status,
      arn: distribution.ARN,
      customDomain: domainName,
      httpsEnabled: !!certificateArn,
    };
  } catch (error) {
    logger.error(
      `❌ Failed to create CloudFront distribution for ${bucketName}:`,
      error
    );
    throw new Error(
      `Failed to create CloudFront distribution: ${error.message}`
    );
  }
};

/**
 * Get CloudFront distribution details
 * @param {string} distributionId - Distribution ID
 * @returns {Object} Distribution details
 */
const getDistribution = async (distributionId) => {
  try {
    const client = getCloudFrontClient();

    const command = new GetDistributionCommand({
      Id: distributionId,
    });

    const response = await client.send(command);
    const distribution = response.Distribution;

    return {
      distributionId: distribution.Id,
      domainName: distribution.DomainName,
      status: distribution.Status,
      enabled: distribution.DistributionConfig.Enabled,
      comment: distribution.DistributionConfig.Comment,
      aliases: distribution.DistributionConfig.Aliases?.Items || [],
    };
  } catch (error) {
    logger.error(
      `❌ Failed to get CloudFront distribution ${distributionId}:`,
      error
    );
    throw new Error(`Failed to get distribution: ${error.message}`);
  }
};

/**
 * Update CloudFront distribution
 * @param {string} distributionId - Distribution ID
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated distribution
 */
const updateDistribution = async (distributionId, updates) => {
  try {
    const client = getCloudFrontClient();

    // Get current config first
    const configCommand = new GetDistributionConfigCommand({
      Id: distributionId,
    });

    const configResponse = await client.send(configCommand);
    const currentConfig = configResponse.DistributionConfig;
    const etag = configResponse.ETag;

    // Apply updates
    const updatedConfig = {
      ...currentConfig,
      ...updates,
    };

    const updateCommand = new UpdateDistributionCommand({
      Id: distributionId,
      DistributionConfig: updatedConfig,
      IfMatch: etag,
    });

    const response = await client.send(updateCommand);

    logger.info(`✅ Updated CloudFront distribution: ${distributionId}`);

    return {
      distributionId: response.Distribution.Id,
      status: response.Distribution.Status,
    };
  } catch (error) {
    logger.error(
      `❌ Failed to update CloudFront distribution ${distributionId}:`,
      error
    );
    throw new Error(`Failed to update distribution: ${error.message}`);
  }
};

/**
 * Delete CloudFront distribution
 * @param {string} distributionId - Distribution ID
 * @returns {boolean} Success status
 */
const deleteDistribution = async (distributionId) => {
  try {
    const client = getCloudFrontClient();

    // First, disable the distribution
    const configCommand = new GetDistributionConfigCommand({
      Id: distributionId,
    });

    const configResponse = await client.send(configCommand);
    const config = configResponse.DistributionConfig;
    const etag = configResponse.ETag;

    if (config.Enabled) {
      config.Enabled = false;

      const updateCommand = new UpdateDistributionCommand({
        Id: distributionId,
        DistributionConfig: config,
        IfMatch: etag,
      });

      await client.send(updateCommand);

      logger.info(
        `✅ Disabled CloudFront distribution: ${distributionId}. Waiting for deployment...`
      );

      // Wait for distribution to be deployed (disabled)
      await waitForDistributionDeployed(distributionId);
    }

    // Get new ETag after disabling
    const newConfigResponse = await client.send(configCommand);
    const newEtag = newConfigResponse.ETag;

    // Now delete the distribution
    const deleteCommand = new DeleteDistributionCommand({
      Id: distributionId,
      IfMatch: newEtag,
    });

    await client.send(deleteCommand);

    logger.info(`✅ Deleted CloudFront distribution: ${distributionId}`);
    return true;
  } catch (error) {
    logger.error(
      `❌ Failed to delete CloudFront distribution ${distributionId}:`,
      error
    );
    throw new Error(`Failed to delete distribution: ${error.message}`);
  }
};

/**
 * Create cache invalidation (clear CDN cache)
 * @param {string} distributionId - Distribution ID
 * @param {Array} paths - Paths to invalidate (default: all)
 * @returns {Object} Invalidation details
 */
const createInvalidation = async (distributionId, paths = ['/*']) => {
  try {
    const client = getCloudFrontClient();

    const command = new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `invalidation-${Date.now()}`,
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
      },
    });

    const response = await client.send(command);

    logger.info(`✅ Created invalidation for distribution: ${distributionId}`);

    return {
      invalidationId: response.Invalidation.Id,
      status: response.Invalidation.Status,
      createTime: response.Invalidation.CreateTime,
    };
  } catch (error) {
    logger.error(
      `❌ Failed to create invalidation for ${distributionId}:`,
      error
    );
    throw new Error(`Failed to create invalidation: ${error.message}`);
  }
};

/**
 * Wait for distribution to be deployed
 * @param {string} distributionId - Distribution ID
 * @param {number} maxWaitTime - Maximum wait time in seconds (default: 600)
 * @returns {boolean} Deployed status
 */
const waitForDistributionDeployed = async (
  distributionId,
  maxWaitTime = 600
) => {
  const startTime = Date.now();
  const maxWaitMs = maxWaitTime * 1000;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const distribution = await getDistribution(distributionId);

      if (distribution.status === 'Deployed') {
        logger.info(`✅ Distribution ${distributionId} is deployed`);
        return true;
      }

      logger.info(
        `⏳ Waiting for distribution ${distributionId} to deploy... (Status: ${distribution.status})`
      );

      // Wait 30 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 30000));
    } catch (error) {
      logger.error(
        `❌ Error checking distribution status for ${distributionId}:`,
        error
      );
      throw error;
    }
  }

  throw new Error(
    `Distribution ${distributionId} did not deploy within ${maxWaitTime} seconds`
  );
};

/**
 * List all CloudFront distributions
 * @returns {Array} List of distributions
 */
const listDistributions = async () => {
  try {
    const client = getCloudFrontClient();

    const command = new ListDistributionsCommand({});
    const response = await client.send(command);

    const distributions =
      response.DistributionList?.Items?.map((dist) => ({
        distributionId: dist.Id,
        domainName: dist.DomainName,
        status: dist.Status,
        enabled: dist.Enabled,
        aliases: dist.Aliases?.Items || [],
      })) || [];

    return distributions;
  } catch (error) {
    logger.error('❌ Failed to list CloudFront distributions:', error);
    throw new Error(`Failed to list distributions: ${error.message}`);
  }
};

export {
  createDistribution,
  getDistribution,
  updateDistribution,
  deleteDistribution,
  createInvalidation,
  waitForDistributionDeployed,
  listDistributions,
};
