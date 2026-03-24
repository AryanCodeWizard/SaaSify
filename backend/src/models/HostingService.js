import mongoose from 'mongoose';

const hostingServiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  domain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true,
    index: true,
  },
  domainName: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['static', 'dynamic'],
    default: 'static',
    index: true,
  },
  status: {
    type: String,
    required: true,
    enum: [
      'provisioning',
      'active',
      'suspended',
      'terminating',
      'terminated',
      'failed',
    ],
    default: 'provisioning',
    index: true,
  },
  plan: {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'semi-annual', 'annual'],
      default: 'monthly',
    },
    specs: {
      storage: Number, // in MB
      bandwidth: Number, // in GB
      vcpu: Number,
      memory: Number, // in MB
    },
  },
  static: {
    bucketName: { type: String, sparse: true },
    bucketRegion: { type: String, default: 'us-east-1' },
    websiteUrl: { type: String },
    cloudfrontId: { type: String, sparse: true },
    cloudfrontUrl: { type: String },
    cloudfrontStatus: { type: String, enum: ['InProgress', 'Deployed'] },
  },
  ssl: {
    certificateArn: { type: String },
    provider: {
      type: String,
      enum: ['acm', 'letsencrypt', 'none'],
      default: 'acm',
    },
    status: {
      type: String,
      enum: [
        'pending',
        'validating',
        'issued',
        'failed',
        'expired',
        'none',
      ],
      default: 'none',
    },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    autoRenew: { type: Boolean, default: true },
  },
  dynamic: {
    instanceId: { type: String, sparse: true },
    instanceType: { type: String },
    instanceState: {
      type: String,
      enum: ['pending', 'running', 'stopping', 'stopped', 'terminated'],
    },
    publicIp: { type: String },
    privateIp: { type: String },
    elasticIp: {
      allocationId: String,
      publicIp: String,
      associationId: String,
    },
    securityGroupId: { type: String },
    keyName: { type: String },
    sshPort: { type: Number, default: 22 },
    appPort: { type: Number, default: 3000 },
    runtime: {
      type: String,
      enum: ['docker', 'nodejs', 'python', 'php', 'ruby', 'custom'],
      default: 'docker',
    },
    database: {
      enabled: { type: Boolean, default: false },
      instanceIdentifier: String,
      engine: { type: String, enum: ['mysql', 'postgres', 'mongodb', 'mariadb'] },
      instanceClass: String,
      endpoint: String,
      port: Number,
      name: String,
      username: String,
      status: String,
    },
  },
  usage: {
    storage: {
      used: { type: Number, default: 0 }, // in MB
      limit: { type: Number, default: 10000 }, // 10GB default
    },
    bandwidth: {
      used: { type: Number, default: 0 }, // in GB
      limit: { type: Number, default: 100 }, // 100GB default
      resetDate: { type: Date },
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  billing: {
    nextBillingDate: { type: Date, required: true, index: true },
    lastBillingDate: { type: Date },
    autoRenew: { type: Boolean, default: true },
  },
  provisioning: {
    startedAt: { type: Date },
    completedAt: { type: Date },
    steps: { type: [String], default: [] },
    logs: { type: [String], default: [] },
  },
},
{
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
}
);

// Indexes
hostingServiceSchema.index({ user: 1, status: 1 });
hostingServiceSchema.index({ domain: 1 });
hostingServiceSchema.index({ type: 1, status: 1 });
hostingServiceSchema.index({ 'billing.nextBillingDate': 1, status: 1 });
hostingServiceSchema.index({ 'static.bucketName': 1 }, { sparse: true });
hostingServiceSchema.index({ 'static.cloudfrontId': 1 }, { sparse: true });

// Virtuals
hostingServiceSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

hostingServiceSchema.virtual('isSuspended').get(function () {
  return this.status === 'suspended';
});

hostingServiceSchema.virtual('daysUntilBilling').get(function () {
  if (!this.billing.nextBillingDate) return null;
  const diffTime = this.billing.nextBillingDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

hostingServiceSchema.virtual('storageUsagePercent').get(function () {
  const limit = this.usage.storage.limit;
  const used = this.usage.storage.used;
  return limit > 0 ? Math.round((used / limit) * 100) : 0;
});

hostingServiceSchema.virtual('bandwidthUsagePercent').get(function () {
  const limit = this.usage.bandwidth.limit;
  const used = this.usage.bandwidth.used;
  return limit > 0 ? Math.round((used / limit) * 100) : 0;
});

hostingServiceSchema.virtual('publicUrl').get(function () {
  if (this.type === 'static') {
    if (this.static.cloudfrontUrl) {
      return `https://${this.static.cloudfrontUrl}`;
    }
    if (this.static.websiteUrl) {
      return this.static.websiteUrl;
    }
  }
  return `https://${this.domainName}`;
});

// Methods
hostingServiceSchema.methods.canSuspend = function () {
  return this.status === 'active' && this.type !== 'terminated';
};

const HostingService = mongoose.model('HostingService', hostingServiceSchema);

export default HostingService;
