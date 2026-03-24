// domainExpiryCascade.worker.js
// Suspends Service and enqueues suspendInfra when Domain.status = EXPIRED
import Service from '../models/Service.js';
// import queue as needed

export default async function domainExpiryCascadeWorker(job) {
  const { domainId } = job.data;
  // Find all services using this domain
  const services = await Service.find({ domainId });
  for (const service of services) {
    if (service.status !== 'SUSPENDED') {
      service.status = 'SUSPENDED';
      await service.save();
      // Enqueue suspendInfra job for this service
      // ... enqueue logic here ...
    }
  }
  // Add error handling, logging, etc.
}
