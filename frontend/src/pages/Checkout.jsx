import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Package,
  Shield
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import cartService from '../services/cart.service';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [billingInfo, setBillingInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCart(response.data.cart);
      
      // Redirect if cart is empty
      if (!response.data?.cart?.items || response.data.cart.items.length === 0) {
        toast.error('Your cart is empty');
        navigate('/dashboard/cart');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
      navigate('/dashboard/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    // Validate billing info
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !billingInfo[field]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        setProcessing(false);
        return;
      }

      // Step 2: Create order on backend
      const checkoutData = {
        paymentMethod,
        billingInfo,
      };

      const response = await cartService.checkout(checkoutData);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to create order');
      }

      const orderData = response.data;

      // Step 3: Open Razorpay payment modal
      const options = {
        key: orderData.razorpayKeyId || 'rzp_test_RXgFDxf85u97LY',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SaaSify',
        description: `Order #${orderData.orderId}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: `${billingInfo.firstName} ${billingInfo.lastName}`,
          email: billingInfo.email,
          contact: billingInfo.phone,
        },
        theme: {
          color: '#8b5cf6',
        },
        handler: async function (response) {
          // Payment successful - verify on backend
          try {
            await cartService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData.orderId,
            });

            toast.success('Payment successful!', {
              icon: '🎉',
            });
            
            // Redirect to order confirmation
            setTimeout(() => {
              navigate(`/dashboard/invoices`, {
                state: { orderId: orderData.orderId }
              });
            }, 1500);
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            toast.error('Payment completed but verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard/cart')}
              className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Cart</span>
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Checkout
            </h1>
            <p className="text-slate-600 mt-2">Complete your purchase securely</p>
          </div>
          
          {/* Security Badge */}
          <div className="hidden md:flex items-center space-x-2 bg-green-50 border-2 border-green-200 rounded-xl px-4 py-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-semibold">Secure Checkout</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
                <Lock className="w-6 h-6 text-blue-600" />
                <span>Billing Information</span>
              </h2>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={billingInfo.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="John"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={billingInfo.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={billingInfo.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={billingInfo.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={billingInfo.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={billingInfo.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Mumbai"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={billingInfo.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Maharashtra"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={billingInfo.postalCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="400001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="country"
                    value={billingInfo.country}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="India">India</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div className="pt-6 border-t-2 border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span>Payment Method</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-4 border-2 border-blue-500 bg-blue-50 rounded-xl cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">Razorpay</p>
                        <p className="text-sm text-slate-600">Pay securely with cards, UPI, wallets</p>
                      </div>
                      <img 
                        src="https://razorpay.com/assets/razorpay-glyph.svg" 
                        alt="Razorpay" 
                        className="h-8"
                      />
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Complete Purchase</span>
                    </>
                  )}
                </button>

                {/* Security Note */}
                <div className="flex items-start space-x-2 text-xs text-slate-500 pt-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Your payment information is encrypted and secure. We never store your card details.</p>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cart?.items?.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-slate-500 capitalize">{item.type}</p>
                      <p className="text-xs text-slate-600 mt-1">Qty: {item.quantity} × ${item.price}</p>
                    </div>
                    <p className="font-bold text-slate-800">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b-2 border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{cart?.currency} {cart?.subtotal?.toFixed(2)}</span>
                </div>
                {cart?.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-{cart?.currency} {cart?.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span className="font-semibold">{cart?.currency} {cart?.tax?.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-bold text-slate-800">Total</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {cart?.currency} {cart?.total?.toFixed(2)}
                </span>
              </div>

              {/* Trust Badges */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2 text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>SSL Encrypted Payment</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Money Back Guarantee</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>24/7 Customer Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
