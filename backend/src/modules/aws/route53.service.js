import {
  ChangeResourceRecordSetsCommand,
  CreateHostedZoneCommand,
  DeleteHostedZoneCommand,
  GetChangeCommand,
  GetHostedZoneCommand,
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';

import dns from 'dns';
import { getRoute53Client } from './aws.config.js';
import logger from '../../utils/logger.js';

const dnsPromises = dns.promises;

/**
 * Create a new hosted zone in Route53
 * @param {string} domainName - Domain name (e.g., example.com)
 * @returns {Object} Hosted zone details
 */
const createHostedZone = async (domainName) => {
  try {
    const client = getRoute53Client();
    const callerReference = `${domainName}-${Date.now()}`;

    const command = new CreateHostedZoneCommand({
      Name: domainName,
      CallerReference: callerReference,
      HostedZoneConfig: {
        Comment: `Hosted zone for ${domainName} - Created by SaaSify`,
        PrivateZone: false,
      },
    });

    const response = await client.send(command);
    const hostedZone = response.HostedZone;
    const nameServers = response.DelegationSet.NameServers;

    logger.info(`✅ Created hosted zone for ${domainName}`, {
      hostedZoneId: hostedZone.Id,
    });

    return {
      hostedZoneId: hostedZone.Id.replace('/hostedzone/', ''),
      name: hostedZone.Name,
      nameServers: nameServers,
      resourceRecordSetCount: hostedZone.ResourceRecordSetCount,
      callerReference: hostedZone.CallerReference,
    };
  } catch (error) {
    logger.error(`❌ Failed to create hosted zone for ${domainName}:`, error);
    throw new Error(`Failed to create hosted zone: ${error.message}`);
  }
};

/**
 * Delete a hosted zone
 * @param {string} hostedZoneId - Hosted zone ID
 * @returns {boolean} Success status
 */
const deleteHostedZone = async (hostedZoneId) => {
  try {
    const client = getRoute53Client();

    // First, delete all records except NS and SOA
    await deleteAllRecords(hostedZoneId);

    const command = new DeleteHostedZoneCommand({
      Id: hostedZoneId,
    });

    await client.send(command);
    logger.info(`✅ Deleted hosted zone: ${hostedZoneId}`);

    return true;
  } catch (error) {
    logger.error(`❌ Failed to delete hosted zone ${hostedZoneId}:`, error);
    throw new Error(`Failed to delete hosted zone: ${error.message}`);
  }
};

/**
 * Get hosted zone details
 * @param {string} hostedZoneId - Hosted zone ID
 * @returns {Object} Hosted zone details
 */
const getHostedZone = async (hostedZoneId) => {
  try {
    const client = getRoute53Client();

    const command = new GetHostedZoneCommand({
      Id: hostedZoneId,
    });

    const response = await client.send(command);

    return {
      hostedZoneId: response.HostedZone.Id.replace('/hostedzone/', ''),
      name: response.HostedZone.Name,
      resourceRecordSetCount: response.HostedZone.ResourceRecordSetCount,
      nameServers: response.DelegationSet?.NameServers || [],
    };
  } catch (error) {
    logger.error(`❌ Failed to get hosted zone ${hostedZoneId}:`, error);
    throw new Error(`Failed to get hosted zone: ${error.message}`);
  }
};

/**
 * List all hosted zones
 * @returns {Array} List of hosted zones
 */
const listHostedZones = async () => {
  try {
    const client = getRoute53Client();

    const command = new ListHostedZonesCommand({});
    const response = await client.send(command);

    return response.HostedZones.map((zone) => ({
      hostedZoneId: zone.Id.replace('/hostedzone/', ''),
      name: zone.Name,
      resourceRecordSetCount: zone.ResourceRecordSetCount,
    }));
  } catch (error) {
    logger.error('❌ Failed to list hosted zones:', error);
    throw new Error(`Failed to list hosted zones: ${error.message}`);
  }
};

/**
 * List DNS records in a hosted zone
 * @param {string} hostedZoneId - Hosted zone ID
 * @returns {Array} List of DNS records
 */
const listDnsRecords = async (hostedZoneId) => {
  try {
    const client = getRoute53Client();

    const command = new ListResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
    });

    const response = await client.send(command);

    return response.ResourceRecordSets.map((record) => ({
      name: record.Name,
      type: record.Type,
      ttl: record.TTL || 300,
      values: record.ResourceRecords
        ? record.ResourceRecords.map((r) => r.Value)
        : [],
      aliasTarget: record.AliasTarget
        ? {
            dnsName: record.AliasTarget.DNSName,
            hostedZoneId: record.AliasTarget.HostedZoneId,
          }
        : null,
    }));
  } catch (error) {
    logger.error(
      `❌ Failed to list DNS records for ${hostedZoneId}:`,
      error
    );
    throw new Error(`Failed to list DNS records: ${error.message}`);
  }
};

