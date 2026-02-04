import { AlertCircle, ArrowRight, Minus, Package, Plus, ShoppingCart, Tag, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import cartService from '../services/cart.service';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      console.log('Cart API response:', response);
      console.log('Cart data:', response.data);
      setCart(response.data.cart);
    } catch (error) {
      console.error('Error fetching cart:', error);
      console.error('Error details:', error.response?.data);
      
      // If unauthorized, show appropriate message
      if (error.response?.status === 401) {
        toast.error('Please login to view your cart');
        navigate('/login');
      } else {
        toast.error('Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    try {
      setUpdating(true);
      await cartService.updateCartItem(itemId, { quantity: newQuantity });
      await fetchCart();
      toast.success('Cart updated');
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setUpdating(true);
      await cartService.removeFromCart(itemId);
      await fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;

    try {
      setUpdating(true);
      await cartService.clearCart();
      await fetchCart();
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    } finally {
      setUpdating(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      setApplyingCoupon(true);
      await cartService.applyCoupon(couponCode);
      await fetchCart();
      toast.success('Coupon applied successfully');
      setCouponCode('');
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error(error.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      setUpdating(true);
      await cartService.removeCoupon();
      await fetchCart();
      toast.success('Coupon removed');
    } catch (error) {
      console.error('Error removing coupon:', error);
      toast.error('Failed to remove coupon');
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckout = () => {
    navigate('/dashboard/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Shopping Cart
          </h1>
          <p className="text-slate-600">
            {isEmpty ? 'Your cart is empty' : `${cart.items.length} item${cart.items.length !== 1 ? 's' : ''} in your cart`}
          </p>
        </div>

        {isEmpty ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Your cart is empty</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Start exploring our services and add items to your cart to get started.
            </p>
            <button
              onClick={() => navigate('/dashboard/domains')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Browse Domains
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{item.name}</h3>
                        <p className="text-sm text-slate-500 mb-2 capitalize">{item.type}</p>
                        {item.period && (
                          <p className="text-sm text-slate-600">
                            Period: <span className="font-semibold">{item.period} year{item.period !== 1 ? 's' : ''}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updating}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                        disabled={updating || item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-semibold text-slate-800 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                        disabled={updating}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {cart.currency} {(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {cart.currency} {item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              <button
                onClick={handleClearCart}
                disabled={updating}
                className="w-full py-3 text-red-600 hover:text-red-700 font-semibold hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
              >
                Clear Cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Order Summary</h2>

                {/* Coupon Code */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Coupon Code
                  </label>
                  {cart.coupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-200 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-700">{cart.coupon.code}</span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        disabled={updating}
                        className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        disabled={applyingCoupon}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {applyingCoupon ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pb-6 border-b-2 border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">{cart.currency} {cart.subtotal.toFixed(2)}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-semibold">-{cart.currency} {cart.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Tax</span>
                    <span className="font-semibold">{cart.currency} {cart.tax.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold text-slate-800">Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {cart.currency} {cart.total.toFixed(2)}
                  </span>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Security Note */}
                <div className="mt-4 flex items-start space-x-2 text-xs text-slate-500">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Your payment information is secure and encrypted</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
