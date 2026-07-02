import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { LangProvider } from './context/LangContext.jsx'
import { LocationProvider } from './context/LocationContext.jsx'
import ToastContainer from './components/Toast.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import SellerDashboard from './pages/SellerDashboard.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import DeliveryDashboard from './pages/DeliveryDashboard.jsx'
import CartPage from './pages/CartPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import StarWorker from './pages/StarWorker.jsx'
import About from './pages/About.jsx'
import Courses from './pages/Courses.jsx'
import Services from './pages/Services.jsx'
import Terms from './pages/Terms.jsx'
import Privacy from './pages/Privacy.jsx'
import Support from './pages/Support.jsx'

function ProtectedRoute({ children, role }) {
  const { user, isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'seller') return <Navigate to="/seller/dashboard" replace />
  if (user.role === 'delivery') return <Navigate to="/delivery/dashboard" replace />
  return <Navigate to="/customer/dashboard" replace />
}

export default function App() {
  return (
    <LangProvider>
      <LocationProvider>
        <AuthProvider>
          <CartProvider>
            <ToastContainer />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/star-worker" element={<StarWorker />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/services" element={<Services />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/support" element={<Support />} />
              <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute role="customer"><CartPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute role="customer"><OrdersPage /></ProtectedRoute>} />
              <Route path="/customer/dashboard" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/seller/dashboard" element={<ProtectedRoute role="seller"><SellerDashboard /></ProtectedRoute>} />
              <Route path="/delivery/dashboard" element={<ProtectedRoute role="delivery"><DeliveryDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </LocationProvider>
    </LangProvider>
  )
}
