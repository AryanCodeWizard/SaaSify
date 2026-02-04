import { DOMAIN_STATUS } from '../constants/enums.js';
import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema(
  {
    // Reference to the owning client
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true, // Used for fast client-domain lookups
    },

    // Reference to the order that created this domain
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },

    // Full domain name (example.com)
    domainName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true, // Prevent duplicate domain registrations
      index: true,
    },

    // Top-level domain (com, net, org, etc.)
    tld: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Registrar handling the domain
    registrar: {
      type: String,
      required: true,
      enum: ['godaddy', 'namecheap', 'other'],
      default: 'godaddy',
    },

    // Registrar-specific domain ID (nullable)
    registrarDomainId: {
      type: String,
      sparse: true, // Allows multiple docs without this field
      index: true,
    },

    // Current lifecycle status of the domain
    status: {
      type: String,
      required: true,
      enum: Object.values(DOMAIN_STATUS),
      default: DOMAIN_STATUS.PENDING,
      index: true,
    },

    // When the domain was officially registered
    registrationDate: {
      type: Date,
    },

    // When the domain expires
    expiryDate: {
      type: Date,
      index: true, // Used for expiry monitoring jobs
    },

    // Next renewal date
    renewalDate: {
      type: Date,
      index: true,
    },

    // Whether the domain auto-renews
    autoRenew: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Number of years purchased during registration
    yearsPurchased: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 1,
    },

    // Pricing details
    registrationPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    renewalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    transferPrice: {
      type: Number,
      min: 0,
    },

    // Nameservers assigned to the domain
    nameservers: [
      {
        type: String,
        trim: true,
      },
    ],

    // DNS records associated with the domain
    dnsRecords: [
      {
        type: {
          type: String,
          enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'],
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
        ttl: {
          type: Number,
          default: 3600,
        },
        priority: {
          type: Number,
          default: 0,
        },
      },
    ],

    // WHOIS privacy settings
    whoisPrivacy: {
      enabled: {
        type: Boolean,
        default: false,
      },
      price: {
        type: Number,
        default: 0,
      },
    },

    // Prevents domain transfers when enabled
    transferLock: {
      type: Boolean,
      default: true,
    },

    // Authorization code for transfers (hidden by default)
    authCode: {
      type: String,
      select: false,
    },

    // WHOIS contact information
    contactInfo: {
      registrant: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        organization: String,
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
        },
      },
      admin: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        organization: String,
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
        },
      },
      technical: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        organization: String,
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
        },
      },
      billing: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        organization: String,
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
        },
      },
    },

    // Suspension tracking
    suspensionReason: {
      type: String,
    },
    suspendedAt: {
      type: Date,
    },

    // Internal notes for support/admins
    notes: {
      type: String,
    },

    // Flexible metadata for integrations or future features
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =========================
   INDEXES
   ========================= */

// Quickly fetch domains by client and status
domainSchema.index({ clientId: 1, status: 1 });

// Used for auto-renew and expiry cron jobs
domainSchema.index({ expiryDate: 1, autoRenew: 1 });

// Fetch domains by lifecycle stage and expiration
domainSchema.index({ status: 1, expiryDate: 1 });

// Registrar reconciliation and syncing
domainSchema.index({ registrar: 1, registrarDomainId: 1 });

/* =========================
   VIRTUALS
   ========================= */

// Returns true if the domain is past its expiry date
domainSchema.virtual('isExpired').get(function () {
  return this.expiryDate && this.expiryDate < new Date();
});

// Returns number of days remaining until expiry
domainSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.expiryDate) return null;
  const diffTime = this.expiryDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// True when domain is within 30 days of expiring
domainSchema.virtual('isExpiringSoon').get(function () {
  const days = this.daysUntilExpiry;
  return days !== null && days > 0 && days <= 30;
});

/* =========================
   INSTANCE METHODS
   ========================= */

// Determines whether the domain is eligible for renewal
domainSchema.methods.canRenew = function () {
  return [DOMAIN_STATUS.ACTIVE, DOMAIN_STATUS.EXPIRING_SOON].includes(this.status);
};

// Determines whether the domain can be transferred
// Rules:
// - Must be ACTIVE
// - Transfer lock must be disabled
// - Must be older than 60 days (ICANN rule)
domainSchema.methods.canTransfer = function () {
  return (
    this.status === DOMAIN_STATUS.ACTIVE &&
    !this.transferLock &&
    this.registrationDate &&
    new Date() - this.registrationDate > 60 * 24 * 60 * 60 * 1000
  );
};

// Automatically updates status based on expiry/registration dates
domainSchema.methods.updateStatus = function () {
  if (this.expiryDate) {
    const daysUntilExpiry = this.daysUntilExpiry;

    if (daysUntilExpiry < 0) {
      this.status = DOMAIN_STATUS.EXPIRED;
    } else if (daysUntilExpiry <= 30) {
      this.status = DOMAIN_STATUS.EXPIRING_SOON;
    } else if (this.status === DOMAIN_STATUS.PENDING && this.registrationDate) {
      this.status = DOMAIN_STATUS.ACTIVE;
    }
  }
};

/* =========================
   MIDDLEWARE
   ========================= */

// Keeps domain status in sync whenever dates change
domainSchema.pre('save', function (next) {
  if (this.isModified('expiryDate') || this.isModified('registrationDate')) {
    this.updateStatus();
  }
  next();
});

const Domain = mongoose.model('Domain', domainSchema);
export default Domain;
