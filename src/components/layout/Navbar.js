import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, Heart, User, Search, LogOut, Package, LayoutDashboard } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <>
    <nav className="bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg fixed inset-x-0 top-0 z-50 md:sticky md:top-0">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0 hover:opacity-90 transition-opacity">
            <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 text-white drop-shadow-md" />
            <span className="text-base sm:text-xl lg:text-3xl font-bold text-white tracking-tight whitespace-nowrap drop-shadow-sm">CHOII FASHION</span>
          </Link>

          {/* Search Bar - Mobile & Desktop */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xs sm:max-w-sm lg:max-w-2xl mx-2 sm:mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 sm:py-2.5 lg:py-3 pr-10 sm:pr-12 text-sm lg:text-base text-gray-900 placeholder:text-gray-500 caret-pink-600 bg-white border-2 border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:border-white shadow-md transition-all"
              />
              <button 
                type="submit" 
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-pink-500 hover:bg-pink-600 p-1.5 sm:p-2 rounded-full transition-colors"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </button>
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 flex-shrink-0">
            <Link 
              to="/products" 
              className="text-white hover:text-pink-100 transition-colors font-medium text-sm lg:text-base px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Products
            </Link>

            {isAuthenticated ? (
              <>
                <Link 
                  to="/wishlist" 
                  className="text-white hover:text-pink-100 transition-all p-2 rounded-lg hover:bg-white/10"
                  title="Wishlist"
                >
                  <Heart className="h-5 w-5 lg:h-6 lg:w-6" />
                </Link>
                <Link 
                  to="/cart" 
                  className="relative text-white hover:text-pink-100 transition-all p-2 rounded-lg hover:bg-white/10"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6" />
                  {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                      {items.length}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 text-white hover:text-pink-100 transition-all px-3 py-2 rounded-lg hover:bg-white/10"
                  >
                    <User className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="font-medium text-sm lg:text-base max-w-[120px] truncate">{user?.name}</span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100">
                    <Link to="/profile" className="block px-4 py-2.5 text-gray-700 hover:bg-pink-50 flex items-center transition-colors rounded-lg mx-2">
                      <User className="h-4 w-4 mr-3 text-pink-600" />
                      <span className="font-medium">Profile</span>
                    </Link>
                    <Link to="/orders" className="block px-4 py-2.5 text-gray-700 hover:bg-pink-50 flex items-center transition-colors rounded-lg mx-2">
                      <Package className="h-4 w-4 mr-3 text-pink-600" />
                      <span className="font-medium">My Orders</span>
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'editor') && (
                      <Link to="/admin" className="block px-4 py-2.5 text-gray-700 hover:bg-pink-50 flex items-center transition-colors rounded-lg mx-2">
                        <LayoutDashboard className="h-4 w-4 mr-3 text-pink-600" />
                        <span className="font-medium">Admin Panel</span>
                      </Link>
                    )}
                    <div className="border-t border-gray-100 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 flex items-center transition-colors rounded-lg mx-2"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/cart" 
                  className="relative text-white hover:text-pink-100 transition-all p-2 rounded-lg hover:bg-white/10"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6" />
                  {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                      {items.length}
                    </span>
                  )}
                </Link>
                <Link
                  to="/login"
                  className="text-white hover:text-pink-100 transition-colors font-medium text-sm lg:text-base px-4 py-2 rounded-lg hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-pink-600 px-4 lg:px-6 py-2 lg:py-2.5 rounded-full hover:bg-pink-50 transition-all font-semibold text-sm lg:text-base shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
    {/* Mobile spacer to offset fixed navbar height */}
    <div className="h-14 sm:h-16 lg:h-20 md:hidden" aria-hidden="true" />
    </>
  );
};

export default Navbar;