/**
 * Create or update a DNS record
 * @param {string} hostedZoneId - Hosted zone ID
 * @param {Object} recordData - DNS record data
 * @returns {Object} Change info
 */
const upsertDnsRecord = async (hostedZoneId, recordData) => {
  try {
    const { name, type, ttl = 300, values } = recordData;
    const client = getRoute53Client();

    // Ensure name ends with a dot
    const fqdn = name.endsWith('.') ? name : `${name}.`;

    const changes = {
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: fqdn,
            Type: type,
            TTL: ttl,
            ResourceRecords: values.map((value) => ({ Value: value })),
          },
        },
      ],
    };

    const command = new ChangeResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      ChangeBatch: changes,
    });

    const response = await client.send(command);

    logger.info(`✅ Created/Updated DNS record: ${fqdn} (${type})`, {
      changeId: response.ChangeInfo.Id,
    });

    return {
      changeId: response.ChangeInfo.Id.replace('/change/', ''),
      status: response.ChangeInfo.Status,
      submittedAt: response.ChangeInfo.SubmittedAt,
    };
  } catch (error) {
    logger.error('❌ Failed to create/update DNS record:', error);
    throw new Error(`Failed to upsert DNS record: ${error.message}`);
  }
};

/**
 * Delete a DNS record
 * @param {string} hostedZoneId - Hosted zone ID
 * @param {Object} recordData - DNS record data to delete
 * @returns {Object} Change info
 */
const deleteDnsRecord = async (hostedZoneId, recordData) => {
  try {
    const { name, type, ttl = 300, values } = recordData;
    const client = getRoute53Client();

    // Ensure name ends with a dot
    const fqdn = name.endsWith('.') ? name : `${name}.`;

    const changes = {
      Changes: [
        {
          Action: 'DELETE',
          ResourceRecordSet: {
            Name: fqdn,
            Type: type,
            TTL: ttl,
            ResourceRecords: values.map((value) => ({ Value: value })),
          },
        },
      ],
    };

    const command = new ChangeResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      ChangeBatch: changes,
    });

    const response = await client.send(command);

    logger.info(`✅ Deleted DNS record: ${fqdn} (${type})`);

    return {
      changeId: response.ChangeInfo.Id.replace('/change/', ''),
      status: response.ChangeInfo.Status,
      submittedAt: response.ChangeInfo.SubmittedAt,
    };
  } catch (error) {
    logger.error('❌ Failed to delete DNS record:', error);
    throw new Error(`Failed to delete DNS record: ${error.message}`);
  }
};

/**
 * Delete all records except NS and SOA (helper function for zone deletion)
 * @param {string} hostedZoneId - Hosted zone ID
 */
const deleteAllRecords = async (hostedZoneId) => {
  try {
    const records = await listDnsRecords(hostedZoneId);

    // Filter out NS and SOA records (cannot be deleted)
    const deletableRecords = records.filter(
      (record) => record.type !== 'NS' && record.type !== 'SOA'
    );

    for (const record of deletableRecords) {
      await deleteDnsRecord(hostedZoneId, {
        name: record.name,
        type: record.type,
        ttl: record.ttl,
        values: record.values,
      });
    }

    logger.info(
      `✅ Deleted ${deletableRecords.length} records from ${hostedZoneId}`
    );
  } catch (error) {
    logger.error(`❌ Failed to delete records from ${hostedZoneId}:`, error);
    throw error;
  }
};

