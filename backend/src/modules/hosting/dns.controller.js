import * as route53Service from '../aws/route53.service.js';

import { errorResponse, successResponse } from '../../utils/response.js';

import Domain from '../../models/Domain.js';
import logger from '../../utils/logger.js';

/**
 * Create Route53 hosted zone for a domain
 * @route POST /api/hosting/dns/zones
 */
const createHostedZone = async (req, res) => {
  try {
    const { domainId } = req.body;
    const userId = req.user.id;

    // Find the domain
    const domain = await Domain.findOne({
      _id: domainId,
      clientId: userId,
    });

    if (!domain) {
      return errorResponse(res, 'Domain not found', 404);
    }

    // Check if hosted zone already exists
    if (domain.aws.hostedZoneId) {
      return errorResponse(
        res,
        'Hosted zone already exists for this domain',
        400
      );
    }

    // Create hosted zone in Route53
    const hostedZone = await route53Service.createHostedZone(
      domain.domainName
    );

    // Update domain with AWS details
    domain.aws = {
      hostedZoneId: hostedZone.hostedZoneId,
      hostedZoneName: hostedZone.name,
      nameServers: hostedZone.nameServers,
      recordSetCount: hostedZone.resourceRecordSetCount,
      route53Enabled: true,
      dnsPropagationStatus: 'pending',
      lastDnsSync: new Date(),
    };

    await domain.save();

    logger.info(`✅ Created hosted zone for domain ${domain.domainName}`, {
      userId,
      domainId,
    });

    return successResponse(res, 'Hosted zone created successfully', {
      domain: {
        id: domain._id,
        name: domain.domainName,
        hostedZoneId: hostedZone.hostedZoneId,
        nameServers: hostedZone.nameServers,
      },
    });
  } catch (error) {
    logger.error('❌ Error creating hosted zone:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get hosted zone details
 * @route GET /api/hosting/dns/zones/:domainId
 */
const getHostedZone = async (req, res) => {
  try {
    const { domainId } = req.params;
    const userId = req.user.id;

    const domain = await Domain.findOne({
      _id: domainId,
      clientId: userId,
    });

    if (!domain) {
      return errorResponse(res, 'Domain not found', 404);
    }

    if (!domain.aws.hostedZoneId) {
      return errorResponse(res, 'No hosted zone found for this domain', 404);
    }

    // Get hosted zone details from Route53
    const hostedZone = await route53Service.getHostedZone(
      domain.aws.hostedZoneId
    );

    return successResponse(res, 'Hosted zone retrieved successfully', {
      domain: {
        id: domain._id,
        name: domain.domainName,
      },
      hostedZone,
    });
  } catch (error) {
    logger.error('❌ Error getting hosted zone:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete hosted zone
 * @route DELETE /api/hosting/dns/zones/:domainId
 */
const deleteHostedZone = async (req, res) => {
  try {
    const { domainId } = req.params;
    const userId = req.user.id;

    const domain = await Domain.findOne({
      _id: domainId,
      clientId: userId,
    });

    if (!domain) {
      return errorResponse(res, 'Domain not found', 404);
    }

    if (!domain.aws.hostedZoneId) {
      return errorResponse(res, 'No hosted zone found for this domain', 404);
    }

    // Delete hosted zone from Route53
    await route53Service.deleteHostedZone(domain.aws.hostedZoneId);

    // Clear AWS data from domain
    domain.aws = {
      hostedZoneId: null,
      hostedZoneName: null,
      nameServers: [],
      recordSetCount: 0,
      route53Enabled: false,
      dnsPropagationStatus: 'pending',
    };

    await domain.save();

    logger.info(`✅ Deleted hosted zone for domain ${domain.domainName}`, {
      userId,
      domainId,
    });

    return successResponse(res, 'Hosted zone deleted successfully');
  } catch (error) {
    logger.error('❌ Error deleting hosted zone:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * List all DNS records for a domain
 * @route GET /api/hosting/dns/records/:domainId
 */
const listDnsRecords = async (req, res) => {
  try {
    const { domainId } = req.params;
    const userId = req.user.id;

    const domain = await Domain.findOne({
      _id: domainId,
      clientId: userId,
    });

    if (!domain) {
      return errorResponse(res, 'Domain not found', 404);
    }

    if (!domain.aws.hostedZoneId) {
      return errorResponse(res, 'No hosted zone found for this domain', 404);
    }

    // Get DNS records from Route53
    const records = await route53Service.listDnsRecords(
      domain.aws.hostedZoneId
    );

    return successResponse(res, 'DNS records retrieved successfully', {
      domain: {
        id: domain._id,
        name: domain.domainName,
      },
      records,
      totalRecords: records.length,
    });
  } catch (error) {
    logger.error('❌ Error listing DNS records:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create or update a DNS record
 * @route POST /api/hosting/dns/records/:domainId
 */
const upsertDnsRecord = async (req, res) => {
  try {
    const { domainId } = req.params;
    const { name, type, ttl, values } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || !type || !values || !Array.isArray(values)) {
      return errorResponse(
        res,
        'Name, type, and values (array) are required',
        400
      );
    }

    const domain = await Domain.findOne({
      _id: domainId,
      clientId: userId,
    });

    if (!domain) {
      return errorResponse(res, 'Domain not found', 404);
    }

    if (!domain.aws.hostedZoneId) {
      return errorResponse(res, 'No hosted zone found for this domain', 404);
    }

    // Create/update DNS record in Route53
    const changeInfo = await route53Service.upsertDnsRecord(
      domain.aws.hostedZoneId,
      {
        name,
        type,
        ttl: ttl || 300,
        values,
      }
    );

    // Update domain's last sync time
    domain.aws.lastDnsSync = new Date();
    domain.aws.dnsPropagationStatus = 'propagating';
    await domain.save();

    logger.info(`✅ Upserted DNS record for ${domain.domainName}`, {
      userId,
      domainId,
      recordType: type,
    });

    return successResponse(res, 'DNS record created/updated successfully', {
      changeInfo,
      record: { name, type, ttl, values },
    });
  } catch (error) {
    logger.error('❌ Error upserting DNS record:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete a DNS record
 * @route DELETE /api/hosting/dns/records/:domainId
 */
const deleteDnsRecord = async (req, res) => {
  try {
    const { domainId } = req.params;
    const { name, type, ttl, values } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || !type || !values) {
      return errorResponse(res, 'Name, type, and values are required', 400);
    }

    const domain = await Domain.findOne({
      _id: domainId,
      clientId: userId,
    });

    if (!domain) {
      return errorResponse(res, 'Domain not found', 404);
    }

    if (!domain.aws.hostedZoneId) {
      return errorResponse(res, 'No hosted zone found for this domain', 404);
    }

    // Delete DNS record from Route53
    const changeInfo = await route53Service.deleteDnsRecord(
      domain.aws.hostedZoneId,
      {
        name,
        type,
        ttl: ttl || 300,
        values,
      }
    );

    // Update domain's last sync time
    domain.aws.lastDnsSync = new Date();
    await domain.save();

    logger.info(`✅ Deleted DNS record for ${domain.domainName}`, {
      userId,
      domainId,
      recordType: type,
    });

    return successResponse(res, 'DNS record deleted successfully', {
      changeInfo,
    });
  } catch (error) {
    logger.error('❌ Error deleting DNS record:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Check DNS propagation status
 * @route GET /api/hosting/dns/check/:domainId
 */
const checkDnsPropagation = async (req, res) => {
  try {
    const { domainId } = req.params;
    const { recordType } = req.query;
    const userId = req.user.id;

    const domain = await Domain.findOne({
      _id: domainId,
      clientId: userId,
    });

    if (!domain) {
      return errorResponse(res, 'Domain not found', 404);
    }

    // Check DNS propagation
    const propagationStatus = await route53Service.checkDnsPropagation(
      domain.domainName,
      recordType || 'A'
    );

    // Update domain's propagation status
    if (propagationStatus.propagated) {
      domain.aws.dnsPropagationStatus = 'complete';
      await domain.save();
    }

    return successResponse(
      res,
      'DNS propagation status retrieved successfully',
      propagationStatus
    );
  } catch (error) {
    logger.error('❌ Error checking DNS propagation:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create default DNS records (A records for root and www)
 * @route POST /api/hosting/dns/default/:domainId
 */
const createDefaultRecords = async (req, res) => {
  try {
    const { domainId } = req.params;
    const { targetIp } = req.body;
    const userId = req.user.id;

    if (!targetIp) {
      return errorResponse(res, 'Target IP address is required', 400);
    }

    const domain = await Domain.findOne({
      _id: domainId,
      clientId: userId,
    });

    if (!domain) {
      return errorResponse(res, 'Domain not found', 404);
    }

    if (!domain.aws.hostedZoneId) {
      return errorResponse(res, 'No hosted zone found for this domain', 404);
    }

    // Create default A records
    const records = await route53Service.createDefaultRecords(
      domain.aws.hostedZoneId,
      domain.domainName,
      targetIp
    );

    // Update domain's last sync time
    domain.aws.lastDnsSync = new Date();
    domain.aws.dnsPropagationStatus = 'propagating';
    await domain.save();

    logger.info(
      `✅ Created default DNS records for ${domain.domainName}`,
      {
        userId,
        domainId,
      }
    );

    return successResponse(res, 'Default DNS records created successfully', {
      records,
    });
  } catch (error) {
    logger.error('❌ Error creating default records:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get all domains with Route53 enabled
 * @route GET /api/hosting/dns/domains
 */
const getRoute53Domains = async (req, res) => {
  try {
    const userId = req.user.id;

    const domains = await Domain.find({
      clientId: userId,
      'aws.route53Enabled': true,
    }).select('domainName status aws createdAt');

    return successResponse(
      res,
      'Route53 enabled domains retrieved successfully',
      {
        domains,
        totalDomains: domains.length,
      }
    );
  } catch (error) {
    logger.error('❌ Error getting Route53 domains:', error);
    return errorResponse(res, error.message, 500);
  }
};

export {
  createHostedZone,
  getHostedZone,
  deleteHostedZone,
  listDnsRecords,
  upsertDnsRecord,
  deleteDnsRecord,
  checkDnsPropagation,
  createDefaultRecords,
  getRoute53Domains,
};
