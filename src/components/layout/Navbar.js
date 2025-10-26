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
    <nav className="bg-pink-600 text-white shadow-sm fixed inset-x-0 top-0 z-50 md:sticky md:top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-1.5 flex-shrink-0">
            <ShoppingCart className="h-5 w-5 sm:h-8 sm:w-8 text-primary-600" />
            <span className="text-sm sm:text-2xl font-bold text-white tracking-tight whitespace-nowrap">CHOII FASHION</span>
          </Link>

          {/* Search Bar - Mobile & Desktop */}
          <form onSubmit={handleSearch} className="flex-1 md:max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 sm:px-4 sm:py-2 pr-9 sm:pr-10 text-sm text-gray-900 placeholder:text-gray-400 caret-pink-600 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
              />
              <button type="submit" className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2">
                <Search className="h-5 w-5 text-pink-400" />
              </button>
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="text-white hover:text-pink-200 transition">
              Products
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/wishlist" className="text-white hover:text-pink-200 transition">
                  <Heart className="h-6 w-6" />
                </Link>
                <Link to="/cart" className="relative text-white hover:text-pink-200 transition">
                  <ShoppingCart className="h-6 w-6" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 text-white hover:text-pink-200 transition"
                  >
                    <User className="h-6 w-6" />
                    <span>{user?.name}</span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      My Orders
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'editor') && (
                      <Link to="/admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/cart" className="relative text-white hover:text-pink-200 transition">
                  <ShoppingCart className="h-6 w-6" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </Link>
                <Link
                  to="/login"
                  className="text-white hover:text-pink-200 transition font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-50 transition font-medium"
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
    <div className="h-14 sm:h-16 md:hidden" aria-hidden="true" />
    </>
  );
};

export default Navbar;
