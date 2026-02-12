import * as cloudfrontService from '../aws/cloudfront.service.js';
import * as s3Service from '../aws/s3.service.js';

import { addProvisioningJob, addTerminationJob } from '../../queues/hosting.queue.js';
import { errorResponse, successResponse } from '../../utils/response.js';

import Domain from '../../models/Domain.js';
import HostingService from '../../models/HostingService.js';
import logger from '../../utils/logger.js';

/**
 * Create static hosting service
 * @route POST /api/hosting/static/create
 */
const createStaticHosting = async (req, res) => {
  try {
    const { domainId, domainName, plan, enableSsl = true } = req.body;
    const userId = req.user.id;

    // Validate input
    if ((!domainId && !domainName) || !plan) {
      return errorResponse(res, 'Domain ID or domain name and plan are required', 400);
    }

    let domain;
    
    // Get or create domain
    if (domainId) {
      domain = await Domain.findOne({
        _id: domainId,
        clientId: userId,
      });
      
      if (!domain) {
        return errorResponse(res, 'Domain not found', 404);
      }
    } else {
      // Look up by domain name or create new
      domain = await Domain.findOne({
        domainName: domainName,
        clientId: userId,
      });
      
      if (!domain) {
        // Create new domain record for hosting
        domain = new Domain({
          clientId: userId,
          domainName: domainName,
          status: 'active',
          registrar: 'external', // Assuming external domain
          autoRenew: false,
        });
        await domain.save();
      }
    }

    // Check if hosting already exists for this domain
    const existingHosting = await HostingService.findOne({
      domain: domain._id,
      status: { $nin: ['terminated'] },
    });

    if (existingHosting) {
      return errorResponse(
        res,
        'Hosting service already exists for this domain',
        400
      );
    }

    // Create hosting service record
    const hostingService = new HostingService({
      user: userId,
      domain: domain._id,
      domainName: domain.domainName,
      type: 'static',
      status: 'provisioning',
      plan: {
        name: plan.name || 'Basic Static',
        price: plan.price || 5,
        billingCycle: plan.billingCycle || 'monthly',
        specs: {
          storage: plan.storage || 10000, // 10GB
          bandwidth: plan.bandwidth || 100, // 100GB
        },
      },
      billing: {
        nextBillingDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ), // 30 days from now
        autoRenew: true,
      },
      provisioning: {
        startedAt: new Date(),
        steps: [],
        logs: [],
      },
    });

    // Add provisioning steps
    hostingService.addProvisioningStep('create_s3_bucket');
    hostingService.addProvisioningStep('configure_static_website');
    hostingService.addProvisioningStep('set_bucket_policy');
    hostingService.addProvisioningStep('configure_cors');
    if (enableSsl) {
      hostingService.addProvisioningStep('request_ssl_certificate');
      hostingService.addProvisioningStep('validate_ssl_certificate');
    }
    hostingService.addProvisioningStep('create_cloudfront_distribution');
    if (domain.aws?.hostedZoneId) {
      hostingService.addProvisioningStep('update_dns_records');
    }

    await hostingService.save();

    // Add provisioning job to queue
    await addProvisioningJob(hostingService._id, enableSsl);

    return successResponse(
      res,
      {
        _id: hostingService._id,
        id: hostingService._id,
        domainName: hostingService.domainName,
        status: hostingService.status,
        type: hostingService.type,
      },
      'Static hosting provisioning started'
    );
  } catch (error) {
    logger.error('❌ Error creating static hosting:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get hosting service details
 * @route GET /api/hosting/static/:id
 */
const getHostingService = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
    }).populate('domain', 'domainName status');

    if (!hostingService) {
      return errorResponse(res, 'Hosting service not found', 404);
    }

    return successResponse(res, 'Hosting service retrieved successfully', {
      hostingService,
    });
  } catch (error) {
    logger.error('❌ Error getting hosting service:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * List all hosting services for user
 * @route GET /api/hosting/static
 */
const listHostingServices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status } = req.query;

    const filter = { user: userId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const hostingServices = await HostingService.find(filter)
      .populate('domain', 'domainName status')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Hosting services retrieved successfully', {
      hostingServices,
      total: hostingServices.length,
    });
  } catch (error) {
    logger.error('❌ Error listing hosting services:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Generate pre-signed URL for file upload
 * @route POST /api/hosting/static/:id/upload-url
 */
const generateUploadUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, contentType } = req.body;
    const userId = req.user.id;

    if (!fileName) {
      return errorResponse(res, 'File name is required', 400);
    }

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
    });

    if (!hostingService) {
      return errorResponse(res, 'Hosting service not found', 404);
    }

    if (hostingService.type !== 'static') {
      return errorResponse(res, 'Not a static hosting service', 400);
    }

    const uploadUrl = await s3Service.generateUploadUrl(
      hostingService.static.bucketName,
      fileName,
      3600,
      contentType || 'application/octet-stream'
    );

    return successResponse(res, 'Upload URL generated successfully', {
      uploadUrl,
      fileName,
      expiresIn: 3600,
    });
  } catch (error) {
    logger.error('❌ Error generating upload URL:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * List files in hosting
 * @route GET /api/hosting/static/:id/files
 */
const listFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
    });

    if (!hostingService) {
      return errorResponse(res, 'Hosting service not found', 404);
    }

    const files = await s3Service.listFiles(hostingService.static.bucketName);

    // Update storage usage
    const bucketSize = await s3Service.getBucketSize(
      hostingService.static.bucketName
    );
    hostingService.usage.storage.used = parseFloat(bucketSize.totalSizeMB);
    await hostingService.save();

    return successResponse(res, 'Files retrieved successfully', {
      files,
      totalFiles: files.length,
      storageUsed: bucketSize,
    });
  } catch (error) {
    logger.error('❌ Error listing files:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete file from hosting
 * @route DELETE /api/hosting/static/:id/files
 */
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName } = req.body;
    const userId = req.user.id;

    if (!fileName) {
      return errorResponse(res, 'File name is required', 400);
    }

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
    });

    if (!hostingService) {
      return errorResponse(res, 'Hosting service not found', 404);
    }

    await s3Service.deleteFile(hostingService.static.bucketName, fileName);

    return successResponse(res, 'File deleted successfully');
  } catch (error) {
    logger.error('❌ Error deleting file:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Invalidate CloudFront cache
 * @route POST /api/hosting/static/:id/invalidate
 */
const invalidateCache = async (req, res) => {
  try {
    const { id } = req.params;
    const { paths = ['/*'] } = req.body;
    const userId = req.user.id;

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
    });

    if (!hostingService) {
      return errorResponse(res, 'Hosting service not found', 404);
    }

    if (!hostingService.static.cloudfrontId) {
      return errorResponse(res, 'CloudFront distribution not found', 404);
    }

    const invalidation = await cloudfrontService.createInvalidation(
      hostingService.static.cloudfrontId,
      paths
    );

    return successResponse(res, 'Cache invalidation created successfully', {
      invalidation,
    });
  } catch (error) {
    logger.error('❌ Error invalidating cache:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Terminate hosting service
 * @route DELETE /api/hosting/static/:id
 */
const terminateHosting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
    });

    if (!hostingService) {
      return errorResponse(res, 'Hosting service not found', 404);
    }

    if (!hostingService.canTerminate()) {
      return errorResponse(
        res,
        'Hosting service cannot be terminated in current state',
        400
      );
    }

    hostingService.status = 'terminating';
    await hostingService.save();

    // Add termination job to queue
    await addTerminationJob(hostingService._id);

    return successResponse(res, 'Hosting termination started');
  } catch (error) {
    logger.error('❌ Error terminating hosting:', error);
    return errorResponse(res, error.message, 500);
  }
};

export {
  createStaticHosting,
  getHostingService,
  listHostingServices,
  generateUploadUrl,
  listFiles,
  deleteFile,
  invalidateCache,
  terminateHosting,
};
