import { errorResponse, successResponse } from '../../utils/response.js';

import ActivityLog from '../../models/ActivityLog.js';
import Client from '../../models/Client.js';
import Domain from '../../models/Domain.js';
import Order from '../../models/Order.js';
import Transaction from '../../models/Transaction.js';
import { domainRegistrationQueue } from '../../queues/domain.queue.js';
import godaddyService from '../../services/godaddy.service.js';
import logger from '../../utils/logger.js';
import mongoose from 'mongoose';
import razorpayService from '../../services/razorpay.service.js';

// In-memory cart storage (in production, use Redis or database)
const cartStorage = new Map();

/**
 * Get cart key for user
 */
const getCartKey = (userId) => `cart:${userId}`;

/**
 * Get user's cart
 * GET /api/cart
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);
    
    const cart = cartStorage.get(cartKey) || {
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      currency: 'USD',
      coupon: null,
    };

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity * item.period, 0);
    cart.total = cart.subtotal - cart.discount + cart.tax;

    return successResponse(res, 'Cart retrieved successfully', { cart });
  } catch (error) {
    logger.error('Get cart error:', error);
    return errorResponse(res, 'Failed to retrieve cart', 500);
  }
};

/**
 * Add item to cart
 * POST /api/cart/add
 */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, itemId, name, price, period, quantity, currency, metadata } = req.body;

    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey) || {
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      currency: currency || 'USD',
      coupon: null,
    };

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      (item) => item.itemId === itemId && item.type === type
    );

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity || 1;
      cart.items[existingItemIndex].period = period || cart.items[existingItemIndex].period;
    } else {
      // Add new item
      cart.items.push({
        id: new mongoose.Types.ObjectId().toString(),
        type,
        itemId,
        name,
        price,
        period: period || 1,
        quantity: quantity || 1,
        currency: currency || 'USD',
        metadata: metadata || {},
        addedAt: new Date(),
      });
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity * item.period, 0);
    cart.total = cart.subtotal - cart.discount + cart.tax;

    cartStorage.set(cartKey, cart);

    // Log activity
    await ActivityLog.create({
      userId,
      action: 'domain_search',
      category: 'domain',
      description: `Added ${name} to cart`,
      metadata: { type, itemId, price },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    return successResponse(res, 'Item added to cart', { cart });
  } catch (error) {
    logger.error('Add to cart error:', error);
    return errorResponse(res, 'Failed to add item to cart', 500);
  }
};

/**
 * Update cart item
 * PATCH /api/cart/:itemId
 */
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;
    const updates = req.body;

    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey);

    if (!cart) {
      return errorResponse(res, 'Cart is empty', 404);
    }

    const itemIndex = cart.items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      return errorResponse(res, 'Item not found in cart', 404);
    }

    // Update item
    if (updates.quantity !== undefined) {
      cart.items[itemIndex].quantity = updates.quantity;
    }
    if (updates.period !== undefined) {
      cart.items[itemIndex].period = updates.period;
    }
    if (updates.metadata !== undefined) {
      cart.items[itemIndex].metadata = {
        ...cart.items[itemIndex].metadata,
        ...updates.metadata,
      };
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity * item.period, 0);
    cart.total = cart.subtotal - cart.discount + cart.tax;

    cartStorage.set(cartKey, cart);

    return successResponse(res, 'Cart item updated', { cart });
  } catch (error) {
    logger.error('Update cart item error:', error);
    return errorResponse(res, 'Failed to update cart item', 500);
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/:itemId
 */
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;

    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey);

    if (!cart) {
      return errorResponse(res, 'Cart is empty', 404);
    }

    const itemIndex = cart.items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      return errorResponse(res, 'Item not found in cart', 404);
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity * item.period, 0);
    cart.total = cart.subtotal - cart.discount + cart.tax;

    cartStorage.set(cartKey, cart);

    return successResponse(res, 'Item removed from cart', { cart });
  } catch (error) {
    logger.error('Remove from cart error:', error);
    return errorResponse(res, 'Failed to remove item from cart', 500);
  }
};

/**
 * Clear cart
 * DELETE /api/cart/clear
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);

    cartStorage.delete(cartKey);

    return successResponse(res, 'Cart cleared successfully');
  } catch (error) {
    logger.error('Clear cart error:', error);
    return errorResponse(res, 'Failed to clear cart', 500);
  }
};

/**
 * Apply coupon code
 * POST /api/cart/coupon
 */
