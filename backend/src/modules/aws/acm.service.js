import {
  DeleteCertificateCommand,
  DescribeCertificateCommand,
  ListCertificatesCommand,
  RequestCertificateCommand,
} from '@aws-sdk/client-acm';

import { getACMClient } from './aws.config.js';
import logger from '../../utils/logger.js';

/**
 * Request SSL certificate from AWS Certificate Manager
 * @param {string} domainName - Domain name
 * @param {Array} alternativeNames - Alternative domain names (optional)
 * @returns {Object} Certificate details
 */
const requestCertificate = async (domainName, alternativeNames = []) => {
  try {
    const client = getACMClient();

    // Include www subdomain by default
    const subjectAlternativeNames = [
      domainName,
      `www.${domainName}`,
      ...alternativeNames,
    ];

    // Remove duplicates
    const uniqueNames = [...new Set(subjectAlternativeNames)];

    const command = new RequestCertificateCommand({
      DomainName: domainName,
      SubjectAlternativeNames: uniqueNames,
      ValidationMethod: 'DNS', // DNS validation (automatic via Route53)
      Tags: [
        {
          Key: 'Name',
          Value: `${domainName}-certificate`,
        },
        {
          Key: 'ManagedBy',
          Value: 'SaaSify',
        },
      ],
    });

    const response = await client.send(command);

    logger.info(
      `✅ Requested SSL certificate for ${domainName}: ${response.CertificateArn}`
    );

    return {
      certificateArn: response.CertificateArn,
      domainName,
      subjectAlternativeNames: uniqueNames,
      status: 'PENDING_VALIDATION',
    };
  } catch (error) {
    logger.error(
      `❌ Failed to request SSL certificate for ${domainName}:`,
      error
    );
    throw new Error(`Failed to request certificate: ${error.message}`);
  }
};

/**
 * Get certificate details and validation records
 * @param {string} certificateArn - Certificate ARN
 * @returns {Object} Certificate details
 */
const getCertificate = async (certificateArn) => {
  try {
    const client = getACMClient();

    const command = new DescribeCertificateCommand({
      CertificateArn: certificateArn,
    });

    const response = await client.send(command);
    const cert = response.Certificate;

    // Extract DNS validation records
    const dnsValidationRecords =
      cert.DomainValidationOptions?.map((option) => ({
        domainName: option.DomainName,
        resourceRecord: option.ResourceRecord
          ? {
              name: option.ResourceRecord.Name,
              type: option.ResourceRecord.Type,
              value: option.ResourceRecord.Value,
            }
          : null,
        validationStatus: option.ValidationStatus,
      })) || [];

    return {
      certificateArn: cert.CertificateArn,
      domainName: cert.DomainName,
      subjectAlternativeNames: cert.SubjectAlternativeNames || [],
      status: cert.Status,
      type: cert.Type,
      createdAt: cert.CreatedAt,
      issuedAt: cert.IssuedAt,
      notBefore: cert.NotBefore,
      notAfter: cert.NotAfter,
      dnsValidationRecords,
      inUse: cert.InUseBy && cert.InUseBy.length > 0,
    };
  } catch (error) {
    logger.error(
      `❌ Failed to get certificate details for ${certificateArn}:`,
      error
    );
    throw new Error(`Failed to get certificate: ${error.message}`);
  }
};

/**
 * Wait for certificate validation to complete
 * @param {string} certificateArn - Certificate ARN
 * @param {number} maxWaitTime - Maximum wait time in seconds (default: 600)
 * @returns {Object} Certificate details
 */
const waitForCertificateValidation = async (
  certificateArn,
  maxWaitTime = 600
) => {
  const startTime = Date.now();
  const maxWaitMs = maxWaitTime * 1000;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const certificate = await getCertificate(certificateArn);

      if (certificate.status === 'ISSUED') {
        logger.info(`✅ Certificate ${certificateArn} is validated and issued`);
        return certificate;
      }

      if (certificate.status === 'FAILED') {
        throw new Error('Certificate validation failed');
      }

      logger.info(
        `⏳ Waiting for certificate validation... (Status: ${certificate.status})`
      );

      // Wait 30 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 30000));
    } catch (error) {
      logger.error(
        `❌ Error checking certificate status for ${certificateArn}:`,
        error
      );
      throw error;
    }
  }

  throw new Error(
    `Certificate ${certificateArn} was not validated within ${maxWaitTime} seconds`
  );
};

