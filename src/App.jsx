import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ThemeProvider from './themes/ThemeProvider';

import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

import AdminLogin from './admin/auth/Login';
import VerifyOtp from './admin/auth/VerifyOtp';
import ForgotPassword from './admin/auth/ForgotPassword';
import ResetPassword from './admin/auth/ResetPassword';
import UserLogin from './user/auth/Login';

import AdminDashboard from './admin/dashboard';
import MembersManagement from './admin/members';
import AddMember from './admin/members/AddMember';
import EditMember from './admin/members/EditMember';
import ViewMember from './admin/members/ViewMember';
import IdCardGenerator from './admin/members/IdCardGenerator';
import Settings from './admin/settings';
import ShiftsList from './admin/shifts';
import ShiftForm from './admin/shifts/ShiftForm';
import SeatsPage from './admin/seats';
import SeatForm from './admin/seats/SeatForm';
import ViewSeat from './admin/seats/ViewSeat';
import AttendancePage from './admin/attendance';
import PaymentsPage from './admin/fees';
import ExpensesPage from './admin/expenses';
import ReportsPage from './admin/reports';
import NotificationsPage from './admin/notifications';
import AnnouncementsPage from './admin/announcements';
import LogsPage from './admin/logs';
import BackupPage from './admin/backup';
import ImportExportPage from './admin/importexport';
import RolesPage from './admin/roles';
import SettingsPage from './admin/settings';
import AdminProfilePage from './admin/profile';

import UserDashboard from './user/dashboard';
import UserAttendancePage from './user/attendance';
import UserFeesPage from './user/fees';
import UserReportsPage from './user/reports';
import UserProfilePage from './user/profile';
import UserNotificationsPage from './user/notifications';

import useAuthStore from './store/authStore';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/verify-otp" element={<VerifyOtp />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Branch Admin', 'Staff']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="members" element={<MembersManagement />} />
            <Route path="members/add" element={<AddMember />} />
            <Route path="members/edit/:id" element={<EditMember />} />
            <Route path="members/view/:id" element={<ViewMember />} />
            <Route path="members/card/:id" element={<IdCardGenerator />} />
            <Route path="shifts" element={<ShiftsList />} />
            <Route path="shifts/add" element={<ShiftForm />} />
            <Route path="shifts/edit/:id" element={<ShiftForm />} />
            <Route path="seats" element={<SeatsPage />} />
            <Route path="seats/add" element={<SeatForm />} />
            <Route path="seats/edit/:id" element={<SeatForm />} />
            <Route path="seats/view/:id" element={<ViewSeat />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="backup" element={<BackupPage />} />
            <Route path="import-export" element={<ImportExportPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <UserLayout />
            </ProtectedRoute>
          }>
            <Route index element={<UserDashboard />} />
            <Route path="attendance" element={<UserAttendancePage />} />
            <Route path="fees" element={<UserFeesPage />} />
            <Route path="reports" element={<UserReportsPage />} />
            <Route path="notifications" element={<UserNotificationsPage />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>

          <Route path="/unauthorized" element={<div className="flex h-screen items-center justify-center text-2xl font-bold text-red-500">403 - Unauthorized</div>} />
          <Route path="*" element={<div className="flex h-screen items-center justify-center text-2xl font-bold">404 - Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
