// destroyInfra.worker.js
// Destroys AWS infrastructure when Service.status = TERMINATED
import Infrastructure from '../models/Infrastructure.js';
import Service from '../models/Service.js';
// import AWS SDK and other dependencies as needed

export default async function destroyInfraWorker(job) {
  const { serviceId } = job.data;
  const service = await Service.findById(serviceId);
  if (!service || service.status !== 'TERMINATED') return;
  // Destroy AWS resources (delete EC2, S3, etc.)
  // ... AWS destruction logic here ...
  // Remove infra record
  await Infrastructure.deleteOne({ serviceId });
  // Add error handling, logging, etc.
}
