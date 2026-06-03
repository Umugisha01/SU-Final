import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every outgoing request (except public auth endpoints)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('su-access-token');
    const publicAuthEndpoints = [
      'auth/login',
      'auth/register',
      'auth/refresh',
      'auth/forgot-password',
      'auth/reset-password'
    ];
    const isPublicAuth = publicAuthEndpoints.some(endpoint => config.url && config.url.includes(endpoint));

    if (token && !isPublicAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatic JWT Token Refresh on 401 Unauthorized response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Only attempt refresh if we have a stored token AND this isn't already a retry
    const hasStoredToken = !!localStorage.getItem('su-access-token');
    const isAuthRequest = originalRequest.url && originalRequest.url.includes('auth/');
    if (error.response?.status === 401 && !originalRequest._retry && hasStoredToken && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        // Backend refresh endpoint is /api/auth/refresh (not SimpleJWT default)
        const res = await api.post('/auth/refresh');
        const newAccessToken = res.data.accessToken;
        if (newAccessToken) {
          localStorage.setItem('su-access-token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token is expired or invalid — clear state and redirect to login
        localStorage.removeItem('su-access-token');
        localStorage.removeItem('su-user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// =============================================
// DATA MAPPERS (Bridges Backend & Frontend Schemas)
// =============================================

export const mapReportToFrontend = (r) => {
  if (!r) return null;
  return {
    ...r,
    submittedBy: r.submitted_by ? r.submitted_by.name : 'Unknown',
    attachments: r.attachments ? r.attachments.length : 0,
    totalParticipants: r.participants || 0,
    prayerRequests: r.prayer_requests || '',
    male: r.demographics?.male || 0,
    female: r.demographics?.female || 0,
    youth: r.demographics?.youth || 0,
    adults: r.demographics?.adults || 0,
  };
};

export const mapSupportToFrontend = (s) => {
  if (!s) return null;
  const typeMap = {
    'Equipment': 'Material',
    'Spiritual': 'Prayer',
    'Technical': 'Personnel',
    'Financial': 'Financial',
    'Training': 'Training'
  };
  const priorityMap = {
    'critical': 'urgent',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    type: typeMap[s.category] || s.category || 'Other',
    priority: priorityMap[s.urgency] || s.urgency || 'medium',
    status: s.status || 'submitted',
    requester: s.requester ? s.requester.name : 'Unknown',
    assignedTo: s.assigned_to ? s.assigned_to.name : null,
    deadline: s.deadline || '',
    region: s.region || '',
    submittedDate: s.created_at ? s.created_at.split('T')[0] : '',
    comments: (s.comments || []).map(c => ({
      author: c.user ? c.user.name : 'Unknown',
      text: c.comment,
      time: c.created_at ? c.created_at.split('T')[0] : ''
    }))
  };
};

export const mapPrayerToFrontend = (p) => {
  if (!p) return null;
  const isAnonymous = p.visibility === 'anonymous';
  return {
    id: p.id,
    title: p.title,
    description: p.request,
    submittedBy: isAnonymous ? 'Anonymous' : (p.requester ? p.requester.name : 'Unknown'),
    region: p.region || 'All Regions',
    type: p.visibility === 'anonymous' ? 'Protection' : 'General',
    priority: 'medium',
    status: p.status === 'active' ? 'pending' : (p.status === 'archived' ? 'prayed' : p.status),
    anonymous: isAnonymous,
    date: p.created_at ? p.created_at.split('T')[0] : '',
    responses: p.commitments_count || 0,
    themes: [p.visibility === 'anonymous' ? 'Outreach' : 'General']
  };
};

// =============================================
// API SERVICES
// =============================================

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  verifyMfa: async (code) => {
    const res = await api.post('/auth/mfa/verify', { code });
    return res.data;
  },
  enableMfa: async () => {
    const res = await api.post('/auth/mfa/enable');
    return res.data;
  },
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
};

export const userService = {
  list: async () => {
    const res = await api.get('/users/');
    const data = res.data.success ? res.data.data : res.data;
    return data;
  },
  getDirectory: async () => {
    const res = await api.get('/users/directory');
    const data = res.data.success ? res.data.data : res.data;
    return data;
  },
};

export const reportService = {
  list: async (filters = {}) => {
    const res = await api.get('/reports/', { params: filters });
    const reportsList = res.data.success ? res.data.data : res.data;
    return (Array.isArray(reportsList) ? reportsList : []).map(mapReportToFrontend);
  },
  get: async (id) => {
    const res = await api.get(`/reports/${id}`);
    return mapReportToFrontend(res.data);
  },
  create: async (data) => {
    const backendData = {
      title: data.title,
      type: data.type,
      region: data.region,
      department: data.department,
      date: data.date,
      duration: data.duration,
      location: data.location,
      description: data.description,
      outcomes: data.outcomes,
      challenges: data.challenges,
      prayer_requests: data.prayerRequests,
      participants: Number(data.totalParticipants) || 0,
      demographics: {
        male: Number(data.male) || 0,
        female: Number(data.female) || 0,
        youth: Number(data.youth) || 0,
        adults: Number(data.adults) || 0
      },
      status: data.status,
      recipientIds: data.recipientIds || [],
    };
    const res = await api.post('/reports/', backendData);
    return mapReportToFrontend(res.data);
  },
  update: async (id, data) => {
    const backendData = {
      title: data.title,
      type: data.type,
      region: data.region,
      department: data.department,
      date: data.date,
      duration: data.duration,
      location: data.location,
      description: data.description,
      outcomes: data.outcomes,
      challenges: data.challenges,
      prayer_requests: data.prayerRequests,
      participants: Number(data.totalParticipants) || 0,
      demographics: {
        male: Number(data.male) || 0,
        female: Number(data.female) || 0,
        youth: Number(data.youth) || 0,
        adults: Number(data.adults) || 0
      },
      status: data.status,
      recipientIds: data.recipientIds || [],
    };
    const res = await api.patch(`/reports/${id}`, backendData);
    return mapReportToFrontend(res.data);
  },
  analyze: async (id) => {
    const res = await api.post('/reports/ai-analyze', { reportId: id });
    return res.data;
  },
  updateStatus: async (id, status, comments = '') => {
    const res = await api.patch(`/reports/${id}/status`, { status, comments });
    return res.data;
  },
  aiOverride: async (id, aiCategory) => {
    const res = await api.patch(`/reports/${id}/ai-override`, { aiCategory });
    return res.data;
  },
};

export const supportService = {
  list: async () => {
    const res = await api.get('/support/');
    const dataList = res.data.success ? res.data.data : res.data;
    return (Array.isArray(dataList) ? dataList : []).map(mapSupportToFrontend);
  },
  get: async (id) => {
    const res = await api.get(`/support/${id}`);
    return mapSupportToFrontend(res.data);
  },
  create: async (data) => {
    const frontendToBackend = {
      title: data.title,
      description: data.description,
      category: data.type === 'Material' ? 'Equipment' : (data.type === 'Prayer' ? 'Spiritual' : (data.type === 'Personnel' ? 'Technical' : data.type)),
      urgency: data.priority === 'urgent' ? 'critical' : data.priority,
    };
    const res = await api.post('/support/', frontendToBackend);
    return mapSupportToFrontend(res.data);
  },
  addComment: async (id, text) => {
    const res = await api.post(`/support/${id}/comments`, { comment: text });
    return res.data;
  },
  assign: async (id, userId) => {
    const res = await api.patch(`/support/${id}/assign`, { userId });
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch(`/support/${id}/status`, { status });
    return res.data;
  },
};

export const prayerService = {
  list: async (filters = {}) => {
    const res = await api.get('/prayer/', { params: filters });
    const data = res.data.success ? res.data.data : res.data;
    return (Array.isArray(data) ? data : []).map(mapPrayerToFrontend);
  },
  create: async (data) => {
    const frontendToBackend = {
      title: data.title,
      request: data.description,
      visibility: data.anonymous ? 'anonymous' : 'public',
    };
    const res = await api.post('/prayer/', frontendToBackend);
    return mapPrayerToFrontend(res.data);
  },
  commit: async (id) => {
    const res = await api.post(`/prayer/${id}/commit`);
    return res.data;
  },
  uncommit: async (id) => {
    const res = await api.post(`/prayer/${id}/uncommit`);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch(`/prayer/${id}/status`, { status });
    return res.data;
  },
};

export const documentService = {
  list: async () => {
    const res = await api.get('/documents/');
    return res.data;
  },
  upload: async (formData) => {
    const res = await api.post('/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export const notificationService = {
  list: async () => {
    const res = await api.get('/notifications/');
    return res.data;
  },
  markRead: async (id) => {
    const res = await api.post(`/notifications/${id}/read/`);
    return res.data;
  },
};

export const auditService = {
  list: async () => {
    const res = await api.get('/audit/');
    return res.data;
  },
};

export default api;
