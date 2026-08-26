import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginPage from './pages/auth/LoginPage';
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout';
import DashboardPage from './pages/superadmin/DashboardPage';
import UsersListPage from './pages/superadmin/users/UsersListPage';
import DealersListPage from './pages/superadmin/dealers/DealersListPage';
import DealerDetailPage from './pages/superadmin/dealers/DealerDetailPage';
import PropertiesListPage from './pages/superadmin/properties/PropertiesListPage';
import PropertyDetailPage from './pages/superadmin/properties/PropertyDetailPage';
import BookingsListPage from './pages/superadmin/bookings/BookingsListPage';
import BookingDetailPage from './pages/superadmin/bookings/BookingDetailPage';
import PaymentsListPage from './pages/superadmin/payments/PaymentsListPage';
import RevenuePage from './pages/superadmin/revenue/RevenuePage';
import ComplaintsListPage from './pages/superadmin/complaints/ComplaintsListPage';
import ComplaintDetailPage from './pages/superadmin/complaints/ComplaintDetailPage';
import ReviewsListPage from './pages/superadmin/reviews/ReviewsListPage';
import EnquiriesListPage from './pages/superadmin/enquiries/EnquiriesListPage';
import OffersListPage from './pages/superadmin/offers/OffersListPage';
import SettingsPage from './pages/superadmin/settings/SettingsPage';
import AuditLogsPage from './pages/superadmin/audit/AuditLogsPage';
import NotificationsPage from './pages/superadmin/notifications/NotificationsPage';
import AnalyticsPage from './pages/superadmin/analytics/AnalyticsPage';

import OwnerLayout from './pages/owner/OwnerLayout';
import OwnerDashboardPage from './pages/owner/dashboard/OwnerDashboardPage';
import OwnerPropertiesPage from './pages/owner/properties/OwnerPropertiesPage';
import AddPropertyPage from './pages/owner/properties/AddPropertyPage';
import OwnerPropertyDetailPage from './pages/owner/properties/OwnerPropertyDetailPage';
import OwnerBookingsPage from './pages/owner/bookings/OwnerBookingsPage';
import OwnerBookingDetailPage from './pages/owner/bookings/OwnerBookingDetailPage';
import OwnerEnquiriesPage from './pages/owner/enquiries/OwnerEnquiriesPage';
import OwnerFinancePage from './pages/owner/finance/OwnerFinancePage';
import OwnerReviewsPage from './pages/owner/reviews/OwnerReviewsPage';
import OwnerNotificationsPage from './pages/owner/notifications/OwnerNotificationsPage';
import OwnerDocumentsPage from './pages/owner/documents/OwnerDocumentsPage';
import OwnerSettingsPage from './pages/owner/settings/OwnerSettingsPage';
import OwnerProfilePage from './pages/owner/profile/OwnerProfilePage';
import OwnerInventoryPage from './pages/owner/inventory/OwnerInventoryPage';
import OwnerAnalyticsPage from './pages/owner/analytics/OwnerAnalyticsPage';
import OwnerOffersPage from './pages/owner/offers/OwnerOffersPage';
import OwnerSupportPage from './pages/owner/support/OwnerSupportPage';

