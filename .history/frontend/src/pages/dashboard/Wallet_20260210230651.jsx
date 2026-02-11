import { ArrowDownRight, ArrowUpRight, DollarSign, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';
import { walletService } from '../../services/walletService';

export default function Wallet() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        walletService.getWalletBalance(),
        walletService.getWalletTransactions({ page: 1, limit: 10 }),
      ]);
      setBalance(balanceRes.data);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFundsSuccess = () => {
    setShowAddFundsModal(false);
    fetchWalletData();
    toast.success('Funds added successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading wallet...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <button 
          onClick={() => setShowAddFundsModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} />
          Add Funds
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign size={32} />
          <h2 className="text-xl font-semibold">Available Balance</h2>
        </div>
        <p className="text-5xl font-bold mb-2">
          ₹{balance?.balance?.toFixed(2) || '0.00'}
        </p>
        <p className="text-purple-100">Currency: {balance?.currency || 'INR'}</p>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <TransactionItem key={tx._id} transaction={tx} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <AddFundsModal 
          onClose={() => setShowAddFundsModal(false)}
          onSuccess={handleAddFundsSuccess}
        />
      )}
    </div>
  );
}

function TransactionItem({ transaction }) {
  const isCredit = transaction.type === 'credit';

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
          {isCredit ? (
            <ArrowDownRight className="text-green-600" size={20} />
          ) : (
            <ArrowUpRight className="text-red-600" size={20} />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{transaction.description}</p>
          <p className="text-sm text-gray-500">
            {new Date(transaction.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <p className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
        {isCredit ? '+' : '-'}₹{transaction.amount.toFixed(2)}
      </p>
    </div>
  );
}

function AddFundsModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const handleAddFunds = async () => {
    const parsedAmount = parseFloat(amount);
    
    if (!amount || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parsedAmount < 10) {
      toast.error('Minimum amount is ₹10');
      return;
    }

    try {
      setProcessing(true);

      // Create Razorpay order for wallet
      const orderResponse = await paymentService.createWalletRazorpayOrder({
        amount: parsedAmount,
      });

      const { orderId, amount: orderAmount, currency } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RXgFDxf85u97LY',
        amount: orderAmount, // Amount in paise
        currency: currency,
        name: 'SaaSify',
        description: 'Add Funds to Wallet',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            await paymentService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            onSuccess();
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            toast.error('Payment cancelled');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
        },
        theme: {
          color: '#9333ea' // Purple color to match wallet theme
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error creating payment order:', error);
      toast.error(error.response?.data?.error || 'Failed to initialize payment');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Funds to Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Quick Amount Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quick Select Amount
          </label>
          <div className="grid grid-cols-3 gap-3">
            {quickAmounts.map((value) => (
              <button
                key={value}
                onClick={() => handleQuickAmount(value)}
                className={`px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                  amount === value.toString()
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300 text-gray-700'
                }`}
              >
                ₹{value}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div className="mb-6">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Or Enter Custom Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              ₹
            </span>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="10"
              step="10"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Minimum amount: ₹10</p>
        </div>

        {/* Summary */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Amount to Add:</span>
              <span className="text-2xl font-bold text-purple-600">
                ₹{parseFloat(amount).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={handleAddFunds}
            disabled={processing || !amount || parseFloat(amount) < 10}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Proceed to Pay'}
          </button>
        </div>

        {/* Payment Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You will be redirected to Razorpay for secure payment
        </p>
      </div>
    </div>
  );
}
