import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Filter,
  Loader2,
  Search,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { invoiceService } from '../../services/invoiceService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  paid: { 
    label: 'Paid', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  unpaid: { 
    label: 'Unpaid', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    iconColor: 'text-red-600'
  },
  partially_paid: { 
    label: 'Partially Paid', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  overdue: { 
    label: 'Overdue', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
    iconColor: 'text-gray-600'
  },
  refunded: { 
    label: 'Refunded', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: CheckCircle,
    iconColor: 'text-purple-600'
  },
};

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchInvoices = async () => {
      try {
        setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };
      
      const response = await invoiceService.getMyInvoices(params);
      
      if (!isMounted) return;
      
      setInvoices(response.data.invoices || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      
      // Calculate stats
      if (response.data.invoices) {
        const allInvoices = response.data.invoices;
        setStats({
          total: allInvoices.length,
          paid: allInvoices.filter(i => i.status === 'paid').length,
          unpaid: allInvoices.filter(i => i.status === 'unpaid').length,
          overdue: allInvoices.filter(i => i.status === 'overdue').length,
        });
      }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching invoices:', error);
        toast.error(error.message || 'Failed to load invoices');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInvoices();
    
    return () => {
      isMounted = false;
    };
  }, [page, statusFilter]);

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleDownloadPDF = async (invoiceId, e) => {
    e.stopPropagation();
    try {
      await invoiceService.downloadInvoicePDF(invoiceId);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">View and manage your billing history</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon={<FileText className="text-blue-600" size={24} />}
          label="Total Invoices"
          value={stats.total}
          color="blue"
        />
        <StatsCard
          icon={<CheckCircle className="text-green-600" size={24} />}
          label="Paid"
          value={stats.paid}
          color="green"
        />
        <StatsCard
          icon={<Clock className="text-yellow-600" size={24} />}
          label="Unpaid"
          value={stats.unpaid}
          color="yellow"
        />
        <StatsCard
          icon={<AlertCircle className="text-red-600" size={24} />}
          label="Overdue"
          value={stats.overdue}
          color="red"
        />
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
              placeholder="Search invoices..."
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
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {searchQuery ? 'No invoices found' : 'No invoices yet'}
          </h2>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Your invoices will appear here once you make a purchase'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice._id}
                invoice={invoice}
                onClick={() => navigate(`/dashboard/invoices/${invoice._id}`)}
                onDownload={(e) => handleDownloadPDF(invoice._id, e)}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
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

function StatsCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function InvoiceCard({ invoice, onClick, onDownload, formatDate, formatCurrency }) {
  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.unpaid;
  const StatusIcon = statusConfig.icon;
  const isDue = invoice.status === 'unpaid' || invoice.status === 'overdue';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Invoice Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${statusConfig.color}`}>
            <StatusIcon className={statusConfig.iconColor} size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                {invoice.invoiceNumber}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Issued: {formatDate(invoice.invoiceDate)}</span>
              </div>
              
              {invoice.dueDate && (
                <div className={`flex items-center gap-1 ${isDue ? 'text-red-600 font-medium' : ''}`}>
                  <Clock size={16} />
                  <span>Due: {formatDate(invoice.dueDate)}</span>
                </div>
              )}
            </div>

            {invoice.description && (
              <p className="text-sm text-gray-600 truncate">
                {invoice.description}
              </p>
            )}
          </div>
        </div>

        {/* Amount & Actions */}
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(invoice.totalAmount, invoice.currency)}
            </div>
            {invoice.status === 'partially_paid' && invoice.paidAmount > 0 && (
              <p className="text-sm text-gray-600">
                Paid: {formatCurrency(invoice.paidAmount, invoice.currency)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDue && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(e);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <CreditCard size={16} />
                Pay Now
              </button>
            )}
            <button
              onClick={onDownload}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download size={20} />
            </button>
            <ChevronRight className="text-gray-400 group-hover:text-purple-600 transition-colors" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
