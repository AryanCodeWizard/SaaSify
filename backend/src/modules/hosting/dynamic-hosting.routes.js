import {
  createDynamicHosting,
  getDatabaseInfo,
  getHostingService,
  getInstanceStatus,
  getSshInfo,
  listHostingServices,
  terminateHosting,
} from './dynamic-hosting.controller.js';

import { authenticateToken } from '../../middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticateToken);

/**
 * @route   POST /api/hosting/dynamic/create
 * @desc    Create a new dynamic hosting service (EC2 + optional RDS)
 * @access  Private
 * @body    { domainId, plan, instanceType, runtime, appPort, database }
 */
router.post('/create', createDynamicHosting);

/**
 * @route   GET /api/hosting/dynamic
 * @desc    List all dynamic hosting services for authenticated user
 * @access  Private
 * @query   status (provisioning/active/suspended/terminated)
 */
router.get('/', listHostingServices);

/**
 * @route   GET /api/hosting/dynamic/:id
 * @desc    Get hosting service details
 * @access  Private
 */
router.get('/:id', getHostingService);

/**
 * @route   GET /api/hosting/dynamic/:id/ssh
 * @desc    Get SSH connection information
 * @access  Private
 */
router.get('/:id/ssh', getSshInfo);

/**
 * @route   GET /api/hosting/dynamic/:id/database
 * @desc    Get database connection information
 * @access  Private
 */
router.get('/:id/database', getDatabaseInfo);

/**
 * @route   GET /api/hosting/dynamic/:id/status
 * @desc    Get real-time instance status
 * @access  Private
 */
router.get('/:id/status', getInstanceStatus);

/**
 * @route   DELETE /api/hosting/dynamic/:id
 * @desc    Terminate hosting service
 * @access  Private
 */
router.delete('/:id', terminateHosting);

export default router;
