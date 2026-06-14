import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute, {
  PublicOnlyRoute,
  RoleHomeRedirect,
} from './components/common/ProtectedRoute'
import { ROLE_ACCESS } from './utils/routing'

import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import SetupPage from './pages/auth/SetupPage'
import UnauthorizedPage from './pages/auth/UnauthorizedPage'

import DashboardPage from './pages/admin/DashboardPage'
import ProductsPage from './pages/admin/ProductsPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import PaymentMethodsPage from './pages/admin/PaymentMethodsPage'
import CouponsPage from './pages/admin/CouponsPage'
import PromotionsPage from './pages/admin/PromotionsPage'
import FloorsPage from './pages/admin/FloorsPage'
import BookingsPage from './pages/admin/BookingsPage'
import UsersPage from './pages/admin/UsersPage'
import ReportsPage from './pages/admin/ReportsPage'

import POSPage from './pages/pos/POSPage'
import OrderHistoryPage from './pages/pos/OrderHistoryPage'
import POSCustomersPage from './pages/pos/POSCustomersPage'
import TableViewPage from './pages/pos/TableViewPage'

import KitchenPage from './pages/kitchen/KitchenPage'

import CustomerHomePage from './pages/customer/CustomerHomePage'
import CustomerBookingPage from './pages/customer/CustomerBookingPage'
import CustomerMenuPage from './pages/customer/CustomerMenuPage'
import CustomerCheckoutPage from './pages/customer/CustomerCheckoutPage'
import CustomerTrackPage from './pages/customer/CustomerTrackPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<RoleHomeRedirect />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignupPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/setup"
            element={
              <PublicOnlyRoute>
                <SetupPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.staff}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.admin}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.admin}>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.admin}>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payment-methods"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.admin}>
                <PaymentMethodsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coupons"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.admin}>
                <CouponsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/promotions"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.admin}>
                <PromotionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/floors"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.admin}>
                <FloorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.admin}>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.admin}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.admin}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pos"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.staff}>
                <POSPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos/orders"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.staff}>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos/customers"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.staff}>
                <POSCustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos/table-view"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.staff}>
                <TableViewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/home"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.customer}>
                <CustomerHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/booking"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.customer}>
                <CustomerBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/menu"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.customer}>
                <CustomerMenuPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/checkout"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.customer}>
                <CustomerCheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/track"
            element={
              <ProtectedRoute allowedRoles={ROLE_ACCESS.customer}>
                <CustomerTrackPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<RoleHomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
