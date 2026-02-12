import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteBucketPolicyCommand,
  DeleteObjectCommand,
  GetBucketLocationCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutBucketWebsiteCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

import { getS3Client } from './aws.config.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import logger from '../../utils/logger.js';

/**
 * Generate a unique bucket name
 * @param {string} domainName - Domain name
 * @returns {string} Bucket name
 */
const generateBucketName = (domainName) => {
  // S3 bucket names must be globally unique and DNS compliant
  // Remove special characters and convert to lowercase
  const cleanDomain = domainName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const timestamp = Date.now();
  return `saasify-${cleanDomain}-${timestamp}`;
};

/**
 * Create S3 bucket for static website hosting
 * @param {string} domainName - Domain name
 * @param {string} region - AWS region
 * @returns {Object} Bucket details
 */
const createBucket = async (domainName, region = 'us-east-1') => {
  try {
    const client = getS3Client();
    const bucketName = generateBucketName(domainName);

    // Create bucket
    const createCommand = new CreateBucketCommand({
      Bucket: bucketName,
      ...(region !== 'us-east-1' && {
        CreateBucketConfiguration: {
          LocationConstraint: region,
        },
      }),
    });

    await client.send(createCommand);

    logger.info(`✅ Created S3 bucket: ${bucketName}`);

    return {
      bucketName,
      region,
      bucketUrl: `${bucketName}.s3.${region}.amazonaws.com`,
    };
  } catch (error) {
    logger.error(`❌ Failed to create S3 bucket for ${domainName}:`, error);
    throw new Error(`Failed to create S3 bucket: ${error.message}`);
  }
};

/**
 * Configure bucket for static website hosting
 * @param {string} bucketName - S3 bucket name
 * @param {string} indexDocument - Index document (default: index.html)
 * @param {string} errorDocument - Error document (default: error.html)
 * @returns {Object} Website configuration
 */
const configureStaticWebsite = async (
  bucketName,
  indexDocument = 'index.html',
  errorDocument = 'error.html'
) => {
  try {
    const client = getS3Client();

    // Configure website hosting
    const websiteCommand = new PutBucketWebsiteCommand({
      Bucket: bucketName,
      WebsiteConfiguration: {
        IndexDocument: {
          Suffix: indexDocument,
        },
        ErrorDocument: {
          Key: errorDocument,
        },
      },
    });

    await client.send(websiteCommand);

    logger.info(`✅ Configured static website hosting for ${bucketName}`);

    const region = await getBucketRegion(bucketName);
    const websiteUrl = `http://${bucketName}.s3-website-${region}.amazonaws.com`;

    return {
      websiteUrl,
      indexDocument,
      errorDocument,
    };
  } catch (error) {
    logger.error(
      `❌ Failed to configure static website for ${bucketName}:`,
      error
    );
    throw new Error(`Failed to configure static website: ${error.message}`);
  }
};

/**
 * Set bucket policy for public read access
 * @param {string} bucketName - S3 bucket name
 * @returns {boolean} Success status
 */
