import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/');
      if (res.data && res.data.success) {
        setNotifications(res.data.data);
      } else if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  const fetchSystemAlerts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/system-alerts/active');
      if (res.data && res.data.success) {
        setSystemAlerts(res.data.data);
      } else if (Array.isArray(res.data)) {
        setSystemAlerts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch system alerts:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchNotifications(), fetchSystemAlerts()]).finally(() => setLoading(false));
    } else {
      setNotifications([]);
      setSystemAlerts([]);
    }
  }, [user, fetchNotifications, fetchSystemAlerts]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = useCallback(async (id) => {
    try {
      // Optimistic UI update
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      setNotifications(ns => ns.map(n => ({ ...n, read: true })));
      await api.post('/notifications/mark-read', { ids: [] });
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  }, []);

  const dismiss = useCallback(async (id) => {
    try {
      setNotifications(ns => ns.filter(n => n.id !== id));
      await api.delete(`/notifications/${id}/`);
      toast.success('Notification dismissed');
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  const dismissSystemAlert = useCallback(async (id) => {
    try {
      setSystemAlerts(alerts => alerts.filter(a => a.id !== id));
      await api.post(`/notifications/system-alerts/${id}/dismiss`);
      toast.success('System alert dismissed');
    } catch (err) {
      console.error('Failed to dismiss system alert:', err);
    }
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications(ns => [{ ...notif, id: Date.now(), read: false, created_at: new Date().toISOString() }, ...ns]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      systemAlerts,
      unreadCount,
      loading,
      fetchNotifications,
      fetchSystemAlerts,
      markRead,
      markAllRead,
      addNotification,
      dismiss,
      dismissSystemAlert
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
