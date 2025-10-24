import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="hidden md:block bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="h-8 w-8 text-primary-500" />
              <span className="text-2xl font-bold text-white">ShopHub</span>
            </div>
            <p className="text-sm">
              Your one-stop shop for quality products at great prices. Shop with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="hover:text-primary-500 transition">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary-500 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary-500 transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary-500 transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/shipping" className="hover:text-primary-500 transition">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-primary-500 transition">
                  Returns
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary-500 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary-500 transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>support@shophub.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>123 Commerce St, City, State 12345</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} ShopHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
