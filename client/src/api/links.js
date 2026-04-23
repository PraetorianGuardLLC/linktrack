import api from './client';

export const linksApi = {
  create: (data) => api.post('/links', data).then((r) => r.data),
  list: () => api.get('/links').then((r) => r.data),
  get: (code) => api.get(`/links/${code}`).then((r) => r.data),
  update: (code, data) => api.patch(`/links/${code}`, data).then((r) => r.data),
  delete: (code) => api.delete(`/links/${code}`).then((r) => r.data),
};

export const analyticsApi = {
  get: (code, params = {}) => api.get(`/analytics/${code}`, { params }).then((r) => r.data),
};

export const pixelsApi = {
  create: (data) => api.post('/pixels', data).then((r) => r.data),
  list: () => api.get('/pixels').then((r) => r.data),
  getClicks: (code) => api.get(`/pixels/${code}/clicks`).then((r) => r.data),
};