export const applyCoupon = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { code } = req.body;

    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey);

    if (!cart || cart.items.length === 0) {
      return errorResponse(res, 'Cart is empty', 400);
    }

    // Validate coupon (simplified - in production, check database)
    const validCoupons = {
      'WELCOME10': { type: 'percentage', value: 10, minAmount: 0 },
      'SAVE20': { type: 'percentage', value: 20, minAmount: 50 },
      'DOMAIN5': { type: 'fixed', value: 5, minAmount: 0, appliesTo: 'domain' },
    };

    const coupon = validCoupons[code];

    if (!coupon) {
      return errorResponse(res, 'Invalid coupon code', 400);
    }

    if (cart.subtotal < coupon.minAmount) {
      return errorResponse(
        res,
        `Minimum order amount of ${coupon.minAmount} required for this coupon`,
        400
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (cart.subtotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }

    cart.discount = Math.min(discount, cart.subtotal);
    cart.coupon = {
      code,
      type: coupon.type,
      value: coupon.value,
      discount: cart.discount,
    };
    cart.total = cart.subtotal - cart.discount + cart.tax;

    cartStorage.set(cartKey, cart);

    return successResponse(res, 'Coupon applied successfully', { cart });
  } catch (error) {
    logger.error('Apply coupon error:', error);
    return errorResponse(res, 'Failed to apply coupon', 500);
  }
};

/**
 * Remove coupon
 * DELETE /api/cart/coupon
 */
export const removeCoupon = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey);

    if (!cart) {
      return errorResponse(res, 'Cart is empty', 404);
    }

    cart.discount = 0;
    cart.coupon = null;
    cart.total = cart.subtotal + cart.tax;

    cartStorage.set(cartKey, cart);

    return successResponse(res, 'Coupon removed', { cart });
  } catch (error) {
    logger.error('Remove coupon error:', error);
    return errorResponse(res, 'Failed to remove coupon', 500);
  }
};

/**
 * Checkout - Create order from cart
 * POST /api/cart/checkout
 */
