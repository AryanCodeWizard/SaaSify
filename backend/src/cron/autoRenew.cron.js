import { domainRenewalQueue, emailQueue } from '../queues/domain.queue.js';

import Client from '../models/Client.js';
import Domain from '../models/Domain.js';
import Invoice from '../models/Invoice.js';
import cron from 'node-cron';
import godaddyService from '../services/godaddy.service.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Auto-Renewal Cron Job
 * Runs daily at 3:00 AM
 * Automatically renews domains with auto-renew enabled that are expiring within 7 days
 */
const autoRenewCron = cron.schedule(
  '0 3 * * *', // Every day at 3:00 AM
  async () => {
    logger.info('🔄 Running auto-renewal check...');

    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find domains eligible for auto-renewal
      const domainsToRenew = await Domain.find({
        status: 'active',
        autoRenew: true,
        expiryDate: { $lte: sevenDaysFromNow, $gte: now },
        // Don't attempt if already tried 3+ times
        $or: [
          { autoRenewAttempts: { $exists: false } },
          { autoRenewAttempts: { $lt: 3 } },
        ],
      })
        .populate('userId', '_id')
        .lean();

      logger.info(`Found ${domainsToRenew.length} domains eligible for auto-renewal`);

      let successCount = 0;
      let failCount = 0;

      for (const domain of domainsToRenew) {
        try {
          // Find all services for this domain
          const services = await Service.find({ domainId: domain._id });
          for (const service of services) {
            // Enqueue renewService job for each service
            await infraQueue.add('renew-service', { serviceId: service._id });
            logger.info(`Enqueued renewService for Service ${service._id} (domain ${domain.domainName})`);
          }
          successCount++;
        } catch (error) {
          logger.error(`Failed to enqueue renewService for domain ${domain.domainName}:`, error);
          failCount++;
        }
      }

      logger.info(
        `✅ Auto-renewal check completed. Success: ${successCount}, Failed: ${failCount}`
      );
    } catch (error) {
      logger.error('Auto-renewal cron job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'UTC',
  }
);

export default autoRenewCron;
