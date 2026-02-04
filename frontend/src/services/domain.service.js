import api from '../config/api';

/**
 * Domain Service
 * Handles all domain-related API calls
 */
const domainService = {
  /**
   * Search for domains
   * @param {string} query - Domain name or keyword to search
   * @param {object} options - Search options (tlds, maxResults, checkAvailability)
   */
  searchDomains: async (query, options = {}) => {
    const params = {
      query,
      tlds: options.tlds?.join(','),
      maxResults: options.maxResults || 20,
      checkAvailability: options.checkAvailability ? 'true' : 'false',
    };
    
    const response = await api.get('/domains/search', { params });
    return response.data;
  },

  /**
   * Check if a single domain is available
   * @param {string} domain - Full domain name (e.g., 'example.com')
   */
  checkAvailability: async (domain) => {
    const response = await api.get(`/domains/availability/${domain}`);
    return response.data;
  },

  /**
   * Get domain suggestions based on keyword
   * @param {string} keyword - Keyword to generate suggestions
   * @param {object} options - Options (tlds, maxResults)
   */
  getSuggestions: async (keyword, options = {}) => {
    const params = {
      query: keyword,
      tlds: options.tlds?.join(','),
      maxResults: options.maxResults || 20,
    };
    
    const response = await api.get('/domains/suggestions', { params });
    return response.data;
  },

  /**
   * Get pricing for a specific TLD
   * @param {string} tld - Top-level domain (e.g., 'com', 'net')
   */
  getPricing: async (tld) => {
    const response = await api.get(`/domains/pricing/${tld}`);
    return response.data;
  },

  /**
   * Get list of supported TLDs
   */
  getSupportedTLDs: async () => {
    const response = await api.get('/domains/tlds');
    return response.data;
  },

  /**
   * Get user's domains
   */
  getMyDomains: async () => {
    const response = await api.get('/domains/my-domains');
    return response.data;
  },

  /**
   * Get domain details by ID
   * @param {string} id - Domain ID
   */
  getDomainById: async (id) => {
    const response = await api.get(`/domains/${id}`);
    return response.data;
  },

  /**
   * Update domain nameservers
   * @param {string} id - Domain ID
   * @param {array} nameServers - Array of nameserver URLs
   */
  updateNameServers: async (id, nameServers) => {
    const response = await api.put(`/domains/${id}/nameservers`, { nameServers });
    return response.data;
  },

  /**
   * Update domain contacts
   * @param {string} id - Domain ID
   * @param {object} contacts - Contact information
   */
  updateContacts: async (id, contacts) => {
    const response = await api.put(`/domains/${id}/contacts`, { contacts });
    return response.data;
  },

  /**
   * Toggle domain lock
   * @param {string} id - Domain ID
   * @param {boolean} locked - Lock status
   */
  toggleLock: async (id, locked) => {
    const response = await api.put(`/domains/${id}/lock`, { locked });
    return response.data;
  },

  /**
   * Update domain privacy
   * @param {string} id - Domain ID
   * @param {boolean} privacy - Privacy status
   */
  updatePrivacy: async (id, privacy) => {
    const response = await api.put(`/domains/${id}/privacy`, { privacy });
    return response.data;
  },

  /**
   * Get DNS records for a domain
   * @param {string} domain - Domain name
   */
  getDNSRecords: async (domain) => {
    const response = await api.get(`/domains/dns/${domain}`);
    return response.data;
  },

  /**
   * Update DNS records
   * @param {string} domain - Domain name
   * @param {array} records - DNS records
   */
  updateDNSRecords: async (domain, records) => {
    const response = await api.put(`/domains/dns/${domain}`, { records });
    return response.data;
  },
};

export default domainService;
