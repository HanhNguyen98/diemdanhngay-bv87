import { apiRequest } from './http';

export const publicApi = {
  getBranding: () => apiRequest('/public/branding'),
};