/**
 * Get change status (to check if DNS changes have propagated)
 * @param {string} changeId - Change ID from a previous operation
 * @returns {Object} Change status
 */
const getChangeStatus = async (changeId) => {
  try {
    const client = getRoute53Client();

    const command = new GetChangeCommand({
      Id: changeId,
    });

    const response = await client.send(command);

    return {
      status: response.ChangeInfo.Status, // PENDING or INSYNC
      submittedAt: response.ChangeInfo.SubmittedAt,
    };
  } catch (error) {
    logger.error(`❌ Failed to get change status for ${changeId}:`, error);
    throw new Error(`Failed to get change status: ${error.message}`);
  }
};

/**
 * Check DNS propagation using public DNS resolvers
 * @param {string} domainName - Domain name to check
 * @param {string} recordType - DNS record type (A, CNAME, etc.)
 * @returns {Object} Propagation status
 */
const checkDnsPropagation = async (domainName, recordType = 'A') => {
  try {
    const resolvers = [
      '8.8.8.8', // Google
      '1.1.1.1', // Cloudflare
      '208.67.222.222', // OpenDNS
    ];

    const results = {};

    for (const resolver of resolvers) {
      try {
        const dnsResolver = new dnsPromises.Resolver();
        dnsResolver.setServers([resolver]);

        let records;
        switch (recordType) {
          case 'A':
            records = await dnsResolver.resolve4(domainName);
            break;
          case 'AAAA':
            records = await dnsResolver.resolve6(domainName);
            break;
          case 'CNAME':
            records = await dnsResolver.resolveCname(domainName);
            break;
          case 'MX':
            records = await dnsResolver.resolveMx(domainName);
            break;
          case 'TXT':
            records = await dnsResolver.resolveTxt(domainName);
            break;
          default:
            records = await dnsResolver.resolve4(domainName);
        }

        results[resolver] = {
          success: true,
          records: records,
        };
      } catch (error) {
        results[resolver] = {
          success: false,
          error: error.message,
        };
      }
    }

    const propagated =
      Object.values(results).filter((r) => r.success).length >=
      resolvers.length / 2;

    return {
      domainName,
      recordType,
      propagated,
      results,
      checkedAt: new Date(),
    };
  } catch (error) {
    logger.error(
      `❌ Failed to check DNS propagation for ${domainName}:`,
      error
    );
    throw new Error(`Failed to check DNS propagation: ${error.message}`);
  }
};

/**
 * Create default DNS records for a domain
 * @param {string} hostedZoneId - Hosted zone ID
 * @param {string} domainName - Domain name
 * @param {string} targetIp - Target IP address or CNAME
 * @returns {Array} Created records
 */
const createDefaultRecords = async (hostedZoneId, domainName, targetIp) => {
  try {
    const records = [];

    // Create A record for root domain
    const rootRecord = await upsertDnsRecord(hostedZoneId, {
      name: domainName,
      type: 'A',
      ttl: 300,
      values: [targetIp],
    });
    records.push(rootRecord);

    // Create A record for www subdomain
    const wwwRecord = await upsertDnsRecord(hostedZoneId, {
      name: `www.${domainName}`,
      type: 'A',
      ttl: 300,
      values: [targetIp],
    });
    records.push(wwwRecord);

    logger.info(`✅ Created default DNS records for ${domainName}`);

    return records;
  } catch (error) {
    logger.error(
      `❌ Failed to create default records for ${domainName}:`,
      error
    );
    throw new Error(`Failed to create default records: ${error.message}`);
  }
};

export {
  createHostedZone,
  deleteHostedZone,
  getHostedZone,
  listHostedZones,
  listDnsRecords,
  upsertDnsRecord,
  deleteDnsRecord,
  deleteAllRecords,
  getChangeStatus,
  checkDnsPropagation,
  createDefaultRecords,
};
