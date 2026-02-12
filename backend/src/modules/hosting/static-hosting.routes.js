import {
  createStaticHosting,
  deleteFile,
  generateUploadUrl,
  getHostingService,
  invalidateCache,
  listFiles,
  listHostingServices,
  terminateHosting,
} from './static-hosting.controller.js';

import { authenticateToken } from '../../middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticateToken);

/**
 * @route   POST /api/hosting/static/create
 * @desc    Create a new static hosting service
 * @access  Private
 * @body    { domainId, plan: { name, price, billingCycle, storage, bandwidth }, enableSsl }
 */
router.post('/create', createStaticHosting);

/**
 * @route   GET /api/hosting/static
 * @desc    List all hosting services for authenticated user
 * @access  Private
 * @query   type (static/dynamic), status (provisioning/active/suspended/terminated)
 */
router.get('/', listHostingServices);

/**
 * @route   GET /api/hosting/static/:id
 * @desc    Get hosting service details
 * @access  Private
 */
router.get('/:id', getHostingService);

/**
 * @route   POST /api/hosting/static/:id/upload-url
 * @desc    Generate pre-signed URL for file upload
 * @access  Private
 * @body    { fileName, contentType }
 */
router.post('/:id/upload-url', generateUploadUrl);

/**
 * @route   GET /api/hosting/static/:id/files
 * @desc    List all files in hosting
 * @access  Private
 */
router.get('/:id/files', listFiles);

/**
 * @route   DELETE /api/hosting/static/:id/files
 * @desc    Delete a file from hosting
 * @access  Private
 * @body    { fileName }
 */
router.delete('/:id/files', deleteFile);

/**
 * @route   POST /api/hosting/static/:id/invalidate
 * @desc    Invalidate CloudFront cache
 * @access  Private
 * @body    { paths: ['/path1', '/path2'] } (default: ['/*'])
 */
router.post('/:id/invalidate', invalidateCache);

/**
 * @route   DELETE /api/hosting/static/:id
 * @desc    Terminate hosting service
 * @access  Private
 */
router.delete('/:id', terminateHosting);

export default router;
