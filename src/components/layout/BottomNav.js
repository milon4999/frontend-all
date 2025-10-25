import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, ShoppingBag, ShoppingCart, User, MessageCircle, Facebook } from 'lucide-react';
import { getSocialLinks } from '../../utils/settings';

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
  </svg>
);

const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const cartItems = Array.isArray(items) ? items : [];
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const messageButtonRef = useRef(null);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the dropdown or the message button
      if (
        (dropdownRef.current && dropdownRef.current.contains(event.target)) ||
        (messageButtonRef.current && messageButtonRef.current.contains(event.target))
      ) {
        return;
      }
      console.log('Clicking outside, closing dropdown');
      setShowMessageDropdown(false);
    };

    if (showMessageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMessageDropdown]);

  const { facebookUrl, whatsappUrl } = getSocialLinks();
  const messageOptions = [
    {
      url: facebookUrl || 'https://www.facebook.com/yourpage',
      icon: Facebook,
      label: 'Facebook',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      url: whatsappUrl || 'https://wa.me/1234567890',
      icon: WhatsAppIcon,
      label: 'WhatsApp',
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle navigation with scroll to top
  const handleNavClick = (path, e) => {
    if (isActive(path)) {
      e.preventDefault();
      scrollToTop();
    }
    // If not on the current page, let the Link component handle navigation normally
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-pink-600 shadow-lg z-50">
      <div className="relative">
        {/* Dropdown Menu */}
        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 transition-all duration-300 ease-out ${
          showMessageDropdown 
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
            : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }`}>
          <div 
            ref={dropdownRef}
            className="bg-white rounded-2xl shadow-2xl border border-pink-100 p-3 min-w-[180px]"
          >
            <div className="flex flex-col space-y-2">
              {messageOptions.map((option) => {
                const Icon = option.icon;
                
                return (
                  <a
                    key={option.label}
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center space-x-2 p-3 rounded-xl text-white transition-all duration-200 transform hover:scale-105 active:scale-95 ${option.color}`}
                    onClick={(e) => {
                      setShowMessageDropdown(false);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{option.label}</span>
                  </a>
                );
              })}
            </div>
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white drop-shadow-sm"></div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex justify-around items-center h-16 px-2">
          {/* Home */}
          <Link
            to="/"
            onClick={(e) => handleNavClick('/', e)}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
              isActive('/') 
                ? 'text-white' 
                : 'text-pink-100 hover:text-white'
            }`}
          >
            <div className="relative">
              <Home className={`h-6 w-6 ${isActive('/') ? 'stroke-2' : ''}`} />
            </div>
            <span className={`text-xs mt-1 ${isActive('/') ? 'font-semibold text-white' : 'text-pink-100'}`}>
              Home
            </span>
            {isActive('/') && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white rounded-b-full" />
            )}
          </Link>

          {/* Shop */}
          <Link
            to="/products"
            onClick={(e) => handleNavClick('/products', e)}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
              isActive('/products') 
                ? 'text-white' 
                : 'text-pink-100 hover:text-white'
            }`}
          >
            <div className="relative">
              <ShoppingBag className={`h-6 w-6 ${isActive('/products') ? 'stroke-2' : ''}`} />
            </div>
            <span className={`text-xs mt-1 ${isActive('/products') ? 'font-semibold text-white' : 'text-pink-100'}`}>
              Shop
            </span>
            {isActive('/products') && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white rounded-b-full" />
            )}
          </Link>

          {/* Message Button with Dropdown - CENTER POSITION */}
          <button
            ref={messageButtonRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Message button clicked, current state:', showMessageDropdown, 'will change to:', !showMessageDropdown);
              setShowMessageDropdown(prev => !prev);
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200 ${
              showMessageDropdown 
                ? 'text-white bg-pink-700' 
                : 'text-pink-100 hover:text-white active:bg-pink-700'
            }`}
            type="button"
          >
            <div className="relative">
              <MessageCircle className={`h-6 w-6 transition-all duration-200 ${showMessageDropdown ? 'stroke-2 scale-110' : ''}`} />
            </div>
            <span className={`text-xs mt-1 transition-all duration-200 ${showMessageDropdown ? 'font-semibold text-white' : 'text-pink-100'}`}>
              Message
            </span>
            {showMessageDropdown && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white rounded-b-full animate-in slide-in-from-left duration-200" />
            )}
          </button>

          {/* Cart */}
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
              isActive('/cart') 
                ? 'text-white' 
                : 'text-pink-100 hover:text-white'
            }`}
          >
            <div className="relative">
              <ShoppingCart className={`h-6 w-6 ${isActive('/cart') ? 'stroke-2' : ''}`} />
              {cartItems.length > 0 && (
              <span className="absolute -top-1 right-2 bg-white text-pink-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-pink-600">
                {cartItems.length}
              </span>
            )}
            </div>
            <span className={`text-xs mt-1 ${isActive('/cart') ? 'font-semibold text-white' : 'text-pink-100'}`}>
              Cart
            </span>
            {isActive('/cart') && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white rounded-b-full" />
            )}
          </Link>

          {/* Profile */}
          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
              isActive(isAuthenticated ? '/profile' : '/login') 
                ? 'text-white' 
                : 'text-pink-100 hover:text-white'
            }`}
          >
            <div className="relative">
              <User className={`h-6 w-6 ${isActive(isAuthenticated ? '/profile' : '/login') ? 'stroke-2' : ''}`} />
            </div>
            <span className={`text-xs mt-1 ${isActive(isAuthenticated ? '/profile' : '/login') ? 'font-semibold text-white' : 'text-pink-100'}`}>
              {isAuthenticated ? 'Profile' : 'Login'}
            </span>
            {isActive(isAuthenticated ? '/profile' : '/login') && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white rounded-b-full" />
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