const setBucketPolicy = async (bucketName) => {
  try {
    const client = getS3Client();

    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`,
        },
      ],
    };

    const command = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy),
    });

    await client.send(command);

    logger.info(`✅ Set public read policy for ${bucketName}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to set bucket policy for ${bucketName}:`, error);
    throw new Error(`Failed to set bucket policy: ${error.message}`);
  }
};

/**
 * Configure CORS for bucket
 * @param {string} bucketName - S3 bucket name
 * @returns {boolean} Success status
 */
const configureCors = async (bucketName) => {
  try {
    const client = getS3Client();

    const corsRules = [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedOrigins: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3000,
      },
    ];

    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: corsRules,
      },
    });

    await client.send(command);

    logger.info(`✅ Configured CORS for ${bucketName}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to configure CORS for ${bucketName}:`, error);
    throw new Error(`Failed to configure CORS: ${error.message}`);
  }
};

/**
 * Get bucket region
 * @param {string} bucketName - S3 bucket name
 * @returns {string} Region
 */
const getBucketRegion = async (bucketName) => {
  try {
    const client = getS3Client();

    const command = new GetBucketLocationCommand({
      Bucket: bucketName,
    });

    const response = await client.send(command);
    // LocationConstraint is null for us-east-1
    return response.LocationConstraint || 'us-east-1';
  } catch (error) {
    logger.error(`❌ Failed to get bucket region for ${bucketName}:`, error);
    return 'us-east-1';
  }
};

/**
 * Generate pre-signed URL for file upload
 * @param {string} bucketName - S3 bucket name
 * @param {string} key - File key/path
 * @param {number} expiresIn - URL expiry in seconds (default: 1 hour)
 * @returns {string} Pre-signed URL
 */
const generateUploadUrl = async (
  bucketName,
  key,
  expiresIn = 3600,
  contentType = 'application/octet-stream'
) => {
  try {
    const client = getS3Client();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn });

    logger.info(`✅ Generated upload URL for ${bucketName}/${key}`);
    return signedUrl;
  } catch (error) {
    logger.error(
      `❌ Failed to generate upload URL for ${bucketName}/${key}:`,
      error
    );
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
};

/**
 * Upload file to S3 bucket
 * @param {string} bucketName - S3 bucket name
 * @param {string} key - File key/path
 * @param {Buffer} body - File content
 * @param {string} contentType - MIME type
 * @returns {Object} Upload result
 */
const uploadFile = async (bucketName, key, body, contentType) => {
  try {
    const client = getS3Client();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    const response = await client.send(command);

    logger.info(`✅ Uploaded file to ${bucketName}/${key}`);

    return {
      key,
      etag: response.ETag,
      url: `https://${bucketName}.s3.amazonaws.com/${key}`,
    };
  } catch (error) {
    logger.error(`❌ Failed to upload file to ${bucketName}/${key}:`, error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Delete file from S3 bucket
 * @param {string} bucketName - S3 bucket name
 * @param {string} key - File key/path
 * @returns {boolean} Success status
 */
const deleteFile = async (bucketName, key) => {
  try {
    const client = getS3Client();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);

    logger.info(`✅ Deleted file ${bucketName}/${key}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to delete file ${bucketName}/${key}:`, error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * List files in bucket
 * @param {string} bucketName - S3 bucket name
 * @param {string} prefix - Prefix/folder (optional)
 * @returns {Array} List of files
 */
const listFiles = async (bucketName, prefix = '') => {
  try {
    const client = getS3Client();

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const response = await client.send(command);

    const files = (response.Contents || []).map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: `https://${bucketName}.s3.amazonaws.com/${item.Key}`,
    }));

    return files;
  } catch (error) {
    logger.error(`❌ Failed to list files in ${bucketName}:`, error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
};

/**
 * Delete all files in bucket
 * @param {string} bucketName - S3 bucket name
 * @returns {number} Number of files deleted
 */
const deleteAllFiles = async (bucketName) => {
  try {
    const files = await listFiles(bucketName);

    for (const file of files) {
      await deleteFile(bucketName, file.key);
    }

    logger.info(`✅ Deleted ${files.length} files from ${bucketName}`);
    return files.length;
  } catch (error) {
    logger.error(`❌ Failed to delete all files from ${bucketName}:`, error);
    throw new Error(`Failed to delete all files: ${error.message}`);
  }
};

/**
 * Delete S3 bucket
 * @param {string} bucketName - S3 bucket name
 * @returns {boolean} Success status
 */
const deleteBucket = async (bucketName) => {
  try {
    const client = getS3Client();

    // Delete all files first
    await deleteAllFiles(bucketName);

    // Delete bucket policy
    try {
      const policyCommand = new DeleteBucketPolicyCommand({
        Bucket: bucketName,
      });
      await client.send(policyCommand);
    } catch (err) {
      // Policy might not exist, ignore error
    }

    // Delete bucket
    const command = new DeleteBucketCommand({
      Bucket: bucketName,
    });

    await client.send(command);

    logger.info(`✅ Deleted S3 bucket: ${bucketName}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to delete S3 bucket ${bucketName}:`, error);
    throw new Error(`Failed to delete S3 bucket: ${error.message}`);
  }
};

/**
 * Check if bucket exists
 * @param {string} bucketName - S3 bucket name
 * @returns {boolean} Exists status
 */
const bucketExists = async (bucketName) => {
  try {
    const client = getS3Client();

    const command = new HeadBucketCommand({
      Bucket: bucketName,
    });

    await client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Get bucket size (total storage used)
 * @param {string} bucketName - S3 bucket name
 * @returns {Object} Storage stats
 */
const getBucketSize = async (bucketName) => {
  try {
    const files = await listFiles(bucketName);

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileCount = files.length;

    return {
      totalSize, // in bytes
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      fileCount,
    };
  } catch (error) {
    logger.error(`❌ Failed to get bucket size for ${bucketName}:`, error);
    throw new Error(`Failed to get bucket size: ${error.message}`);
  }
};

export {
  generateBucketName,
  createBucket,
  configureStaticWebsite,
  setBucketPolicy,
  configureCors,
  getBucketRegion,
  generateUploadUrl,
  uploadFile,
  deleteFile,
  listFiles,
  deleteAllFiles,
  deleteBucket,
  bucketExists,
  getBucketSize,
};
