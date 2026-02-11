import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { invoiceService } from '../../services/invoiceService';

const statusColors = {
  paid: 'bg-green-100 text-green-800 border-green-200',
  unpaid: 'bg-red-100 text-red-800 border-red-200',
  partially_paid: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-purple-100 text-purple-800 border-purple-200',
};

const statusIcons = {
  paid: CheckCircleIcon,
  unpaid: ExclamationCircleIcon,
  partially_paid: ClockIcon,
  cancelled: ExclamationCircleIcon,
  overdue: ExclamationCircleIcon,
  refunded: CheckCircleIcon,
};

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoiceService.getInvoiceById(id);
      setInvoice(response.data.invoice);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err.response?.data?.error || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await invoiceService.downloadInvoicePDF(id);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download invoice PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handlePayNow = () => {
    navigate(`/checkout?invoiceId=${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="mt-4 text-red-600 hover:text-red-800 font-medium"
          >
            ← Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Invoice not found</p>
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[invoice.status] || ExclamationCircleIcon;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/invoices')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Invoices
        </button>
        
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-gray-500 mt-1">Created on {formatDate(invoice.invoiceDate)}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${statusColors[invoice.status] || statusColors.unpaid}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">SaaSify</h2>
              <p className="text-gray-600 mt-1">Domain & Hosting Services</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="font-semibold text-gray-900">{formatDate(invoice.invoiceDate)}</p>
              {invoice.dueDate && (
                <>
                  <p className="text-sm text-gray-600 mt-2">Due Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="px-8 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.description}</div>
                        {item.details && <div className="text-xs text-gray-500 mt-1">{item.details}</div>}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(item.amount, invoice.currency)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Totals */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
          <div className="max-w-sm ml-auto space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </span>
            </div>
            
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(invoice.discount, invoice.currency)}
                </span>
              </div>
            )}
            
            {invoice.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.tax, invoice.currency)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-300">
              <span className="text-gray-900">Total:</span>
              <span className="text-blue-600">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>

            {invoice.paidAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paid Amount:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.paidAmount, invoice.currency)}
                </span>
              </div>
            )}

            {invoice.status === 'partially_paid' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance Due:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(invoice.total - invoice.paidAmount, invoice.currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 py-6 bg-white border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          
          {(invoice.status === 'unpaid' || invoice.status === 'partially_paid') && (
            <button
              onClick={handlePayNow}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Pay Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
