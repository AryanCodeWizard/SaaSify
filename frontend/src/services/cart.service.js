import api from '../config/api';

/**
 * Cart Service
 * Handles all cart-related API calls
 */
const cartService = {
  /**
   * Get user's cart
   */
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  /**
   * Add item to cart
   * @param {object} item - Item to add (type, itemId, name, price, period, quantity)
   */
  addToCart: async (item) => {
    const response = await api.post('/cart/add', item);
    return response.data;
  },

  /**
   * Update cart item
   * @param {string} itemId - Item ID
   * @param {object} updates - Updates (quantity, period)
   */
  updateCartItem: async (itemId, updates) => {
    const response = await api.put(`/cart/item/${itemId}`, updates);
    return response.data;
  },

  /**
   * Remove item from cart
   * @param {string} itemId - Item ID
   */
  removeFromCart: async (itemId) => {
    const response = await api.delete(`/cart/item/${itemId}`);
    return response.data;
  },

  /**
   * Clear entire cart
   */
  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },

  /**
   * Apply coupon code
   * @param {string} code - Coupon code
   */
  applyCoupon: async (code) => {
    const response = await api.post('/cart/coupon', { code });
    return response.data;
  },

  /**
   * Remove coupon
   */
  removeCoupon: async () => {
    const response = await api.delete('/cart/coupon');
    return response.data;
  },

  /**
   * Checkout cart
   * @param {object} checkoutData - Payment method and billing info
   */
  checkout: async (checkoutData) => {
    const response = await api.post('/cart/checkout', checkoutData);
    return response.data;
  },

  /**
   * Verify Razorpay payment
   * @param {object} paymentData - Razorpay payment details
   */
  verifyPayment: async (paymentData) => {
    const response = await api.post('/cart/verify-payment', paymentData);
    return response.data;
  },
};

export default cartService;
