import api from '../config/api';

export const dashboardService = {
  async getDashboardAnalytics() {
    const { data } = await api.get('/clients/me/dashboard');
    return data;
  },
};