/**
 * Delete SSL certificate
 * @param {string} certificateArn - Certificate ARN
 * @returns {boolean} Success status
 */
const deleteCertificate = async (certificateArn) => {
  try {
    const client = getACMClient();

    // Check if certificate is in use
    const certificate = await getCertificate(certificateArn);
    if (certificate.inUse) {
      throw new Error(
        'Cannot delete certificate that is currently in use by CloudFront or other services'
      );
    }

    const command = new DeleteCertificateCommand({
      CertificateArn: certificateArn,
    });

    await client.send(command);

    logger.info(`✅ Deleted SSL certificate: ${certificateArn}`);
    return true;
  } catch (error) {
    logger.error(
      `❌ Failed to delete certificate ${certificateArn}:`,
      error
    );
    throw new Error(`Failed to delete certificate: ${error.message}`);
  }
};

/**
 * List all certificates
 * @param {string} status - Filter by status (optional)
 * @returns {Array} List of certificates
 */
const listCertificates = async (status = null) => {
  try {
    const client = getACMClient();

    const params = {};
    if (status) {
      params.CertificateStatuses = [status];
    }

    const command = new ListCertificatesCommand(params);
    const response = await client.send(command);

    const certificates =
      response.CertificateSummaryList?.map((cert) => ({
        certificateArn: cert.CertificateArn,
        domainName: cert.DomainName,
        status: cert.Status,
        type: cert.Type,
        createdAt: cert.CreatedAt,
        notAfter: cert.NotAfter,
      })) || [];

    return certificates;
  } catch (error) {
    logger.error('❌ Failed to list certificates:', error);
    throw new Error(`Failed to list certificates: ${error.message}`);
  }
};

/**
 * Check if certificate is valid and not expired
 * @param {string} certificateArn - Certificate ARN
 * @returns {Object} Validation status
 */
const checkCertificateValidity = async (certificateArn) => {
  try {
    const certificate = await getCertificate(certificateArn);

    const now = new Date();
    const notBefore = new Date(certificate.notBefore);
    const notAfter = new Date(certificate.notAfter);

    const isValid = certificate.status === 'ISSUED';
    const isActive = now >= notBefore && now <= notAfter;
    const daysUntilExpiry = Math.ceil(
      (notAfter - now) / (1000 * 60 * 60 * 24)
    );

    return {
      certificateArn,
      isValid,
      isActive,
      status: certificate.status,
      notBefore: certificate.notBefore,
      notAfter: certificate.notAfter,
      daysUntilExpiry,
      needsRenewal: daysUntilExpiry < 30, // AWS auto-renews 60 days before expiry
    };
  } catch (error) {
    logger.error(
      `❌ Failed to check certificate validity for ${certificateArn}:`,
      error
    );
    throw new Error(`Failed to check certificate validity: ${error.message}`);
  }
};

/**
 * Get DNS validation records for manual setup (if not using Route53)
 * @param {string} certificateArn - Certificate ARN
 * @returns {Array} DNS validation records
 */
const getDnsValidationRecords = async (certificateArn) => {
  try {
    const certificate = await getCertificate(certificateArn);

    return certificate.dnsValidationRecords.filter(
      (record) => record.resourceRecord !== null
    );
  } catch (error) {
    logger.error(
      `❌ Failed to get DNS validation records for ${certificateArn}:`,
      error
    );
    throw new Error(
      `Failed to get DNS validation records: ${error.message}`
    );
  }
};

export {
  requestCertificate,
  getCertificate,
  waitForCertificateValidation,
  deleteCertificate,
  listCertificates,
  checkCertificateValidity,
  getDnsValidationRecords,
};
