import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

const INITIAL = [
  { id: 1, type: 'report', title: 'Report Approved', message: 'Your Q1 Outreach report has been approved by the manager.', time: '2 min ago', read: false, icon: 'check' },
  { id: 2, type: 'deadline', title: 'Deadline Reminder', message: 'Monthly activity report due in 3 days (May 9, 2025).', time: '1 hour ago', read: false, icon: 'clock' },
  { id: 3, type: 'support', title: 'Support Request Updated', message: 'Your training materials request has been approved.', time: '3 hours ago', read: false, icon: 'package' },
  { id: 4, type: 'prayer', title: 'Prayer Request Response', message: 'The prayer team has responded to your request.', time: '1 day ago', read: true, icon: 'heart' },
  { id: 5, type: 'system', title: 'System Announcement', message: 'Scheduled maintenance on May 10, 2025 from 2–4 AM.', time: '2 days ago', read: true, icon: 'bell' },
  { id: 6, type: 'report', title: 'Report Returned', message: 'Eastern Region Bible Study report needs revision.', time: '2 days ago', read: true, icon: 'alert' },
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = useCallback((id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications(ns => [{ ...notif, id: Date.now(), read: false, time: 'Just now' }, ...ns]);
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(ns => ns.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, addNotification, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
