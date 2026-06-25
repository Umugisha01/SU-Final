import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FieldOfficerDashboard from './FieldOfficerDashboard';
import CoordinatorDashboard from './CoordinatorDashboard';
import ManagerDashboard from './ManagerDashboard';
import AdminDashboard from './AdminDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();
  const role = user?.role;

  switch (role) {
    case 'administrator':
      return <AdminDashboard />;
    case 'national_manager':
      return <ManagerDashboard />;
    case 'regional_coordinator':
      return <CoordinatorDashboard />;
    case 'field_officer':
    default:
      return <FieldOfficerDashboard />;
  }
}
