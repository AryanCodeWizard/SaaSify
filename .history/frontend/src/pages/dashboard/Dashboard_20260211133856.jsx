import { AlertCircle, ArrowRight, FileText, Globe, Loader2, TrendingUp, Wallet as WalletIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { domainService } from '../../services/domainService';
import { invoiceService } from '../../services/invoiceService';
import toast from 'react-hot-toast';
import { walletService } from '../../services/walletService';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    domains: 0,
    invoices: 0,
    walletBalance: 0,
    monthlySpend: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [domainsRes, invoicesRes, walletRes] = await Promise.allSettled([
          domainService.getMyDomains({ page: 1, limit: 1 }),
          invoiceService.getMyInvoices({ page: 1, limit: 1, status: 'unpaid' }),
          walletService.getWalletBalance(),
        ]);

        if (!isMounted) return;

        const newStats = {
          domains: 0,
          invoices: 0,
          walletBalance: 0,
          monthlySpend: 0,
        };

      // Process domains
      if (domainsRes.status === 'fulfilled') {
        newStats.domains = domainsRes.value.data.pagination?.totalDomains || domainsRes.value.data.domains?.length || 0;
      }

      // Process invoices
      if (invoicesRes.status === 'fulfilled') {
        newStats.invoices = invoicesRes.value.data.pagination?.totalInvoices || invoicesRes.value.data.invoices?.length || 0;
      }

      // Process wallet
      if (walletRes.status === 'fulfilled') {
        newStats.walletBalance = walletRes.value.data.balance || 0;
      }

      // Calculate monthly spend (mock for now - can be updated with real API)
      newStats.monthlySpend = 0;

      setStats(newStats);

      // Get recent activity (combining domains and invoices)
      const activity = [];
      
      if (domainsRes.status === 'fulfilled' && domainsRes.value.data.domains?.length > 0) {
        const recentDomains = domainsRes.value.data.domains.slice(0, 3);
        recentDomains.forEach(domain => {
          activity.push({
            type: 'domain',
            title: `Domain Registered: ${domain.domainName}`,
            date: domain.registrationDate,
            status: domain.status,
          });
        });
      }

      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data.invoices?.length > 0) {
        const recentInvoices = invoicesRes.value.data.invoices.slice(0, 3);
        recentInvoices.forEach(invoice => {
          activity.push({
            type: 'invoice',
            title: `Invoice ${invoice.invoiceNumber}`,
            date: invoice.invoiceDate,
            status: invoice.status,
            amount: invoice.totalAmount,
          });
        });
      }

      // Sort by date
      activity.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivity(activity.slice(0, 5));

      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your account.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Globe className="text-purple-600" size={24} />}
          title="Domains"
          value={stats.domains.toString()}
          subtitle="Active domains"
          color="purple"
          link="/dashboard/domains"
        />
        <StatCard
          icon={<FileText className="text-blue-600" size={24} />}
          title="Invoices"
          value={stats.invoices.toString()}
          subtitle="Pending invoices"
          color="blue"
          link="/dashboard/invoices"
        />
        <StatCard
          icon={<WalletIcon className="text-green-600" size={24} />}
          title="Wallet"
          value={formatCurrency(stats.walletBalance)}
          subtitle="Available balance"
          color="green"
          link="/dashboard/wallet"
        />
        <StatCard
          icon={<TrendingUp className="text-orange-600" size={24} />}
          title="Spent"
          value={formatCurrency(stats.monthlySpend)}
          subtitle="Total this month"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/search"
            className="px-6 py-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-left block"
          >
            <h3 className="font-semibold mb-1">Register Domain</h3>
            <p className="text-sm text-purple-600/70">Find and register new domains</p>
          </Link>
          <Link
            to="/dashboard/invoices"
            className="px-6 py-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-left block"
          >
            <h3 className="font-semibold mb-1">View Invoices</h3>
            <p className="text-sm text-blue-600/70">Check pending payments</p>
          </Link>
          <Link
            to="/dashboard/wallet"
            className="px-6 py-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-left block"
          >
            <h3 className="font-semibold mb-1">Add Funds</h3>
            <p className="text-sm text-green-600/70">Top up your wallet</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          {recentActivity.length > 0 && (
            <Link
              to="/dashboard/domains"
              className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="mx-auto mb-2 text-gray-400" size={48} />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Get started by registering a domain</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'domain' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    {activity.type === 'domain' ? (
                      <Globe className="text-purple-600" size={20} />
                    ) : (
                      <FileText className="text-blue-600" size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{formatDate(activity.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {activity.amount && (
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(activity.amount)}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'active' || activity.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : activity.status === 'pending' || activity.status === 'unpaid'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color, link }) {
  const colorClasses = {
    purple: 'bg-purple-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50',
  };

  const CardContent = (
    <>
      <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </>
  );

  if (link) {
    return (
      <Link to={link} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow block">
        {CardContent}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {CardContent}
    </div>
  );
}