import BuyerLayout from './pages/buyer/BuyerLayout';
import BuyerDashboardPage from './pages/buyer/dashboard/BuyerDashboardPage';
import BuyerExplorePage from './pages/buyer/explore/BuyerExplorePage';
import BuyerPropertyDetailPage from './pages/buyer/explore/BuyerPropertyDetailPage';
import BuyerBookingsPage from './pages/buyer/bookings/BuyerBookingsPage';
import BuyerBookingDetailPage from './pages/buyer/bookings/BuyerBookingDetailPage';
import BuyerWishlistPage from './pages/buyer/wishlist/BuyerWishlistPage';
import BuyerComparePage from './pages/buyer/compare/BuyerComparePage';
import BuyerEnquiriesPage from './pages/buyer/enquiries/BuyerEnquiriesPage';
import BuyerMessagesPage from './pages/buyer/messages/BuyerMessagesPage';
import BuyerReviewsPage from './pages/buyer/reviews/BuyerReviewsPage';
import BuyerPaymentsPage from './pages/buyer/payments/BuyerPaymentsPage';
import BuyerNotificationsPage from './pages/buyer/notifications/BuyerNotificationsPage';
import BuyerLocationsPage from './pages/buyer/locations/BuyerLocationsPage';
import BuyerProfilePage from './pages/buyer/profile/BuyerProfilePage';
import BuyerSettingsPage from './pages/buyer/settings/BuyerSettingsPage';
import BuyerSavedSearchesPage from './pages/buyer/search/BuyerSavedSearchesPage';
import BuyerBecomeOwnerPage from './pages/buyer/profile/BuyerBecomeOwnerPage';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your role: <span className="font-mono font-bold">{user.role}</span><br/>
            Required: <span className="font-mono font-bold">{allowedRoles?.join(' or ')}</span>
          </p>
          <button
            onClick={() => {
              if (user.role === 'SUPER_ADMIN') window.location.href = '/admin';
              else if (user.role === 'DEALER') window.location.href = '/owner';
              else if (user.role === 'CUSTOMER') window.location.href = '/buyer';
              else window.location.href = '/login';
            }}
            className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ThemeApplier() {
  const { theme } = useThemeStore();
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <ThemeApplier />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Super Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersListPage />} />
            <Route path="dealers" element={<DealersListPage />} />
            <Route path="dealers/:id" element={<DealerDetailPage />} />
            <Route path="properties" element={<PropertiesListPage />} />
            <Route path="properties/:id" element={<PropertyDetailPage />} />
            <Route path="bookings" element={<BookingsListPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
            <Route path="payments" element={<PaymentsListPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="complaints" element={<ComplaintsListPage />} />
            <Route path="complaints/:id" element={<ComplaintDetailPage />} />
            <Route path="reviews" element={<ReviewsListPage />} />
            <Route path="enquiries" element={<EnquiriesListPage />} />
            <Route path="offers" element={<OffersListPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* Owner Routes */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['DEALER']}>
                <OwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OwnerDashboardPage />} />
            <Route path="properties" element={<OwnerPropertiesPage />} />
            <Route path="properties/add" element={<AddPropertyPage />} />
            <Route path="properties/:id" element={<OwnerPropertyDetailPage />} />
            <Route path="bookings" element={<OwnerBookingsPage />} />
            <Route path="bookings/:id" element={<OwnerBookingDetailPage />} />
            <Route path="enquiries" element={<OwnerEnquiriesPage />} />
            <Route path="finance" element={<OwnerFinancePage />} />
            <Route path="reviews" element={<OwnerReviewsPage />} />
            <Route path="documents" element={<OwnerDocumentsPage />} />
            <Route path="notifications" element={<OwnerNotificationsPage />} />
            <Route path="settings" element={<OwnerSettingsPage />} />
            <Route path="profile" element={<OwnerProfilePage />} />
            <Route path="inventory" element={<OwnerInventoryPage />} />
            <Route path="analytics" element={<OwnerAnalyticsPage />} />
            <Route path="offers" element={<OwnerOffersPage />} />
            <Route path="support" element={<OwnerSupportPage />} />
          </Route>

          {/* Buyer Routes */}
          <Route
            path="/buyer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <BuyerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<BuyerDashboardPage />} />
            <Route path="explore" element={<BuyerExplorePage />} />
            <Route path="property/:id" element={<BuyerPropertyDetailPage />} />
            <Route path="bookings" element={<BuyerBookingsPage />} />
            <Route path="bookings/:id" element={<BuyerBookingDetailPage />} />
            <Route path="wishlist" element={<BuyerWishlistPage />} />
            <Route path="compare" element={<BuyerComparePage />} />
            <Route path="enquiries" element={<BuyerEnquiriesPage />} />
            <Route path="messages" element={<BuyerMessagesPage />} />
            <Route path="messages/:id" element={<BuyerMessagesPage />} />
            <Route path="reviews" element={<BuyerReviewsPage />} />
            <Route path="payments" element={<BuyerPaymentsPage />} />
            <Route path="notifications" element={<BuyerNotificationsPage />} />
            <Route path="saved-searches" element={<BuyerSavedSearchesPage />} />
            <Route path="locations" element={<BuyerLocationsPage />} />
            <Route path="profile" element={<BuyerProfilePage />} />
            <Route path="settings" element={<BuyerSettingsPage />} />
            <Route path="become-owner" element={<BuyerBecomeOwnerPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ErrorBoundary>
    </ToastProvider>
  );
}
