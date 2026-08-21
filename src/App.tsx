import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Market from './pages/Market'
import Trade from './pages/Trade'
import TradeDetail from './pages/TradeDetail'
import History from './pages/History'
import Asset from './pages/Asset'
import Profile from './pages/Profile'
import Deposits from './pages/Deposits'
import Withdrawals from './pages/Withdrawals'
import Transfers from './pages/Transfers'
import CustomerService from './pages/CustomerService'
import OrderDetail from './pages/OrderDetail'
import Settings from './pages/Settings'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ConfirmEmail from './pages/ConfirmEmail'
import ChangePassword from './pages/ChangePassword'
import TwoFactorAuth from './pages/TwoFactorAuth'
import KycVerify from './pages/KycVerify'
import HelpSupport from './pages/HelpSupport'
import PrivacyPolicy from './pages/PrivacyPolicy'
import WithdrawalDetail from './pages/WithdrawalDetail'
import MarketCategory from './pages/MarketCategory'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminUserEdit from './pages/AdminUserEdit'
import AdminTransactions from './pages/AdminTransactions'
import AdminTrades from './pages/AdminTrades'
import AdminRisk from './pages/AdminRisk'
import AdminConfig from './pages/AdminConfig'
import AdminAuditLog from './pages/AdminAuditLog'
import AdminCoins from './pages/AdminCoins'
import AdminKyc from './pages/AdminKyc'
import AdminSubAdmins from './pages/AdminSubAdmins'
import AdminNotifyUsers from './pages/AdminNotifyUsers'
import AdminSiteSettingsPage from './pages/AdminSiteSettings'
import AdminSupport from './pages/AdminSupport'
import AdminSignIn from './pages/AdminSignIn'
import { AdminRoute } from './components/AdminRoute'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Navigate to="/signin" replace />} />
            <Route path="/register" element={<Navigate to="/signup" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/help-support" element={<HelpSupport />} />
            <Route path="/admin/signin" element={<AdminSignIn />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/market" element={<Market />} />
              <Route path="/crypto/:category" element={<MarketCategory type="crypto" />} />
              <Route path="/stocks" element={<MarketCategory type="stocks" />} />
              <Route path="/forex" element={<MarketCategory type="forex" />} />
              <Route path="/metals" element={<MarketCategory type="metals" />} />
              <Route path="/trade" element={<Trade />} />
              <Route path="/trade/:type/:symbol" element={<TradeDetail />} />
              <Route path="/history" element={<History />} />
              <Route path="/asset" element={<Asset />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/deposits" element={<Deposits />} />
              <Route path="/profile/withdrawals" element={<Withdrawals />} />
              <Route path="/profile/transfers" element={<Transfers />} />
              <Route path="/withdrawal/:id" element={<WithdrawalDetail />} />
              <Route path="/customer-service" element={<CustomerService />} />
              <Route path="/order/:tradeId" element={<OrderDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/change-password" element={<ChangePassword />} />
              <Route path="/settings/2fa" element={<TwoFactorAuth />} />
              <Route path="/kyc/verify" element={<KycVerify />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserEdit />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="trades" element={<AdminTrades />} />
              <Route path="risk" element={<AdminRisk />} />
              <Route path="config" element={<AdminConfig />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="coins" element={<AdminCoins />} />
              <Route path="kyc" element={<AdminKyc />} />
              <Route path="subadmins" element={<AdminSubAdmins />} />
              <Route path="notify" element={<AdminNotifyUsers />} />
              <Route path="site-settings" element={<AdminSiteSettingsPage />} />
              <Route path="support" element={<AdminSupport />} />
            </Route>

            <Route path="/subadmin/*" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
