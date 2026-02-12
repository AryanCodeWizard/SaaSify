import {
  getAllHostingServices,
  getDynamicHostingDetails,
  getInstanceStatus,
  getStaticHostingDetails
} from '../services/hostingService';

import { create } from 'zustand';

const useHostingStore = create((set, get) => ({
  // State
  services: { static: [], dynamic: [], all: [] },
  selectedService: null,
  loading: false,
  error: null,
  
  // Actions
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setServices: (services) => set({ services }),
  
  setSelectedService: (service) => set({ selectedService: service }),
  
  // Fetch all hosting services
  fetchServices: async () => {
    try {
      set({ loading: true, error: null });
      const response = await getAllHostingServices();
      set({ services: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch hosting services', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Fetch specific service details
  fetchServiceDetails: async (id, type) => {
    try {
      set({ loading: true, error: null });
      const response = type === 'static' 
        ? await getStaticHostingDetails(id)
        : await getDynamicHostingDetails(id);
      set({ selectedService: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch service details', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Refresh instance status for dynamic hosting
  refreshInstanceStatus: async (id) => {
    try {
      const response = await getInstanceStatus(id);
      const { selectedService } = get();
      
      if (selectedService && selectedService._id === id) {
        set({
          selectedService: {
            ...selectedService,
            dynamic: {
              ...selectedService.dynamic,
              instanceStatus: response.data
            }
          }
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error refreshing instance status:', error);
      throw error;
    }
  },
  
  // Update service in the list
  updateServiceInList: (id, updates) => {
    const { services } = get();
    const updatedAll = services.all.map(service => 
      service._id === id ? { ...service, ...updates } : service
    );
    const updatedStatic = services.static.map(service => 
      service._id === id ? { ...service, ...updates } : service
    );
    const updatedDynamic = services.dynamic.map(service => 
      service._id === id ? { ...service, ...updates } : service
    );
    
    set({
      services: {
        all: updatedAll,
        static: updatedStatic,
        dynamic: updatedDynamic
      }
    });
  },
  
  // Remove service from the list
  removeServiceFromList: (id) => {
    const { services } = get();
    set({
      services: {
        all: services.all.filter(s => s._id !== id),
        static: services.static.filter(s => s._id !== id),
        dynamic: services.dynamic.filter(s => s._id !== id)
      }
    });
  },
  
  // Clear selected service
  clearSelectedService: () => set({ selectedService: null }),
  
  // Reset store
  reset: () => set({
    services: { static: [], dynamic: [], all: [] },
    selectedService: null,
    loading: false,
    error: null
  })
}));

export default useHostingStore;
