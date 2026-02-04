import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return Math.min(score, 100);
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      
      // Set field-specific error if available
      if (error.response?.data?.field) {
        setErrors(prev => ({ ...prev, [error.response.data.field]: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 50) return 'bg-red-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Good';
    if (strength < 100) return 'Strong';
    return 'Very Strong';
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains number', met: /[0-9]/.test(formData.password) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(formData.password) },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 py-12">
      <div className="max-w-md w-full animate-fade-in">
        {/* Card with modern design */}
        <div className="glass rounded-3xl shadow-2xl overflow-hidden border border-white/40 backdrop-blur-xl">
          {/* Enhanced gradient header */}
          <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 p-8 text-center overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/30 shadow-lg">
                  <User className="text-white" size={28} />
                </div>
                <h1 className="text-4xl font-bold text-white">SaaSify</h1>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
              <p className="text-purple-100">Start your hosting journey with us</p>
            </div>
          </div>

          {/* Form content - Enhanced */}
          <div className="p-8 bg-white">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-bold text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative group">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-11 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                        errors.firstName 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                          : 'border-gray-200 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-300 bg-gray-50/50'
                      }`}
                      placeholder="John"
                    />
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                      errors.firstName ? 'text-red-400' : 'text-gray-400 group-hover:text-purple-500'
                    }`} size={20} />
                  </div>
                  {errors.firstName && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle size={14} />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-bold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative group">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-11 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                        errors.lastName 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                          : 'border-gray-200 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-300 bg-gray-50/50'
                      }`}
                      placeholder="Doe"
                    />
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                      errors.lastName ? 'text-red-400' : 'text-gray-400 group-hover:text-purple-500'
                    }`} size={20} />
                  </div>
                  {errors.lastName && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle size={14} />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-11 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                      errors.email 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-200 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-300 bg-gray-50/50'
                    }`}
                    placeholder="you@example.com"
                  />
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.email ? 'text-red-400' : 'text-gray-400 group-hover:text-purple-500'
                  }`} size={20} />
                </div>
                {errors.email && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle size={14} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700">
                    Password
                  </label>
                  {formData.password && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      passwordStrength < 50 ? 'bg-red-100 text-red-700' :
                      passwordStrength < 75 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  )}
                </div>
                
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-11 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                      errors.password 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-200 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-300 bg-gray-50/50'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.password ? 'text-red-400' : 'text-gray-400 group-hover:text-purple-500'
                  }`} size={20} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors p-1 rounded-lg hover:bg-purple-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    
                    {/* Password requirements */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs font-bold text-gray-700 mb-2">Password requirements:</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {req.met ? (
                              <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                            )}
                            <span className={`text-xs ${req.met ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle size={14} />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-11 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : formData.confirmPassword && formData.password === formData.confirmPassword
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50/50'
                        : 'border-gray-200 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-300 bg-gray-50/50'
                    }`}
                    placeholder="Re-enter your password"
                  />
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.confirmPassword ? 'text-red-400' : 
                    formData.confirmPassword && formData.password === formData.confirmPassword ? 'text-green-500' : 
                    'text-gray-400 group-hover:text-purple-500'
                  }`} size={20} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors p-1 rounded-lg hover:bg-purple-50"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle size={14} />
                    {errors.confirmPassword}
                  </p>
                ) : formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-2 text-xs text-green-600 flex items-center gap-1 font-medium">
                    <CheckCircle size={14} />
                    Passwords match perfectly!
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start p-4 bg-purple-50 rounded-xl border border-purple-100">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-0.5 cursor-pointer"
                />
                <label htmlFor="terms" className="ml-3 block text-sm text-gray-700 cursor-pointer">
                  I agree to the{' '}
                  <Link to="/terms" className="text-purple-600 hover:text-purple-700 font-bold underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-purple-600 hover:text-purple-700 font-bold underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-shine w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={22} />
                    Creating Your Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <User size={20} />
                    Create Account
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 mb-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Already have an account?</span>
              </div>
            </div>

            {/* Login Link */}
            <Link
              to="/login"
              className="flex items-center justify-center w-full py-3.5 px-4 border-2 border-purple-200 rounded-xl text-sm font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all shadow-sm hover:shadow-md"
            >
              <Mail className="mr-2" size={18} />
              Sign in to your account
            </Link>
          </div>
        </div>
        
        {/* Footer text */}
        <p className="mt-8 text-center text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/60">
          🔒 By creating an account, you agree to our terms. 
          <br />
          Your data is protected with <span className="font-bold text-purple-600">256-bit SSL encryption</span>.
        </p>
      </div>
    </div>
  );
}