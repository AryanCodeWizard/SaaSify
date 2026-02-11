import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Filter,
  Globe,
  Loader2,
  Search,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { domainService } from '../../services/domainService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  active: { 
    label: 'Active', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  expired: { 
    label: 'Expired', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    iconColor: 'text-red-600'
  },
  suspended: { 
    label: 'Suspended', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle,
    iconColor: 'text-orange-600'
  },
};

export default function Domains() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;
    
    const fetchDomains = async () => {
      try {
        setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };
      
      const response = await domainService.getMyDomains(params);
      
      if (!isMounted) return;
      
      setDomains(response.data.domains || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching domains:', error);
        toast.error(error.message || 'Failed to load domains');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDomains();
    
    return () => {
      isMounted = false;
    };
  }, [page, statusFilter]);

  const filteredDomains = domains.filter(domain =>
    domain.domainName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Domains</h1>
          <p className="text-gray-600 mt-1">Manage all your registered domains</p>
        </div>
        <button
          onClick={() => navigate('/search')}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Globe size={20} />
          Register New Domain
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search domains..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Domains List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {searchQuery ? 'No domains found' : 'No domains yet'}
          </h2>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Register your first domain to get started!'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
            >
              <Globe size={20} />
              Search Domains
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredDomains.map((domain) => (
              <DomainCard
                key={domain._id}
                domain={domain}
                onClick={() => navigate(`/dashboard/domains/${domain._id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DomainCard({ domain, onClick }) {
  const statusConfig = STATUS_CONFIG[domain.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const daysUntilExpiry = getDaysUntilExpiry(domain.expiresAt);
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Domain Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${statusConfig.color}`}>
            <StatusIcon className={statusConfig.iconColor} size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                {domain.domain}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Registered: {formatDate(domain.registeredAt)}</span>
              </div>
              
              {domain.expiresAt && (
                <div className={`flex items-center gap-1 ${isExpiringSoon ? 'text-orange-600 font-medium' : ''}`}>
                  <Clock size={16} />
                  <span>
                    Expires: {formatDate(domain.expiresAt)}
                    {isExpiringSoon && ` (${daysUntilExpiry} days)`}
                  </span>
                </div>
              )}
            </div>

            {isExpiringSoon && (
              <div className="mt-2 flex items-center gap-1 text-sm text-orange-600">
                <AlertCircle size={16} />
                <span className="font-medium">Expiring soon! Renew to avoid service interruption.</span>
              </div>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0">
          <ChevronRight className="text-gray-400 group-hover:text-purple-600 transition-colors" size={24} />
        </div>
      </div>
    </div>
  );
}
