// infra.queue.js
// Queue for infra jobs: provision-infra, suspend-infra, destroy-infra
import Queue from 'bull';
import destroyInfraWorker from '../workers/destroyInfra.worker.js';
import infraProvisionWorker from '../workers/infraProvision.worker.js';
import suspendInfraWorker from '../workers/suspendInfra.worker.js';

const infraQueue = new Queue('infra', process.env.REDIS_URL);

infraQueue.process('provision-infra', infraProvisionWorker);
infraQueue.process('suspend-infra', suspendInfraWorker);
infraQueue.process('destroy-infra', destroyInfraWorker);

export default infraQueue;
