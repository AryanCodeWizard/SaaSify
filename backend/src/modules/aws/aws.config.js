import {
  ListHostedZonesCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';

import { ACMClient } from '@aws-sdk/client-acm';
import { CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { EC2Client } from '@aws-sdk/client-ec2';
import { RDSClient } from '@aws-sdk/client-rds';
import { S3Client } from '@aws-sdk/client-s3';
import logger from '../../utils/logger.js';

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// Validate AWS credentials
const validateAwsCredentials = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    logger.warn(
      'AWS credentials not configured. AWS services will not be available.'
    );
    return false;
  }
  return true;
};

// Initialize AWS clients
let route53Client = null;
let s3Client = null;
let ec2Client = null;
let rdsClient = null;
let acmClient = null;
let cloudFrontClient = null;

// Get AWS region from environment or default
const getAwsRegion = () => process.env.AWS_REGION || 'us-east-1';

const initializeAwsClients = () => {
  if (!validateAwsCredentials()) {
    return false;
  }

  try {
    // Initialize Route53 client
    route53Client = new Route53Client(awsConfig);

    // Initialize S3 client
    s3Client = new S3Client(awsConfig);

    // Initialize EC2 client
    ec2Client = new EC2Client(awsConfig);

    // Initialize RDS client
    rdsClient = new RDSClient(awsConfig);

    // Initialize ACM client (for SSL certificates)
    acmClient = new ACMClient(awsConfig);

    // Initialize CloudFront client (for CDN)
    cloudFrontClient = new CloudFrontClient(awsConfig);

    logger.info('✅ AWS clients initialized successfully');
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize AWS clients:', error);
    return false;
  }
};

// Test AWS connectivity
const testAwsConnection = async () => {
  try {
    if (!route53Client) {
      throw new Error('AWS clients not initialized');
    }

    // Test Route53 connection
    const command = new ListHostedZonesCommand({ MaxItems: '1' });
    await route53Client.send(command);

    logger.info('✅ AWS connection test successful');
    return true;
  } catch (error) {
    logger.error('❌ AWS connection test failed:', error.message);
    return false;
  }
};

// Get AWS clients
const getRoute53Client = () => {
  if (!route53Client) {
    throw new Error('Route53 client not initialized. Check AWS credentials.');
  }
  return route53Client;
};

const getS3Client = () => {
  if (!s3Client) {
    throw new Error('S3 client not initialized. Check AWS credentials.');
  }
  return s3Client;
};

const getEC2Client = () => {
  if (!ec2Client) {
    throw new Error('EC2 client not initialized. Check AWS credentials.');
  }
  return ec2Client;
};

const getRdsClient = () => {
  if (!rdsClient) {
    throw new Error('RDS client not initialized. Check AWS credentials.');
  }
  return rdsClient;
};

const getACMClient = () => {
  if (!acmClient) {
    throw new Error('ACM client not initialized. Check AWS credentials.');
  }
  return acmClient;
};

const getCloudFrontClient = () => {
  if (!cloudFrontClient) {
    throw new Error(
      'CloudFront client not initialized. Check AWS credentials.'
    );
  }
  return cloudFrontClient;
};

// Export configuration and clients
export {
  awsConfig,
  validateAwsCredentials,
  initializeAwsClients,
  testAwsConnection,
  getRoute53Client,
  getS3Client,
  getEC2Client,
  getRdsClient,
  getACMClient,
  getCloudFrontClient,
  getAwsRegion,
};
