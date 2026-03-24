import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Code,
  Copy,
  Database,
  Play,
  RefreshCw,
  Server,
  StopCircle,
  Terminal,
  Trash2
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  getDatabaseInfo,
  getDynamicHostingDetails,
  getInstanceStatus,
  getSshInfo,
  terminateDynamicHosting
} from '../../services/hostingService';
import { useCallback, useEffect, useState } from 'react';

import toast from 'react-hot-toast';

const DynamicHostingDetails = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [sshInfo, setSshInfo] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [instanceStatus, setInstanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServiceDetails = useCallback(async () => {
    try {
      const response = await getDynamicHostingDetails(id);
      setService(response.data);
    } catch (error) {
      console.error('Error fetching service details:', error);
      toast.error(error.response?.data?.message || 'Failed to load service details');
    }
  }, [id]);

  const fetchSshInfo = useCallback(async () => {
    try {
      const response = await getSshInfo(id);
      setSshInfo(response.data);
    } catch (error) {
      console.error('Error fetching SSH info:', error);
    }
  }, [id]);

  const fetchDatabaseInfo = useCallback(async () => {
    try {
      const response = await getDatabaseInfo(id);
      setDbInfo(response.data);
    } catch (error) {
      console.error('Error fetching database info:', error);
    }
  }, [id]);

  const fetchInstanceStatus = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await getInstanceStatus(id);
      setInstanceStatus(response.data);
    } catch (error) {
      console.error('Error fetching instance status:', error);
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchServiceDetails(),
      fetchSshInfo(),
      fetchDatabaseInfo(),
      fetchInstanceStatus()
    ]);
    setLoading(false);
  }, [fetchServiceDetails, fetchSshInfo, fetchDatabaseInfo, fetchInstanceStatus]);

  useEffect(() => {
    fetchAllData();
    // Auto-refresh instance status every 30 seconds
    const interval = setInterval(fetchInstanceStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData, fetchInstanceStatus]);

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate this hosting service? All data will be lost. This action cannot be undone.')) return;

    try {
      await terminateDynamicHosting(id);
      toast.success('Hosting service termination initiated');
      window.location.href = '/dashboard/hosting';
    } catch (error) {
      console.error('Error terminating service:', error);
      toast.error(error.response?.data?.message || 'Failed to terminate service');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const downloadPrivateKey = () => {
    if (!sshInfo?.privateKey) return;
    
    const blob = new Blob([sshInfo.privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${service.domainName}-key.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Private key downloaded');
  };

  const getStatusColor = (status) => {
    const colors = {
      running: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      stopping: 'text-orange-600 bg-orange-100',
      stopped: 'text-red-600 bg-red-100',
      terminated: 'text-gray-600 bg-gray-100'
    };
    return colors[status?.toLowerCase()] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Service not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard/hosting" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Hosting Services
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{service.domainName}</h1>
            <p className="mt-2 text-sm text-gray-600">Dynamic Hosting Service</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchInstanceStatus}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Service Status</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 capitalize">{service.status}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Instance Status</h3>
            {instanceStatus?.state && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(instanceStatus.state)}`}>
                {instanceStatus.state}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900">{service.dynamic?.instanceType}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Public IP</h3>
            <Server className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">{service.dynamic?.publicIp || 'Pending...'}</p>
            {service.dynamic?.publicIp && (
              <button
                onClick={() => copyToClipboard(service.dynamic.publicIp, 'IP Address')}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Runtime</h3>
            <Code className="w-5 h-5 text-purple-500" />
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-900 capitalize">{service.dynamic?.runtime}</p>
        </div>
      </div>

      {/* SSH Access Section */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Terminal className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">SSH Access</h3>
            </div>
            {sshInfo?.privateKey && (
              <button
                onClick={downloadPrivateKey}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Code className="w-4 h-4 mr-2" />
                Download Private Key
              </button>
            )}
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* SSH Command */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SSH Connection Command</label>
            <div className="flex items-center bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              <code className="flex-1">
                {sshInfo?.sshCommand || 'Loading...'}
              </code>
              {sshInfo?.sshCommand && (
                <button
                  onClick={() => copyToClipboard(sshInfo.sshCommand, 'SSH Command')}
                  className="ml-4 text-gray-400 hover:text-gray-200"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
              <code className="flex-1 font-mono text-sm">{sshInfo?.username || 'ubuntu'}</code>
              <button
                onClick={() => copyToClipboard(sshInfo?.username || 'ubuntu', 'Username')}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
              <code className="flex-1 font-mono text-sm">{service.dynamic?.publicIp || 'Pending...'}</code>
              {service.dynamic?.publicIp && (
                <button
                  onClick={() => copyToClipboard(service.dynamic.publicIp, 'Host')}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong>
              <ol className="mt-2 ml-5 list-decimal space-y-1">
                <li>Download the private key file and save it securely</li>
                <li>Set proper permissions: <code className="bg-blue-100 px-1 rounded">chmod 400 {service.domainName}-key.pem</code></li>
                <li>Copy and run the SSH command in your terminal</li>
              </ol>
            </p>
          </div>
        </div>
      </div>

      {/* Database Section */}
      {service.dynamic?.database?.enabled && (
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Database Connection</h3>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            {/* Engine */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Database Engine</label>
                <p className="text-sm font-semibold text-gray-900 capitalize">{service.dynamic.database.engine}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instance Class</label>
                <p className="text-sm font-semibold text-gray-900">{service.dynamic.database.instanceClass}</p>
              </div>
            </div>

            {/* Connection String */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connection String</label>
              <div className="flex items-center bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                <code className="flex-1 break-all">
                  {dbInfo?.connectionString || 'Provisioning...'}
                </code>
                {dbInfo?.connectionString && (
                  <button
                    onClick={() => copyToClipboard(dbInfo.connectionString, 'Connection String')}
                    className="ml-4 text-gray-400 hover:text-gray-200"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Credentials */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <code className="flex-1 font-mono text-sm truncate">{dbInfo?.host || 'Pending...'}</code>
                  {dbInfo?.host && (
                    <button
                      onClick={() => copyToClipboard(dbInfo.host, 'Database Host')}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <code className="flex-1 font-mono text-sm">{dbInfo?.port || '3306'}</code>
                  {dbInfo?.port && (
                    <button
                      onClick={() => copyToClipboard(String(dbInfo.port), 'Port')}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Database Name</label>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <code className="flex-1 font-mono text-sm">{dbInfo?.database || service.dynamic.database.name}</code>
                  <button
                    onClick={() => copyToClipboard(dbInfo?.database || service.dynamic.database.name, 'Database Name')}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <code className="flex-1 font-mono text-sm">{dbInfo?.username || 'admin'}</code>
                  <button
                    onClick={() => copyToClipboard(dbInfo?.username || 'admin', 'Username')}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                <code className="flex-1 font-mono text-sm">••••••••••••••••</code>
                {dbInfo?.password && (
                  <button
                    onClick={() => copyToClipboard(dbInfo.password, 'Password')}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Database Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Database Features:</strong>
                <ul className="mt-2 ml-5 list-disc space-y-1">
                  <li>Automated backups enabled</li>
                  <li>Encrypted storage at rest</li>
                  <li>High availability with multi-AZ deployment</li>
                  <li>Automated patches and maintenance</li>
                </ul>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Guide */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <Play className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Deployment Guide</h3>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="prose prose-sm max-w-none">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Start:</h4>
            <ol className="text-sm text-gray-600 space-y-2 ml-5">
              <li>Connect to your server using the SSH command provided above</li>
              <li>Docker is pre-installed and ready to use</li>
              <li>Clone your repository: <code className="bg-gray-100 px-1 rounded">git clone your-repo-url</code></li>
              <li>Deploy using Docker: <code className="bg-gray-100 px-1 rounded">docker-compose up -d</code></li>
              <li>Configure DNS to point to: <strong>{service.dynamic?.publicIp}</strong></li>
            </ol>
            
            <h4 className="text-sm font-semibold text-gray-900 mt-6 mb-2">Available Runtimes:</h4>
            <p className="text-sm text-gray-600">
              Your server is configured with <strong className="capitalize">{service.dynamic?.runtime}</strong> runtime environment.
              Additional runtimes can be installed via apt or Docker.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white shadow rounded-lg border-2 border-red-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Terminate Hosting Service</h4>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently delete your server, database, and all associated data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleTerminate}
              disabled={service.status === 'terminated'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Terminate Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicHostingDetails;
