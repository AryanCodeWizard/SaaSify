import { AlertCircle, Eye, EyeOff, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Load remembered email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(formData);
      setUser(response.data.user);
      
      // Save email to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      
      // Set field-specific error if available
      if (error.response?.data?.field) {
        setErrors(prev => ({ ...prev, [error.response.data.field]: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <div className="max-w-md w-full">
        {/* Card with glass effect */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Gradient header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-500 p-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <LogIn className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold text-white">SaaSify</h1>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white/95">Welcome Back</h2>
            <p className="mt-1 text-sm text-white/80">Sign in to access your dashboard</p>
          </div>

          {/* Form content */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
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
                    value={formData.email}
                    onChange={handleChange}
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
                    <AlertCircle size={14} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-11 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.password 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                    }`}
                    placeholder="Enter your password"
                  />
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    errors.password ? 'text-red-400' : 'text-gray-400'
                  }`} size={20} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 group"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="group-hover:translate-x-1 transition-transform" size={20} />
                    Sign In
                  </span>
                )}
              </button>

              {/* Demo Credentials (Optional) */}
              {/* */}
            </form>

            {/* Divider */}
            <div className="mt-8 mb-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to SaaSify?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center w-full py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <span className="mr-2">Create an account</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Social Login (Optional) */}
          </div>
        </div>
        
        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-blue-600 hover:underline">Terms</Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
          . Protected by 256-bit SSL encryption.
        </p>
      </div>
    </div>
  );
}