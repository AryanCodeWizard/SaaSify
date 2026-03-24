import {
  AlertCircle,
  CheckCircle,
  Clock,
  Cloud,
  Database,
  Globe,
  Plus,
  RefreshCw,
  Server,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { getAllHostingServices } from '../../services/hostingService';
import toast from 'react-hot-toast';

const HostingServices = () => {
  const [services, setServices] = useState({ static: [], dynamic: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'static', 'dynamic'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'provisioning', etc.

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await getAllHostingServices();
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching hosting services:', error);
      toast.error(error.response?.data?.message || 'Failed to load hosting services');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Active' },
      provisioning: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Provisioning' },
      suspended: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', label: 'Suspended' },
      terminating: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Terminating' },
      terminated: { icon: XCircle, color: 'bg-gray-100 text-gray-800', label: 'Terminated' },
      failed: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Failed' },
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    if (type === 'static') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
          <Cloud className="w-3 h-3 mr-1" />
          Static
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
        <Server className="w-3 h-3 mr-1" />
        Dynamic
      </span>
    );
  };

  const filteredServices = services.all.filter(service => {
    const typeMatch = filter === 'all' || service.type === filter;
    const statusMatch = statusFilter === 'all' || service.status === statusFilter;
    return typeMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hosting Services</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your static and dynamic hosting services
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchServices}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <Link
              to="/dashboard/hosting/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Hosting
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <Globe className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Services</dt>
                    <dd className="text-lg font-semibold text-gray-900">{services.all.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <Cloud className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Static Hosting</dt>
                    <dd className="text-lg font-semibold text-gray-900">{services.static.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <Server className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Dynamic Hosting</dt>
                    <dd className="text-lg font-semibold text-gray-900">{services.dynamic.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {services.all.filter(s => s.status === 'active').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="flex space-x-2">
                {['all', 'static', 'dynamic'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      filter === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex space-x-2">
                {['all', 'active', 'provisioning', 'suspended'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      statusFilter === status
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hosting services</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new hosting service for your domain.
          </p>
          <div className="mt-6">
            <Link
              to="/dashboard/hosting/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Hosting
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredServices.map((service) => (
              <li key={service._id}>
                <Link
                  to={`/dashboard/hosting/${service.type}/${service._id}`}
                  className="block hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          {getTypeBadge(service.type)}
                        </div>
                        <div>
                          <p className="text-lg font-medium text-indigo-600 truncate">
                            {service.domainName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {service.plan?.name} - ${service.plan?.price}/
                            {service.plan?.billingCycle}
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 shrink-0 flex">
                        {getStatusBadge(service.status)}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex space-x-6">
                        {service.type === 'static' && service.static?.cloudfrontUrl && (
                          <p className="flex items-center text-sm text-gray-500">
                            <Cloud className="shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            CDN: {service.static.cloudfrontUrl}
                          </p>
                        )}
                        {service.type === 'dynamic' && service.dynamic?.instanceId && (
                          <p className="flex items-center text-sm text-gray-500">
                            <Server className="shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {service.dynamic.instanceType} · {service.dynamic.publicIp || 'Provisioning...'}
                          </p>
                        )}
                        {service.type === 'dynamic' && service.dynamic?.database?.enabled && (
                          <p className="flex items-center text-sm text-gray-500">
                            <Database className="shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {service.dynamic.database.engine}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Clock className="shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p>
                          Created {new Date(service.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HostingServices;