export const checkout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.userId;
    const { paymentMethod, billingInfo, domainContacts, termsAgreed } = req.body;

    const cartKey = getCartKey(userId);
    const cart = cartStorage.get(cartKey);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return errorResponse(res, 'Cart is empty', 400);
    }

    // Get client
    const client = await Client.findOne({ userId }).session(session);
    if (!client) {
      await session.abortTransaction();
      return errorResponse(res, 'Client profile not found', 404);
    }

    // Check wallet balance if paying with wallet
    if (paymentMethod === 'wallet') {
      if (client.walletBalance < cart.total) {
        await session.abortTransaction();
        return errorResponse(res, 'Insufficient wallet balance', 400);
      }
    }

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

    // Create order
    const order = await Order.create(
      [
        {
          userId,
          clientId: client._id,
          orderNumber,
          items: cart.items.map((item) => ({
            type: item.type,
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            period: item.period,
            total: item.price * item.quantity * item.period,
            metadata: item.metadata,
          })),
          subtotal: cart.subtotal,
          discount: cart.discount,
          tax: cart.tax,
          totalAmount: cart.total,
          currency: cart.currency,
          status: paymentMethod === 'wallet' ? 'processing' : 'pending',
          paymentMethod,
          billingInfo,
          coupon: cart.coupon,
        },
      ],
      { session }
    );

    // Handle Razorpay payment
    if (paymentMethod === 'razorpay') {
      // Create Razorpay order
      const razorpayOrder = await razorpayService.createOrder({
        amount: cart.total,
        currency: cart.currency,
        receipt: orderNumber,
        notes: {
          orderId: order[0]._id.toString(),
          orderNumber,
          userId,
        },
      });

      // Store Razorpay order ID in order
      order[0].paymentDetails = {
        provider: 'razorpay',
        razorpayOrderId: razorpayOrder.id,
      };
      await order[0].save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Log activity
      await ActivityLog.create({
        userId,
        clientId: client._id,
        action: 'order_create',
        category: 'order',
        description: `Created order ${orderNumber} with Razorpay`,
        metadata: {
          orderNumber,
          total: cart.total,
          itemsCount: cart.items.length,
          paymentMethod,
          razorpayOrderId: razorpayOrder.id,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });

      // Return order details with Razorpay info
      return successResponse(res, 'Order created successfully', {
        orderId: order[0]._id,
        orderNumber: order[0].orderNumber,
        amount: cart.total * 100, // Convert to paise for Razorpay
        currency: cart.currency,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // Process payment
    if (paymentMethod === 'wallet') {
      // Deduct from wallet
      client.walletBalance -= cart.total;
      await client.save({ session });

      // Create transaction
      await Transaction.create(
        [
          {
            userId,
            clientId: client._id,
            orderId: order[0]._id,
            type: 'debit',
            amount: cart.total,
            currency: cart.currency,
            description: `Payment for order ${orderNumber}`,
            status: 'completed',
            paymentMethod: 'wallet',
            metadata: {
              orderNumber,
              itemsCount: cart.items.length,
            },
          },
        ],
        { session }
      );

      // Update order status
      order[0].status = 'paid';
      order[0].paidAt = new Date();
      await order[0].save({ session });

      // Process domain registrations - Create domain records and queue for registration
      const domainItems = cart.items.filter((item) => item.type === 'domain');
      const domainJobs = [];

      for (const item of domainItems) {
        // Create domain record
        const domain = await Domain.create(
          [
            {
              userId,
              clientId: client._id,
              orderId: order[0]._id,
              domainName: item.metadata.domain || item.name,
              tld: item.metadata.tld,
              registeredAt: null, // Will be set by worker after successful registration
              expiresAt: new Date(Date.now() + item.period * 365 * 24 * 60 * 60 * 1000),
              autoRenew: item.metadata.autoRenew !== false,
              privacyProtection: item.metadata.privacy !== false,
              status: 'pending',
              registrationPeriod: item.period,
              registrationPrice: item.price,
              renewalPrice: item.price,
              nameservers: item.metadata.nameServers || [],
            },
          ],
          { session }
        );

        // Prepare domain registration data for GoDaddy
        const domainData = {
          domain: domain[0].domainName,
          period: item.period,
          renewAuto: item.metadata.autoRenew !== false,
          privacy: item.metadata.privacy !== false,
          nameServers: item.metadata.nameServers || [],
          contactRegistrant: domainContacts || {
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone || '+1.0000000000',
            organization: client.companyName || '',
            address: {
              street: billingDetails?.address || '123 Main St',
              city: billingDetails?.city || 'New York',
              state: billingDetails?.state || 'NY',
              country: billingDetails?.country || 'US',
              zipCode: billingDetails?.zipCode || '10001',
            },
          },
          consent: {
            agreementKeys: ['DNRA'],
            agreedBy: client.email,
            agreedAt: new Date().toISOString(),
          },
        };

        domainJobs.push({
          domainId: domain[0]._id,
          domainData,
        });
      }

      // Commit transaction before queuing jobs
      await session.commitTransaction();

      // Queue domain registration jobs (outside transaction)
      for (const job of domainJobs) {
        try {
          await domainRegistrationQueue.add(
            'register-domain',
            {
              orderId: order[0]._id,
              domainId: job.domainId,
              userId,
              domainData: job.domainData,
            },
            {
              priority: 1, // High priority for paid orders
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 5000,
              },
            }
          );

          logger.info(`✅ Queued domain registration for ${job.domainData.domain}`);
        } catch (queueError) {
          logger.error(`Failed to queue domain registration:`, queueError);
          // Mark domain as failed
          await Domain.findByIdAndUpdate(job.domainId, {
            status: 'failed',
            notes: `Failed to queue for registration: ${queueError.message}`,
          });
        }
      }

      // Continue with activity log (move outside since transaction is committed)
      await ActivityLog.create({
        userId,
        clientId: client._id,
        action: 'order_create',
        category: 'order',
        description: `Created order ${orderNumber}`,
        metadata: {
          orderNumber,
          total: cart.total,
          itemsCount: cart.items.length,
          paymentMethod,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });

      // Clear cart
      cartStorage.delete(cartKey);

      return successResponse(res, 'Order created successfully', {
        order: {
          id: order[0]._id,
          orderNumber: order[0].orderNumber,
          status: order[0].status,
          total: order[0].totalAmount,
          currency: order[0].currency,
          createdAt: order[0].createdAt,
        },
      });
    }

    // Log activity
    await ActivityLog.create(
      [
        {
          userId,
          clientId: client._id,
          action: 'order_create',
          category: 'order',
          description: `Created order ${orderNumber}`,
          metadata: {
            orderNumber,
            total: cart.total,
            itemsCount: cart.items.length,
            paymentMethod,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'success',
        },
      ],
      { session }
    );

    // Clear cart
    cartStorage.delete(cartKey);

    await session.commitTransaction();

    return successResponse(res, 'Order created successfully', {
      order: {
        id: order[0]._id,
        orderNumber: order[0].orderNumber,
        status: order[0].status,
        total: order[0].totalAmount,
        currency: order[0].currency,
        createdAt: order[0].createdAt,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Checkout error:', error);
    return errorResponse(res, 'Failed to process checkout', 500);
  } finally {
    session.endSession();
  }
};

/**
 * Verify Razorpay payment for order
 * POST /api/cart/verify-payment
 */
export const verifyOrderPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.userId;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Find order
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return errorResponse(res, 'Order not found', 404);
    }

    // Verify ownership
    if (order.userId.toString() !== userId) {
      await session.abortTransaction();
      return errorResponse(res, 'Access denied', 403);
    }

    // Verify Razorpay signature
    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      await session.abortTransaction();
      logger.warn(`Invalid Razorpay signature for order ${order.orderNumber}`);
      return errorResponse(res, 'Payment verification failed', 400);
    }

    // Get payment details from Razorpay
    const payment = await razorpayService.getPayment(razorpay_payment_id);

    // Get client
    const client = await Client.findOne({ userId }).session(session);

    // Create transaction
    await Transaction.create([{
      userId,
      clientId: client._id,
      orderId: order._id,
      type: 'credit',
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency.toUpperCase(),
      description: `Payment for order ${order.orderNumber}`,
      status: 'completed',
      paymentMethod: 'razorpay',
      metadata: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentMethod: payment.method,
        email: payment.email,
        contact: payment.contact,
      },
    }], { session });

    // Update order status
    order.status = 'paid';
    order.paidAt = new Date();
    order.paymentDetails = {
      ...order.paymentDetails,
      razorpayPaymentId: razorpay_payment_id,
      paymentMethod: payment.method,
    };
    await order.save({ session });

    // Process domain registrations if there are domain items
    const domainItems = order.items.filter(item => item.type === 'domain');
    const domainJobs = [];

    for (const item of domainItems) {
      // Create domain record
      const domain = await Domain.create([{
        userId,
        clientId: client._id,
        orderId: order._id,
        domainName: item.metadata?.domain || item.name,
        tld: item.metadata?.tld,
        registeredAt: null,
        expiresAt: new Date(Date.now() + (item.period || 1) * 365 * 24 * 60 * 60 * 1000),
        autoRenew: item.metadata?.autoRenew !== false,
        privacyProtection: item.metadata?.privacy !== false,
        status: 'pending',
        registrationPeriod: item.period || 1,
        registrationPrice: item.price,
        renewalPrice: item.price,
        nameservers: item.metadata?.nameServers || [],
      }], { session });

      domainJobs.push({
        domainId: domain[0]._id,
        domainData: {
          domain: domain[0].domainName,
          period: item.period || 1,
          renewAuto: item.metadata?.autoRenew !== false,
          privacy: item.metadata?.privacy !== false,
          nameServers: item.metadata?.nameServers || [],
          contactRegistrant: {
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone || '+1.0000000000',
            organization: client.companyName || '',
            address: {
              street: order.billingInfo?.address || '123 Main St',
              city: order.billingInfo?.city || 'New York',
              state: order.billingInfo?.state || 'NY',
              country: order.billingInfo?.country || 'US',
              zipCode: order.billingInfo?.postalCode || '10001',
            },
          },
          consent: {
            agreementKeys: ['DNRA'],
            agreedBy: client.email,
            agreedAt: new Date().toISOString(),
          },
        },
      });
    }

    // Commit transaction
    await session.commitTransaction();

    // Queue domain registration jobs (outside transaction)
    for (const job of domainJobs) {
      try {
        await domainRegistrationQueue.add(
          'register-domain',
          {
            orderId: order._id,
            domainId: job.domainId,
            userId,
            domainData: job.domainData,
          },
          {
            priority: 1,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          }
        );

        logger.info(`✅ Queued domain registration for ${job.domainData.domain}`);
      } catch (queueError) {
        logger.error(`Failed to queue domain registration:`, queueError);
        await Domain.findByIdAndUpdate(job.domainId, {
          status: 'failed',
          notes: `Failed to queue for registration: ${queueError.message}`,
        });
      }
    }

    // Clear cart
    const cartKey = getCartKey(userId);
    cartStorage.delete(cartKey);

    // Log activity
    await ActivityLog.create({
      userId,
      clientId: client._id,
      action: 'payment_success',
      category: 'payment',
      description: `Payment verified for order ${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber,
        amount: payment.amount / 100,
        paymentId: razorpay_payment_id,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    logger.info(`✅ Payment verified successfully for order ${order.orderNumber}`);

    return successResponse(res, 'Payment verified successfully', {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.totalAmount,
        paidAt: order.paidAt,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Payment verification error:', error);
    return errorResponse(res, 'Failed to verify payment', 500);
  } finally {
    session.endSession();
  }
};
