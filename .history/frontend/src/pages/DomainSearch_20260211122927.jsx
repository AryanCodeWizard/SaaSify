import { Check, DollarSign, Filter, Loader2, Search, ShoppingCart, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import cartService from '../services/cartService';
import { domainService } from '../services/domainService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const POPULAR_TLDS = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.ai'];

export default function DomainSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTlds, setSelectedTlds] = useState(POPULAR_TLDS);
  const [showFilters, setShowFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});

  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const response = await domainService.searchDomains({
        query: searchQuery.trim().toLowerCase(),
        tlds: selectedTlds, // Pass array directly, axios will serialize it properly
        checkAvailability: true,
        maxResults: 20,
      });

      setSearchResults(response.data.results || []);
      
      if (response.data.results?.length === 0) {
        toast.error('No domains found for your search');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search domains');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTldToggle = (tld) => {
    setSelectedTlds(prev => 
      prev.includes(tld) 
        ? prev.filter(t => t !== tld)
        : [...prev, tld]
    );
  };

  const handleAddToCart = async (domain) => {
    try {
      setAddingToCart(prev => ({ ...prev, [domain.domain]: true }));
      
      // Extract TLD from domain name
      const domainName = domain.domain;
      const tld = domainName.substring(domainName.lastIndexOf('.')).toLowerCase();
      
      await cartService.addToCart({
        type: 'domain',
        itemId: domainName,
        name: domainName,
        price: domain.price || 0, // Price is already in correct format from backend
        period: 1, // years
        quantity: 1,
        currency: 'USD', // GoDaddy prices are in USD
        metadata: {
          domain: domainName,
          tld: tld,
          available: domain.available,
          definitive: domain.definitive,
          privacy: true,
          autoRenew: true,
        }
      });

      toast.success('Added to cart!');
      
      // Update the result to show it's in cart
      setSearchResults(prev =>
        prev.map(result =>
          result.domain === domain.domain
            ? { ...result, inCart: true }
            : result
        )
      );
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [domain.domain]: false }));
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price / 1000000); // GoDaddy returns price in micros
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Your Perfect Domain
          </h1>
          <p className="text-lg text-gray-600">
            Search millions of domains and register yours instantly
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter domain name (e.g., mybusiness)"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Search
                </>
              )}
            </button>
          </form>

          {/* TLD Filters */}
          <div className="mt-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              <Filter size={18} />
              <span className="font-medium">Filter by extension ({selectedTlds.length} selected)</span>
            </button>

            {showFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {POPULAR_TLDS.map((tld) => (
                  <button
                    key={tld}
                    onClick={() => handleTldToggle(tld)}
                    className={`px-4 py-2 rounded-full border transition-all ${
                      selectedTlds.includes(tld)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-600'
                    }`}
                  >
                    {tld}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Searching available domains...</p>
          </div>
        )}

        {!loading && hasSearched && searchResults.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No results found
            </h3>
            <p className="text-gray-600">
              Try searching with different keywords or extensions
            </p>
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Search Results ({searchResults.length})
              </h2>
              <button
                onClick={() => navigate('/dashboard/cart')}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                <ShoppingCart size={20} />
                View Cart
              </button>
            </div>

            <div className="space-y-3">
              {searchResults.map((result) => (
                <DomainResultCard
                  key={result.domain}
                  domain={result}
                  onAddToCart={handleAddToCart}
                  isAddingToCart={addingToCart[result.domain]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-purple-600 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Start Your Domain Search
            </h3>
            <p className="text-gray-600 mb-6">
              Enter a domain name or keyword above to get started
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['mybusiness', 'techstartup', 'designstudio'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setTimeout(() => handleSearch(), 100);
                  }}
                  className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Try "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DomainResultCard({ domain, onAddToCart, isAddingToCart }) {
  const isAvailable = domain.available;

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg ${
      !isAvailable ? 'opacity-60' : ''
    }`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Domain Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {isAvailable ? (
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="text-green-600" size={20} />
            </div>
          ) : (
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <X className="text-red-600" size={20} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate">
              {domain.domain}
            </h3>
            <p className={`text-sm ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {isAvailable ? 'Available' : 'Not Available'}
            </p>
          </div>
        </div>

        {/* Price & Action */}
        {isAvailable && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-2xl font-bold text-purple-600">
                <DollarSign size={20} />
                {domain.price ? (
                  <span>₹{(domain.price / 1000000).toFixed(2)}</span>
                ) : (
                  <span>Contact Us</span>
                )}
              </div>
              <p className="text-sm text-gray-500">per year</p>
            </div>
            
            {domain.inCart ? (
              <button
                onClick={() => {}}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed flex items-center gap-2"
                disabled
              >
                <Check size={18} />
                In Cart
              </button>
            ) : (
              <button
                onClick={() => onAddToCart(domain)}
                disabled={isAddingToCart}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Add to Cart
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
