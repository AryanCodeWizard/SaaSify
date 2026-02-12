import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  FileText,
  RefreshCw,
  Trash2,
  Upload,
  Zap
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  deleteStaticFile,
  generateUploadUrl,
  getStaticHostingDetails,
  invalidateCache,
  listStaticFiles,
  terminateStaticHosting,
  uploadFileToS3
} from '../../services/hostingService';
import { useCallback, useEffect, useRef, useState } from 'react';

import toast from 'react-hot-toast';

const StaticHostingDetails = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [invalidating, setInvalidating] = useState(false);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchServiceDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getStaticHostingDetails(id);
      setService(response.data);
    } catch (error) {
      console.error('Error fetching service details:', error);
      toast.error(error.response?.data?.message || 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await listStaticFiles(id);
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchServiceDetails();
    fetchFiles();
  }, [fetchServiceDetails, fetchFiles]);

  const handleFileUpload = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(selectedFiles).map(async (file) => {
      try {
        // Get pre-signed URL
        const urlResponse = await generateUploadUrl(id, file.name, file.type);
        const { uploadUrl } = urlResponse.data;

        // Upload directly to S3
        await uploadFileToS3(uploadUrl, file, file.type);
        
        toast.success(`${file.name} uploaded successfully`);
        return { success: true, fileName: file.name };
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}`);
        return { success: false, fileName: file.name };
      }
    });

    await Promise.all(uploadPromises);
    setUploading(false);
    fetchFiles();
  };

  const handleFileSelect = (e) => {
    handleFileUpload(e.target.files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

    try {
      await deleteStaticFile(id, fileName);
      toast.success(`${fileName} deleted successfully`);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(error.response?.data?.message || 'Failed to delete file');
    }
  };

  const handleInvalidateCache = async () => {
    try {
      setInvalidating(true);
      await invalidateCache(id, ['/*']);
      toast.success('Cache invalidation started. It may take a few minutes.');
    } catch (error) {
      console.error('Error invalidating cache:', error);
      toast.error(error.response?.data?.message || 'Failed to invalidate cache');
    } finally {
      setInvalidating(false);
    }
  };

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate this hosting service? This action cannot be undone.')) return;

    try {
      await terminateStaticHosting(id);
      toast.success('Hosting service termination initiated');
      window.location.href = '/dashboard/hosting';
    } catch (error) {
      console.error('Error terminating service:', error);
      toast.error(error.response?.data?.message || 'Failed to terminate service');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
            <p className="mt-2 text-sm text-gray-600">Static Hosting Service</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchServiceDetails}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Service Info Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Status Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            {service.status === 'active' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 capitalize">{service.status}</p>
        </div>

        {/* S3 Bucket Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">S3 Bucket</h3>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">{service.static?.bucketName}</p>
            <button
              onClick={() => copyToClipboard(service.static?.bucketName)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CloudFront URL Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">CloudFront URL</h3>
          <div className="mt-2 flex items-center justify-between">
            <a
              href={service.static?.cloudfrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 truncate"
            >
              {service.static?.cloudfrontUrl?.replace('https://', '')}
            </a>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-2" />
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            <p className="mt-1 text-sm text-gray-500">Manage your hosting service</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleInvalidateCache}
              disabled={invalidating || service.status !== 'active'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 mr-2" />
              {invalidating ? 'Invalidating...' : 'Invalidate Cache'}
            </button>
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

      {/* File Manager */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">File Manager</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || service.status !== 'active'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg m-6 p-12 text-center ${
            dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
          }`}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop files here, or click Upload Files button
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Supported formats: HTML, CSS, JS, images, and more
          </p>
        </div>

        {/* Files List */}
        <div className="px-6 pb-6">
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.key}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} · Modified {new Date(file.lastModified).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`${service.static?.cloudfrontUrl}/${file.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.key)}
                      className="text-red-600 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaticHostingDetails;
