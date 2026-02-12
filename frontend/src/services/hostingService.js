import api from '../config/api';

// ==================== STATIC HOSTING ====================

/**
 * Create static hosting service
 */
export const createStaticHosting = async (data) => {
  const response = await api.post('/hosting/static/create', data);
  return response.data;
};

/**
 * Get all static hosting services
 */
export const getStaticHostingServices = async (params = {}) => {
  const response = await api.get('/hosting/static', { params });
  return response.data;
};

/**
 * Get static hosting service details
 */
export const getStaticHostingDetails = async (id) => {
  const response = await api.get(`/hosting/static/${id}`);
  return response.data;
};

/**
 * Generate pre-signed upload URL for file
 */
export const generateUploadUrl = async (id, fileName, contentType) => {
  const response = await api.post(`/hosting/static/${id}/upload-url`, {
    fileName,
    contentType,
  });
  return response.data;
};

/**
 * Upload file directly to S3 using pre-signed URL
 */
export const uploadFileToS3 = async (presignedUrl, file, contentType) => {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload file to S3');
  }
  
  return response;
};

/**
 * List files in static hosting
 */
export const listStaticFiles = async (id) => {
  const response = await api.get(`/hosting/static/${id}/files`);
  return response.data;
};

/**
 * Delete file from static hosting
 */
export const deleteStaticFile = async (id, fileName) => {
  const response = await api.delete(`/hosting/static/${id}/files`, {
    data: { fileName },
  });
  return response.data;
};

/**
 * Invalidate CloudFront cache
 */
export const invalidateCache = async (id, paths = ['/*']) => {
  const response = await api.post(`/hosting/static/${id}/invalidate`, { paths });
  return response.data;
};

/**
 * Terminate static hosting
 */
export const terminateStaticHosting = async (id) => {
  const response = await api.delete(`/hosting/static/${id}`);
  return response.data;
};

// ==================== DYNAMIC HOSTING ====================

/**
 * Create dynamic hosting service
 */
export const createDynamicHosting = async (data) => {
  const response = await api.post('/hosting/dynamic/create', data);
  return response.data;
};

/**
 * Get all dynamic hosting services
 */
export const getDynamicHostingServices = async (params = {}) => {
  const response = await api.get('/hosting/dynamic', { params });
  return response.data;
};

/**
 * Get dynamic hosting service details
 */
export const getDynamicHostingDetails = async (id) => {
  const response = await api.get(`/hosting/dynamic/${id}`);
  return response.data;
};

/**
 * Get SSH connection information
 */
export const getSshInfo = async (id) => {
  const response = await api.get(`/hosting/dynamic/${id}/ssh`);
  return response.data;
};

/**
 * Get database connection information
 */
export const getDatabaseInfo = async (id) => {
  const response = await api.get(`/hosting/dynamic/${id}/database`);
  return response.data;
};

/**
 * Get instance status
 */
export const getInstanceStatus = async (id) => {
  const response = await api.get(`/hosting/dynamic/${id}/status`);
  return response.data;
};

/**
 * Terminate dynamic hosting
 */
export const terminateDynamicHosting = async (id) => {
  const response = await api.delete(`/hosting/dynamic/${id}`);
  return response.data;
};

// ==================== DNS MANAGEMENT ====================

/**
 * Create hosted zone
 */
export const createHostedZone = async (domainName) => {
  const response = await api.post('/hosting/dns/hosted-zones', { domainName });
  return response.data;
};

/**
 * Get DNS records for domain
 */
export const getDnsRecords = async (hostedZoneId) => {
  const response = await api.get(`/hosting/dns/hosted-zones/${hostedZoneId}/records`);
  return response.data;
};

/**
 * Create/update DNS record
 */
export const upsertDnsRecord = async (hostedZoneId, recordData) => {
  const response = await api.post(
    `/hosting/dns/hosted-zones/${hostedZoneId}/records`,
    recordData
  );
  return response.data;
};

/**
 * Delete DNS record
 */
export const deleteDnsRecord = async (hostedZoneId, recordData) => {
  const response = await api.delete(
    `/hosting/dns/hosted-zones/${hostedZoneId}/records`,
    { data: recordData }
  );
  return response.data;
};

/**
 * Check DNS propagation
 */
export const checkDnsPropagation = async (domainName, recordType = 'A') => {
  const response = await api.get('/hosting/dns/check-propagation', {
    params: { domainName, recordType },
  });
  return response.data;
};

// ==================== COMBINED ====================

/**
 * Get all hosting services (static + dynamic)
 */
export const getAllHostingServices = async () => {
  const [staticRes, dynamicRes] = await Promise.all([
    getStaticHostingServices(),
    getDynamicHostingServices(),
  ]);
  
  const staticServices = staticRes.data?.hostingServices || [];
  const dynamicServices = dynamicRes.data?.hostingServices || [];
  
  return {
    success: true,
    data: {
      static: staticServices,
      dynamic: dynamicServices,
      all: [...staticServices, ...dynamicServices].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    },
  };
};
