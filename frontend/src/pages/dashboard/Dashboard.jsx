import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Globe,
  Plus,
  TrendingUp,
  Wallet as WalletIcon
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome Back! 👋
            </h1>
            <p className="text-gray-600 text-lg">Here's what's happening with your account today.</p>
          </div>
          <Link
            to="/search"
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            New Domain
          </Link>
        </div>
      </div>

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Globe className="text-white" size={24} />}
          title="Active Domains"
          value="0"
          subtitle="Domains managed"
          trend="+0%"
          trendUp={true}
          gradient="from-purple-500 to-purple-600"
          bgPattern="purple"
        />
        <StatCard
          icon={<FileText className="text-white" size={24} />}
          title="Pending Invoices"
          value="0"
          subtitle="Awaiting payment"
          trend="0 overdue"
          trendUp={false}
          gradient="from-blue-500 to-blue-600"
          bgPattern="blue"
        />
        <StatCard
          icon={<WalletIcon className="text-white" size={24} />}
          title="Wallet Balance"
          value="$0.00"
          subtitle="Available funds"
          trend="+$0"
          trendUp={true}
          gradient="from-green-500 to-emerald-600"
          bgPattern="green"
        />
        <StatCard
          icon={<TrendingUp className="text-white" size={24} />}
          title="This Month"
          value="$0.00"
          subtitle="Total spent"
          trend="+0%"
          trendUp={true}
          gradient="from-orange-500 to-red-500"
          bgPattern="orange"
        />
      </div>

      {/* Quick Actions - Enhanced */}
      <div className="glass rounded-2xl shadow-lg p-6 mb-8 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <span className="text-sm text-gray-500">Start managing your services</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Register Domain"
            description="Find and register new domains"
            icon={<Globe size={24} />}
            gradient="from-purple-500 to-purple-600"
            link="/search"
          />
          <QuickActionCard
            title="View Invoices"
            description="Check pending payments"
            icon={<FileText size={24} />}
            gradient="from-blue-500 to-blue-600"
            link="/dashboard/invoices"
          />
          <QuickActionCard
            title="Add Funds"
            description="Top up your wallet"
            icon={<WalletIcon size={24} />}
            gradient="from-green-500 to-emerald-600"
            link="/dashboard/wallet"
          />
        </div>
      </div>

      {/* Grid Layout for Recent Activity and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity size={24} className="text-purple-600" />
              Recent Activity
            </h2>
            <Link to="/dashboard/activity" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
              View all
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            <EmptyState
              icon={<Activity size={48} className="text-gray-300" />}
              title="No recent activity"
              description="Your account activity will appear here"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass rounded-2xl shadow-lg p-6 border border-white/20">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-600" />
            Performance Overview
          </h2>
          <div className="space-y-4">
            <MetricRow
              label="Domain Renewals"
              value="0"
              total="0"
              percentage={0}
              color="purple"
            />
            <MetricRow
              label="Payment Success Rate"
              value="0"
              total="0"
              percentage={100}
              color="green"
            />
            <MetricRow
              label="Active Services"
              value="0"
              total="0"
              percentage={0}
              color="blue"
            />
          </div>
        </div>
      </div>

      {/* Getting Started Guide (for new users) */}
      <div className="mt-8 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 rounded-2xl p-8 border border-purple-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">🚀 Get Started with SaaSify</h3>
            <p className="text-gray-600 mb-6">Complete these steps to make the most of your account</p>
            <div className="space-y-3">
              <ChecklistItem completed={true} text="Create your account" />
              <ChecklistItem completed={false} text="Register your first domain" />
              <ChecklistItem completed={false} text="Add funds to your wallet" />
              <ChecklistItem completed={false} text="Set up domain DNS" />
            </div>
          </div>
          <div className="hidden lg:block">
            <img 
              src="/api/placeholder/200/200" 
              alt="Getting Started"
              className="w-48 h-48 object-contain opacity-80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, trend, trendUp, gradient, bgPattern }) {
  return (
    <div className="card-hover group relative bg-white rounded-2xl shadow-lg p-6 overflow-hidden border border-gray-100">
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      <div className="relative z-10">
        {/* Icon */}
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
          {icon}
        </div>

        {/* Content */}
        <h3 className="text-gray-600 text-sm font-medium mb-2 group-hover:text-white transition-colors">
          {title}
        </h3>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-white transition-colors">
              {value}
            </p>
            <p className="text-sm text-gray-500 group-hover:text-white/80 transition-colors">
              {subtitle}
            </p>
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trendUp ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
          } group-hover:bg-white/20 group-hover:text-white transition-colors`}>
            {trendUp && <ArrowUpRight size={14} />}
            {trend}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon, gradient, link }) {
  return (
    <Link
      to={link}
      className="card-hover group relative px-6 py-5 bg-white rounded-xl border-2 border-gray-100 hover:border-transparent transition-all text-left overflow-hidden"
    >
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${gradient} text-white mb-3 transform group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors">
          {description}
        </p>
        <div className="mt-3 flex items-center text-sm font-semibold text-purple-600 group-hover:text-white">
          <span>Get started</span>
          <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex mb-4">
        {icon}
      </div>
      <p className="text-gray-600 font-medium mb-1">{title}</p>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function MetricRow({ label, value, total, percentage, color }) {
  const colors = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function ChecklistItem({ completed, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
        completed ? 'bg-green-500' : 'bg-gray-200'
      } transition-colors`}>
        {completed && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`${completed ? 'text-gray-500 line-through' : 'text-gray-700 font-medium'}`}>
        {text}
      </span>
    </div>
  );
}
