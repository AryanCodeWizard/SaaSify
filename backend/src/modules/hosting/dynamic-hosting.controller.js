import * as ec2Service from '../aws/ec2.service.js';

import { addDynamicProvisioningJob, addDynamicTerminationJob } from '../../queues/dynamicHosting.queue.js';
import { errorResponse, successResponse } from '../../utils/response.js';

import Domain from '../../models/Domain.js';
import HostingService from '../../models/HostingService.js';
import logger from '../../utils/logger.js';

/**
 * Create dynamic hosting service (EC2 + optional RDS)
 * @route POST /api/hosting/dynamic/create
 */
export const createDynamicHosting = async (req, res) => {
  try {
    const {
      domainId,
      domainName,
      plan,
      instanceType = 't3.micro',
      runtime = 'docker',
      appPort = 3000,
      database = null,
    } = req.body;
    const userId = req.user.userId; // Fixed: was req.user.id

    // Get client ID for the user
    const Client = (await import('../../models/Client.js')).default;
    const client = await Client.findOne({ userId });
    if (!client) {
      return errorResponse(res, 'Client profile not found', 404);
    }

    // Validate input
    if ((!domainId && !domainName) || !plan) {
      return errorResponse(res, 'Domain ID or domain name and plan are required', 400);
    }

    let domain;
    
    // Get or create domain
    if (domainId) {
      domain = await Domain.findOne({
        _id: domainId,
        clientId: client._id,
      });
      
      if (!domain) {
        return errorResponse(res, 'Domain not found', 404);
      }
    } else {
      // Look up by domain name or create new
      domain = await Domain.findOne({
        domainName: domainName,
        clientId: client._id,
      });
      
      if (!domain) {
        // Create new domain record for hosting (external domain)
        domain = new Domain({
          clientId: client._id,
          orderId: null, // No order for externally registered domains
          domainName: domainName,
          tld: domainName.split('.').pop() || 'com',
          status: 'active',
          registrar: 'other', // Changed from 'external' to valid enum value
          autoRenew: false,
          yearsPurchased: 1,
          registrationPrice: 0, // External domain - no registration cost
          renewalPrice: 0,
          registrationDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          whoisPrivacy: {
            enabled: false,
            price: 0,
          },
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
      type: 'dynamic',
      status: 'provisioning',
      plan: {
        name: plan.name || 'Basic Dynamic',
        price: plan.price || 15,
        billingCycle: plan.billingCycle || 'monthly',
        specs: {
          vcpu: plan.vcpu || 1,
          memory: plan.memory || 1024,
          storage: plan.storage || 20000,
          bandwidth: plan.bandwidth || 100,
        },
      },
      dynamic: {
        instanceType,
        runtime,
        appPort,
        database: database
          ? {
              enabled: true,
              engine: database.engine || 'mysql',
              instanceClass: database.instanceClass || 'db.t3.micro',
            }
          : { enabled: false },
      },
      billing: {
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      },
      provisioning: {
        startedAt: new Date(),
        steps: [],
        logs: [],
      },
    });

    // Add provisioning steps
    hostingService.addProvisioningStep('create_security_group');
    hostingService.addProvisioningStep('create_key_pair');
    hostingService.addProvisioningStep('launch_ec2_instance');
    hostingService.addProvisioningStep('wait_for_instance_running');
    hostingService.addProvisioningStep('allocate_elastic_ip');
    
    if (database?.enabled) {
      hostingService.addProvisioningStep('create_rds_database');
      hostingService.addProvisioningStep('wait_for_database_available');
    }
    
    if (domain.aws?.hostedZoneId) {
      hostingService.addProvisioningStep('update_dns_records');
    }

    await hostingService.save();

    // Add provisioning job to queue
    await addDynamicProvisioningJob(hostingService._id, {
      database: database?.enabled || false,
    });

    return successResponse(
      res,
      {
        _id: hostingService._id,
        id: hostingService._id,
        domainName: hostingService.domainName,
        status: hostingService.status,
        type: hostingService.type,
        instanceType,
        runtime,
      },
      'Dynamic hosting provisioning started'
    );
  } catch (error) {
    logger.error('❌ Error creating dynamic hosting:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get hosting service details
 * @route GET /api/hosting/dynamic/:id
 */
export const getHostingService = async (req, res) => {
  try {
    const {id } = req.params;
    const userId = req.user.userId;

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
      type: 'dynamic',
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
 * List all dynamic hosting services for user
 * @route GET /api/hosting/dynamic
 */
export const listHostingServices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const filter = { user: userId, type: 'dynamic' };
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
 * Get SSH connection information
 * @route GET /api/hosting/dynamic/:id/ssh
 */
export const getSshInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
      type: 'dynamic',
    });

    if (!hostingService) {
      return errorResponse(res, 'Hosting service not found', 404);
    }

    if (hostingService.status !== 'active') {
      return errorResponse(res, 'Hosting service is not active', 400);
    }

    const publicIp =
      hostingService.dynamic.elasticIp?.publicIp ||
      hostingService.dynamic.publicIp;

    if (!publicIp) {
      return errorResponse(res, 'No public IP available', 404);
    }

    const sshInfo = {
      host: publicIp,
      port: hostingService.dynamic.sshPort || 22,
      username: 'ubuntu',
      keyName: hostingService.dynamic.keyName,
      command: `ssh -i ~/.ssh/${hostingService.dynamic.keyName}.pem ubuntu@${publicIp}`,
      note: 'Download private key from initial provisioning response or contact support',
    };

    return successResponse(res, 'SSH information retrieved successfully', {
      ssh: sshInfo,
    });
  } catch (error) {
    logger.error('❌ Error getting SSH info:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get database connection information
 * @route GET /api/hosting/dynamic/:id/database
 */
export const getDatabaseInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
      type: 'dynamic',
    });

    if (!hostingService) {
      return errorResponse(res, 'Hosting service not found', 404);
    }

    if (!hostingService.dynamic.database?.enabled) {
      return errorResponse(res, 'Database not enabled for this hosting', 400);
    }

    const db = hostingService.dynamic.database;

    if (!db.endpoint) {
      return errorResponse(res, 'Database not yet provisioned', 404);
    }

    const dbInfo = {
      engine: db.engine,
      endpoint: db.endpoint,
      port: db.port,
      name: db.name,
      username: db.username,
      status: db.status,
      note: 'Database password was provided during initial provisioning or can be reset',
    };

    return successResponse(res, 'Database information retrieved successfully', {
      database: dbInfo,
    });
  } catch (error) {
    logger.error('❌ Error getting database info:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get instance metrics and status
 * @route GET /api/hosting/dynamic/:id/status
 */
export const getInstanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
      type: 'dynamic',
    });

    if (!hostingService) {
      return errorResponse(res, 'Hosting service not found', 404);
    }

    if (!hostingService.dynamic.instanceId) {
      return errorResponse(res, 'Instance not yet provisioned', 404);
    }

    // Get real-time instance status from AWS
    try {
      const instance = await ec2Service.getInstance(
        hostingService.dynamic.instanceId
      );

      // Update instance state
      hostingService.dynamic.instanceState = instance.state;
      hostingService.dynamic.publicIp = instance.publicIp;
      hostingService.dynamic.privateIp = instance.privateIp;
      await hostingService.save();

      return successResponse(res, 'Instance status retrieved successfully', {
        instance: {
          instanceId: instance.instanceId,
          instanceType: instance.instanceType,
          state: instance.state,
          publicIp: instance.publicIp,
          privateIp: instance.privateIp,
          launchTime: instance.launchTime,
        },
      });
    } catch (error) {
      logger.error('Error getting instance from AWS:', error);
      
      // Return cached data if AWS call fails
      return successResponse(res, 'Instance status (cached)', {
        instance: {
          instanceId: hostingService.dynamic.instanceId,
          instanceType: hostingService.dynamic.instanceType,
          state: hostingService.dynamic.instanceState,
          publicIp: hostingService.dynamic.publicIp,
          privateIp: hostingService.dynamic.privateIp,
          note: 'Real-time status unavailable, showing cached data',
        },
      });
    }
  } catch (error) {
    logger.error('❌ Error getting instance status:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Terminate hosting service
 * @route DELETE /api/hosting/dynamic/:id
 */
export const terminateHosting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const hostingService = await HostingService.findOne({
      _id: id,
      user: userId,
      type: 'dynamic',
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
    await addDynamicTerminationJob(hostingService._id);

    return successResponse(res, 'Hosting termination started');
  } catch (error) {
    logger.error('❌ Error terminating hosting:', error);
    return errorResponse(res, error.message, 500);
  }
};
