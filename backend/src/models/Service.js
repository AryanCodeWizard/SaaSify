import { BILLING_CYCLE, SERVICE_STATUS } from '../constants/enums.js';

import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      index: true,
    },
    domainName: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false, // Don't return by default for security
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(SERVICE_STATUS),
      default: SERVICE_STATUS.PENDING,
      index: true,
    },
    billingCycle: {
      type: String,
      required: true,
      enum: Object.values(BILLING_CYCLE),
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    setupFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextDueDate: {
      type: Date,
      index: true,
    },
    nextInvoiceDate: {
      type: Date,
      index: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    activationDate: {
      type: Date,
    },
    suspensionDate: {
      type: Date,
    },
    terminationDate: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: true,
      index: true,
    },
    renewalEnabled: {
      type: Boolean,
      default: true,
    },
    overrideAutoSuspend: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      enum: ['non-payment', 'abuse', 'admin', 'resource-exceeded', 'manual'],
    },
    terminationReason: {
      const serviceSchema = new mongoose.Schema({
        clientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Client',
          required: true,
          index: true,
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order',
          required: true,
          index: true,
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
          index: true,
        },
        serverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Server',
          index: true,
        },
        domainId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Domain',
          required: true,
          index: true,
        },
        status: {
          type: String,
          required: true,
          enum: ['ACTIVE', 'SUSPENDED', 'TERMINATED', 'PENDING'],
          default: 'PENDING',
          index: true,
        },
        billingCycle: {
          type: String,
          required: true,
          enum: ['monthly', 'quarterly', 'semi-annual', 'annual'],
          default: 'monthly',
        },
        nextDueDate: {
          type: Date,
          index: true,
        },
        autoRenew: {
          type: Boolean,
          default: true,
          index: true,
        },
        suspendedAt: Date,
        terminatedAt: Date,
        // Add other business fields as needed, but do NOT include any AWS infra fields
      }, {
        timestamps: true,
      });

      export default mongoose.model('Service', serviceSchema);
      date.setMonth(date.getMonth() + 6);
      break;
    case BILLING_CYCLE.ANNUALLY:
      date.setFullYear(date.getFullYear() + 1);
      break;
    case BILLING_CYCLE.BIENNIALLY:
      date.setFullYear(date.getFullYear() + 2);
      break;
    case BILLING_CYCLE.TRIENNIALLY:
      date.setFullYear(date.getFullYear() + 3);
      break;
  }
  
  this.nextDueDate = date;
  
  // Set next invoice date (7 days before due date)
  const invoiceDate = new Date(date);
  invoiceDate.setDate(invoiceDate.getDate() - 7);
  this.nextInvoiceDate = invoiceDate;
};

serviceSchema.methods.updateResourceUsage = async function (resources) {
  this.resources = { ...this.resources, ...resources };
  await this.save();
};

// Static methods
serviceSchema.statics.findDueForInvoicing = function () {
  return this.find({
    status: { $in: [SERVICE_STATUS.ACTIVE, SERVICE_STATUS.SUSPENDED] },
    autoRenew: true,
    nextInvoiceDate: { $lte: new Date() },
  });
};

serviceSchema.statics.findDueForSuspension = function () {
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 7); // 7 days overdue
  
  return this.find({
    status: SERVICE_STATUS.ACTIVE,
    nextDueDate: { $lte: overdueDate },
    overrideAutoSuspend: false,
  });
};

serviceSchema.statics.findDueForTermination = function () {
  const terminationDate = new Date();
  terminationDate.setDate(terminationDate.getDate() - 30); // 30 days after suspension
  
  return this.find({
    status: SERVICE_STATUS.SUSPENDED,
    suspensionDate: { $lte: terminationDate },
  });
};

serviceSchema.statics.findByClient = function (clientId, status = null) {
  const query = { clientId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

const Service = mongoose.model('Service', serviceSchema);

export default Service;
