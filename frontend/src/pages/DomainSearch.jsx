import { AlertCircle, CheckCircle2, Globe2, Loader2, Search, ShoppingCart, Sparkles, TrendingUp } from 'lucide-react';

import cartService from '../services/cart.service';
import domainService from '../services/domain.service';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function DomainSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});

  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a domain name or keyword');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Check if it's a full domain (has a dot and TLD)
      const hasTLD = /\.(com|net|org|io|co|app|dev|xyz|online|store|tech|site|website|space|club|info|biz|us|uk|ca|ai)$/i.test(searchQuery);
      
      if (hasTLD) {
        // Direct availability check for full domain
        const response = await domainService.checkAvailability(searchQuery);
        
        if (response.success) {
          // Backend returns data in 'message' field for this endpoint
          const domainData = response.message || response.data;
          setResults([domainData]);
        } else {
          setResults([]);
          toast.error('Failed to check domain availability');
        }
      } else {
        // Search for suggestions if no TLD provided
        const response = await domainService.searchDomains(searchQuery, {
          checkAvailability: true,
          maxResults: 20,
        });

        if (response.success && response.data) {
          const searchResults = response.data.results || [];
          setResults(searchResults);
          
          if (searchResults.length === 0) {
            toast('No results found. Try a different keyword.', {
              icon: 'ℹ️',
            });
          }
        } else {
          setResults([]);
          toast.error('Search completed but no data returned');
        }
      }
    } catch (error) {
      console.error('Domain search error:', error);
      toast.error(error.response?.data?.message || 'Failed to search domains');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTLDClick = (tld) => {
    const query = searchQuery.replace(/\.(com|net|org|io|co|app|dev)$/i, '');
    setSearchQuery(query + tld);
    // Auto-search when clicking TLD
    setTimeout(() => handleSearch(), 100);
  };

  const addToCart = async (domainResult) => {
    setAddingToCart(prev => ({ ...prev, [domainResult.domain]: true }));
    
    try {
      await cartService.addToCart({
        type: 'domain',
        itemId: domainResult.domain,
        name: domainResult.domain,
        price: domainResult.price || 12.99,
        period: 1, // Default 1 year
        quantity: 1,
        currency: 'USD',
        metadata: {
          tld: domainResult.domain.split('.').pop(),
          registrar: 'GoDaddy',
        },
      });
      
      toast.success(`${domainResult.domain} added to cart!`, {
        icon: '🛒',
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [domainResult.domain]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-600">Find Your Perfect Domain</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600">
            Search for your perfect domain
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">Discover the ideal domain name for your business. Instant availability checks across all TLDs.</p>
        </div>

        {/* Search Box */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 mb-12">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your dream domain..."
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-lg font-medium placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Searching...
                </>
              ) : (
                'Search Now'
              )}
            </button>
          </form>
          
          {/* Popular Extensions */}
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-sm text-slate-600 font-medium">Popular:</span>
            {['.com', '.net', '.org', '.io', '.co', '.app'].map((ext) => (
              <button
                key={ext}
                onClick={() => handleTLDClick(ext)}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-110 disabled:opacity-50"
              >
                {ext}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              {loading ? 'Searching...' : `Search Results (${results.length})`}
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-purple-600" size={48} />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-purple-50 border-2 border-slate-200 hover:border-purple-300 rounded-xl transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.available ? 'bg-green-100' : 'bg-red-100'}`}>
                        {result.available ? (
                          <CheckCircle2 className="text-green-600" size={20} />
                        ) : (
                          <AlertCircle className="text-red-600" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800">{result.domain}</h3>
                        <p className="text-sm text-slate-600">
                          {result.available ? 'Available' : 'Unavailable'}
                        </p>
                      </div>
                      {result.available && result.price && (
                        <div className="text-right">
                          <p className="text-2xl font-black text-purple-600">
                            ${result.price}
                          </p>
                          <p className="text-xs text-slate-500">per year</p>
                        </div>
                      )}
                    </div>
                    {result.available && (
                      <button
                        onClick={() => addToCart(result)}
                        disabled={addingToCart[result.domain]}
                        className="ml-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100 transform scale-95 group-hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {addingToCart[result.domain] ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            Add to Cart
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Globe2 className="mx-auto text-slate-300 mb-4" size={64} />
                <p className="text-lg text-slate-600">No results found. Try a different search term.</p>
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Globe2 className="text-white" size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Instant Availability</h3>
            <p className="text-slate-600">Real-time domain availability across all major TLDs</p>
          </div>
          
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <TrendingUp className="text-white" size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Best Prices</h3>
            <p className="text-slate-600">Competitive pricing with no hidden fees</p>
          </div>
          
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Sparkles className="text-white" size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Smart Suggestions</h3>
            <p className="text-slate-600">AI-powered alternatives if your domain is taken</p>
          </div>
        </div>

        {/* Status Badge */}
        {!hasSearched && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 rounded-full">
              <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
              <span className="text-green-800 font-bold">Live domain search powered by GoDaddy</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
