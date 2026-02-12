import * as dnsController from './dns.controller.js';

import { authenticateToken } from '../../middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/hosting/dns/zones
 * @desc    Create Route53 hosted zone for a domain
 * @access  Private
 */
router.post('/zones', dnsController.createHostedZone);

/**
 * @route   GET /api/hosting/dns/zones/:domainId
 * @desc    Get hosted zone details
 * @access  Private
 */
router.get('/zones/:domainId', dnsController.getHostedZone);

/**
 * @route   DELETE /api/hosting/dns/zones/:domainId
 * @desc    Delete hosted zone
 * @access  Private
 */
router.delete('/zones/:domainId', dnsController.deleteHostedZone);

/**
 * @route   GET /api/hosting/dns/records/:domainId
 * @desc    List all DNS records for a domain
 * @access  Private
 */
router.get('/records/:domainId', dnsController.listDnsRecords);

/**
 * @route   POST /api/hosting/dns/records/:domainId
 * @desc    Create or update a DNS record
 * @access  Private
 */
router.post('/records/:domainId', dnsController.upsertDnsRecord);

/**
 * @route   DELETE /api/hosting/dns/records/:domainId
 * @desc    Delete a DNS record
 * @access  Private
 */
router.delete('/records/:domainId', dnsController.deleteDnsRecord);

/**
 * @route   POST /api/hosting/dns/default/:domainId
 * @desc    Create default DNS records (A records for root and www)
 * @access  Private
 */
router.post('/default/:domainId', dnsController.createDefaultRecords);

/**
 * @route   GET /api/hosting/dns/check/:domainId
 * @desc    Check DNS propagation status
 * @access  Private
 */
router.get('/check/:domainId', dnsController.checkDnsPropagation);

/**
 * @route   GET /api/hosting/dns/domains
 * @desc    Get all domains with Route53 enabled
 * @access  Private
 */
router.get('/domains', dnsController.getRoute53Domains);

export default router;
