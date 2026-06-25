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
    attachments: r.attachments || [],
    attachmentsCount: r.attachments ? r.attachments.length : 0,
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
  
  const activePriority = (s.ai_priority && !s.manual_priority_override)
    ? s.ai_priority
    : (priorityMap[s.urgency] || s.urgency || 'medium');

  return {
    id: s.id,
    title: s.title,
    description: s.description,
    type: typeMap[s.category] || s.category || 'Other',
    priority: activePriority,
    status: s.status || 'submitted',
    requester: s.requester ? s.requester.name : 'Unknown',
    assignedTo: s.assigned_to ? s.assigned_to.name : null,
    deadline: s.deadline || '',
    region: s.region || '',
    submittedDate: s.created_at ? s.created_at.split('T')[0] : '',
    recipients: s.recipients || [],
    comments: (s.comments || []).map(c => ({
      author: c.user ? c.user.name : 'Unknown',
      text: c.comment,
      time: c.created_at ? c.created_at.split('T')[0] : ''
    })),
    aiPriority: s.ai_priority || null,
    aiPriorityConfidence: s.ai_priority_confidence || null,
    aiPriorityReason: s.ai_priority_reason || '',
    aiAnalyzedAt: s.ai_analyzed_at || null,
    manualPriorityOverride: s.manual_priority_override || false
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
  sendMfaEmail: async () => {
    const res = await api.post('/auth/mfa/send-email');
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
  verifyEmail: async (token) => {
    const res = await api.get('/auth/verify-email', { params: { token } });
    return res.data;
  },
  resendVerification: async (email) => {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  },
  heartbeat: async () => {
    const res = await api.post('/auth/heartbeat');
    return res.data;
  },
  getSessions: async () => {
    const res = await api.get('/auth/sessions');
    return res.data;
  },
  revokeSessions: async () => {
    const res = await api.post('/auth/sessions/revoke');
    return res.data;
  },
  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (token, password) => {
    const res = await api.post('/auth/reset-password', { token, password });
    return res.data;
  },
  setupMfa: async () => {
    const res = await api.post('/auth/mfa/setup');
    return res.data;
  },
  toggleMfa: async (mfaEnabled) => {
    const res = await api.put('/users/me/mfa', { mfaEnabled });
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
  getProfile: async () => {
    const res = await api.get('/users/me');
    return res.data;
  },
  updateProfile: async (profileData) => {
    const res = await api.put('/users/me', profileData);
    return res.data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const res = await api.put('/users/me/password', { currentPassword, newPassword });
    return res.data;
  },
  getPending: async () => {
    const res = await api.get('/users/pending');
    return res.data;
  },
  approve: async (id) => {
    const res = await api.post(`/users/${id}/approve`);
    return res.data;
  },
  reject: async (id, reason) => {
    const res = await api.post(`/users/${id}/reject`, { reason });
    return res.data;
  },
  toggleStatus: async (id, status) => {
    const res = await api.patch(`/users/${id}/status`, { status });
    return res.data;
  },
  updateUser: async (id, userData) => {
    const res = await api.put(`/users/${id}`, userData);
    return res.data;
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
      attachmentIds: data.attachmentIds || [],
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
      attachmentIds: data.attachmentIds || [],
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
  chat: async (message, documentIds = [], reportIds = []) => {
    const res = await api.post('/reports/ai-chat', { message, documentIds, reportIds });
    return res.data;
  },
  chatStream: async (message, documentIds = [], reportIds = [], model = null, onChunk, onError) => {
    try {
      const token = localStorage.getItem('su-access-token');
      const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
      const response = await fetch(`${baseURL}/reports/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ message, documentIds, reportIds, stream: true, model })
      });

      if (!response.ok) {
        let errText = 'Failed to generate response';
        try {
          const errData = await response.json();
          errText = errData.error || errText;
        } catch (_) {}
        throw new Error(errText);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.error) {
                onError(new Error(parsed.error));
                return;
              }
              if (parsed.citations) {
                onChunk('', parsed.citations);
              }
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              console.error('Error parsing stream line:', e);
            }
          }
        }
      }
    } catch (err) {
      onError(err);
    }
  },
  aiStatus: async () => {
    const res = await api.get('/reports/ai-status');
    return res.data;
  },
  consolidated: async (filters = {}) => {
    const res = await api.get('/reports/consolidated', { params: filters });
    return res.data;
  },
  analyticsSummary: async (filters = {}) => {
    const res = await api.get('/reports/analytics/summary', { params: filters });
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/reports/${id}`);
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
      recipientIds: data.recipientIds || [],
    };
    const res = await api.post('/support/', frontendToBackend);
    return mapSupportToFrontend(res.data);
  },
  update: async (id, data) => {
    const frontendToBackend = {};
    if (data.title !== undefined) frontendToBackend.title = data.title;
    if (data.description !== undefined) frontendToBackend.description = data.description;
    if (data.type !== undefined) frontendToBackend.category = data.type === 'Material' ? 'Equipment' : (data.type === 'Prayer' ? 'Spiritual' : (data.type === 'Personnel' ? 'Technical' : data.type));
    if (data.priority !== undefined) frontendToBackend.urgency = data.priority === 'urgent' ? 'critical' : data.priority;
    if (data.recipientIds !== undefined) frontendToBackend.recipientIds = data.recipientIds;
    const res = await api.put(`/support/${id}`, frontendToBackend);
    return mapSupportToFrontend(res.data);
  },
  delete: async (id) => {
    const res = await api.delete(`/support/${id}`);
    return res.data;
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
  triggerAIAnalysis: async (requestId) => {
    const res = await api.post(`/support/${requestId}/ai-analyze`);
    return res.data;
  },
  batchAIAnalysis: async (limit = 50) => {
    const res = await api.post('/support/ai-batch', { limit });
    return res.data;
  },
  getAITaskStatus: async (taskId) => {
    const res = await api.get(`/support/ai-status/${taskId}`);
    return res.data;
  },
  suggestPriority: async (title, description, category) => {
    const backendCategory = category === 'Material' ? 'Equipment' : (category === 'Prayer' ? 'Spiritual' : (category === 'Personnel' ? 'Technical' : category));
    const res = await api.post('/support/ai-suggest', { title, description, category: backendCategory });
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
  list: async (filters = {}) => {
    const res = await api.get('/documents/', { params: filters });
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
  update: async (id, data) => {
    const res = await api.patch(`/documents/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
  share: async (id, shared) => {
    const res = await api.patch(`/documents/${id}/share`, { shared });
    return res.data;
  }
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

export const dashboardService = {
  getFieldOfficerData: async (fromDate, toDate) => {
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    const res = await api.get('/dashboard/field-officer/', { params });
    return res.data;
  },
  getCoordinatorData: async () => {
    const res = await api.get('/dashboard/coordinator/');
    return res.data;
  },
  getManagerData: async () => {
    const res = await api.get('/dashboard/manager/');
    return res.data;
  },
  getAdminData: async () => {
    const res = await api.get('/dashboard/admin/');
    return res.data;
  },
  getRecentActivity: async () => {
    const res = await api.get('/dashboard/recent-activity/');
    return res.data;
  },
  getSystemHealth: async () => {
    const res = await api.get('/dashboard/system-health/');
    return res.data;
  },
  getAIInsights: async () => {
    const res = await api.get('/dashboard/ai-insights/');
    return res.data;
  },
};

export default api;
