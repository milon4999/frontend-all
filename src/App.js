import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './store/store';
import ScrollToTop from './components/common/ScrollToTop';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import BottomNav from './components/layout/BottomNav';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import Contact from './pages/Contact';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminBanners from './pages/admin/Banners';
import AdminCategories from './pages/admin/Categories';
import AdminCoupons from './pages/admin/Coupons';
import AdminSettings from './pages/admin/Settings';
import TestProducts from './pages/admin/TestProducts';
import LayoutTest from './pages/admin/LayoutTest';
import ApiTest from './pages/ApiTest';

// Components
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Layout wrapper component
const AppLayout = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Define routes that should hide navbar on mobile
  const mobileNoNavbarRoutes = ['/login', '/register', '/profile'];
  const shouldHideNavbarOnMobile = mobileNoNavbarRoutes.includes(location.pathname) || 
                                   location.pathname.startsWith('/products/');
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isAdminRoute) {
    // Admin routes without navbar/footer
    return (
      <div className="min-h-screen">
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
          <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/test" element={<AdminRoute><TestProducts /></AdminRoute>} />
          <Route path="/admin/layout-test" element={<AdminRoute><LayoutTest /></AdminRoute>} />
        </Routes>
      </div>
    );
  }

  // Regular routes with conditional navbar/footer
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {!isAdminRoute && (
        <div className={shouldHideNavbarOnMobile ? 'hidden md:block' : ''}>
          <Navbar />
        </div>
      )}
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/api-test" element={<ApiTest />} />

          {/* Private Routes */}
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
          <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
        </Routes>
      </main>
      
      {/* Footer - Hidden on mobile for auth and profile pages */}
      <div className={shouldHideNavbarOnMobile ? 'hidden md:block' : ''}>
        <Footer />
      </div>
      
      {/* Bottom Navigation - Always show on mobile */}
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppLayout />
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </Provider>
  );
}

export default App;
