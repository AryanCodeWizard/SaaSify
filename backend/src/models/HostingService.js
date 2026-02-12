import mongoose from 'mongoose';

const hostingServiceSchema = new mongoose.Schema(
  {
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
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
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
    // Static Hosting (S3 + CloudFront)
    static: {
      bucketName: {
        type: String,
        sparse: true,
      },
      bucketRegion: {
        type: String,
        default: 'us-east-1',
      },
      websiteUrl: {
        type: String,
      },
      cloudfrontId: {
        type: String,
        sparse: true,
      },
      cloudfrontUrl: {
        type: String,
      },
      cloudfrontStatus: {
        type: String,
        enum: ['InProgress', 'Deployed'],
      },
    },
    // SSL Certificate
    ssl: {
      certificateArn: {
        type: String,
      },
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
      issuedAt: {
        type: Date,
      },
      expiresAt: {
        type: Date,
      },
      autoRenew: {
        type: Boolean,
        default: true,
      },
    },
    // Dynamic Hosting (EC2 + RDS)
    dynamic: {
      instanceId: {
        type: String,
        sparse: true,
      },
      instanceType: {
        type: String,
      },
      instanceState: {
        type: String,
        enum: ['pending', 'running', 'stopping', 'stopped', 'terminated'],
      },
      publicIp: {
        type: String,
      },
      privateIp: {
        type: String,
      },
      elasticIp: {
        allocationId: String,
        publicIp: String,
        associationId: String,
      },
      securityGroupId: {
        type: String,
      },
      keyName: {
        type: String,
      },
      sshPort: {
        type: Number,
        default: 22,
      },
      appPort: {
        type: Number,
        default: 3000,
      },
      runtime: {
        type: String,
        enum: ['docker', 'nodejs', 'python', 'php', 'ruby', 'custom'],
        default: 'docker',
      },
      database: {
        enabled: {
          type: Boolean,
          default: false,
        },
        instanceIdentifier: String,
        engine: {
          type: String,
          enum: ['mysql', 'postgres', 'mongodb', 'mariadb'],
        },
        instanceClass: String,
        endpoint: String,
        port: Number,
        name: String,
        username: String,
        status: String,
      },
    },
    // Storage & Bandwidth Usage
    usage: {
      storage: {
        used: {
          type: Number,
          default: 0,
        }, // in MB
        limit: {
          type: Number,
          default: 10000,
        }, // 10GB default
      },
      bandwidth: {
        used: {
          type: Number,
          default: 0,
        }, // in GB
        limit: {
          type: Number,
          default: 100,
        }, // 100GB default
        resetDate: {
          type: Date,
        },
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    // Billing
    billing: {
      nextBillingDate: {
        type: Date,
        required: true,
        index: true,
      },
      lastBillingDate: {
        type: Date,
      },
      autoRenew: {
        type: Boolean,
        default: true,
      },
    },
    // Provisioning details
    provisioning: {
      startedAt: {
        type: Date,
      },
      completedAt: {
        type: Date,
      },
      steps: [
        {
          name: String,
          status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'failed'],
          },
          startedAt: Date,
          completedAt: Date,
          error: String,
        },
      ],
      logs: [
        {
          timestamp: {
            type: Date,
            default: Date.now,
          },
          level: {
            type: String,
            enum: ['info', 'warning', 'error'],
            default: 'info',
          },
          message: String,
        },
      ],
    },
    // Suspension details
    suspension: {
      suspendedAt: {
        type: Date,
      },
      reason: {
        type: String,
      },
      autoUnsuspendAt: {
        type: Date,
      },
    },
    // Metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    notes: {
      type: String,
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
    // Prefer CloudFront URL if available
    if (this.static.cloudfrontUrl) {
      return `https://${this.static.cloudfrontUrl}`;
    }
    // Fall back to S3 website URL
    if (this.static.websiteUrl) {
      return this.static.websiteUrl;
    }
  }
  return `https://${this.domainName}`;
});

// Methods
hostingServiceSchema.methods.canSuspend = function () {
  return ['active'].includes(this.status);
};

hostingServiceSchema.methods.canUnsuspend = function () {
  return this.status === 'suspended';
};

hostingServiceSchema.methods.canTerminate = function () {
  return ['active', 'suspended', 'failed'].includes(this.status);
};

hostingServiceSchema.methods.addProvisioningStep = function (
  name,
  status = 'pending'
) {
  this.provisioning.steps.push({
    name,
    status,
    startedAt: status === 'in-progress' ? new Date() : null,
  });
};

hostingServiceSchema.methods.updateProvisioningStep = function (
  name,
  status,
  error = null
) {
  const step = this.provisioning.steps.find((s) => s.name === name);
  if (step) {
    step.status = status;
    if (status === 'in-progress') {
      step.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      step.completedAt = new Date();
    }
    if (error) {
      step.error = error;
    }
  }
};

hostingServiceSchema.methods.addLog = function (message, level = 'info') {
  this.provisioning.logs.push({
    timestamp: new Date(),
    level,
    message,
  });
};

hostingServiceSchema.methods.updateUsage = function (storageUsed, bandwidthUsed) {
  this.usage.storage.used = storageUsed || this.usage.storage.used;
  this.usage.bandwidth.used = bandwidthUsed || this.usage.bandwidth.used;
  this.usage.lastUpdated = new Date();
};

hostingServiceSchema.methods.resetBandwidth = function () {
  this.usage.bandwidth.used = 0;
  this.usage.bandwidth.resetDate = new Date();
};

hostingServiceSchema.methods.suspend = function (reason) {
  this.status = 'suspended';
  this.suspension = {
    suspendedAt: new Date(),
    reason,
  };
};

hostingServiceSchema.methods.unsuspend = function () {
  this.status = 'active';
  this.suspension = {};
};

// Pre-save middleware
hostingServiceSchema.pre('save', function (next) {
  // Set bandwidth reset date if not set
  if (
    !this.usage.bandwidth.resetDate &&
    this.billing.nextBillingDate
  ) {
    this.usage.bandwidth.resetDate = this.billing.nextBillingDate;
  }

  next();
});

const HostingService = mongoose.model('HostingService', hostingServiceSchema);

export default HostingService;
