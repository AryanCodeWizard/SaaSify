import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import cartService from '../../services/cart.service';
import useAuthStore from '../../store/authStore';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Fetch cart count
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartCount();
    }
  }, [isAuthenticated, location.pathname]); // Refetch when location changes

  const fetchCartCount = async () => {
    try {
      const response = await cartService.getCart();
      const itemCount = response.data?.cart?.items?.length || 0;
      setCartCount(itemCount);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="group flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200">
                SaaSify
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/search"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                isActive('/search') 
                  ? 'bg-purple-50 text-purple-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Search Domains
            </Link>
            <Link
              to="/cart"
              className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 font-semibold relative"
            >
              <ShoppingCart size={20} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-bold animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="ml-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 font-bold"
              >
                <User size={18} />
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200 font-semibold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-bold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-purple-600"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link
                to="/search"
                className="text-gray-700 hover:text-purple-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search Domains
              </Link>
              <Link
                to="/cart"
                className="text-gray-700 hover:text-purple-600 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
                {cartCount > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-purple-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
