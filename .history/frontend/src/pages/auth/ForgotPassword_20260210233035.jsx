import { ArrowLeft, CheckCircle, Key, Loader2, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(0);

  // Countdown timer for resend email
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      toast.success('Password reset link sent to your email!');
      setSubmitted(true);
      setTimer(60); // Start 60-second timer
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset link';
      toast.error(errorMessage);
      
      if (error.response?.data?.field === 'email') {
        setErrors({ email: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (timer > 0) return;
    
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success('Reset link re-sent to your email!');
      setTimer(60); // Restart timer
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to re-send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4">
        <div className="max-w-md w-full">
          {/* Success Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Gradient header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="text-white" size={40} />
              </div>
            </div>

            {/* Success content */}
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
              <p className="text-gray-600 mb-2">
                We've sent a password reset link to:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-lg font-semibold text-gray-900 break-all">{email}</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  What to do next:
                </h3>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Check your inbox for an email from us
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Click the reset link in the email
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Create a new password for your account
                  </li>
                </ul>
              </div>

              {/* Resend email button */}
              <div className="space-y-4">
                <button
                  onClick={handleResendEmail}
                  disabled={timer > 0 || loading}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    timer > 0 || loading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      Sending...
                    </span>
                  ) : timer > 0 ? (
                    `Resend in ${timer}s`
                  ) : (
                    'Resend Reset Link'
                  )}
                </button>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Didn't receive the email? Check your spam folder or try resending.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Gradient header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <Key className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            </div>
          </div>

          {/* Form content */}
          <div className="p-8">
            {/* Back button */}
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 group"
            >
              <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
              Back to Login
            </Link>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot your password?</h2>
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({});
                    }}
                    className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.email 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                    }`}
                    placeholder="you@example.com"
                  />
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    errors.email ? 'text-red-400' : 'text-gray-400'
                  }`} size={20} />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Sending Reset Link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Need help?
                </h3>
                <p className="text-sm text-gray-600">
                  If you're having trouble resetting your password, please contact our{' '}
                  <Link to="/support" className="text-blue-600 hover:text-blue-700 font-medium">
                    support team
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Alternative Options */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Remember your password?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            We'll send you a secure link to reset your password. The link expires in 1 hour.
          </p>
        </div>
      </div>
    </div>
  );
}