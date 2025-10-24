import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  User, Phone, Calendar, MapPin, Edit2, 
  Package, Heart, ShoppingBag, Settings, Shield,
  CreditCard, Bell, LogOut
} from 'lucide-react';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch user orders
        const ordersResponse = await axios.get(`${process.env.REACT_APP_API_URL}/orders/my-orders`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (ordersResponse.data && ordersResponse.data.orders) {
          setOrders(ordersResponse.data.orders);
          
          // Calculate total spent
          const total = ordersResponse.data.orders.reduce((sum, order) => {
            return sum + (order.totalAmount || 0);
          }, 0);
          setTotalSpent(total);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Format member since date
  const getMemberSince = () => {
    console.log('User createdAt:', user?.createdAt);
    console.log('User object:', user);
    
    if (!user?.createdAt) {
      // Try alternative date fields
      if (user?.created_at) {
        const date = new Date(user.created_at);
        if (!isNaN(date.getTime())) return date.getFullYear();
      }
      return '2024'; // Default fallback
    }
    
    const date = new Date(user.createdAt);
    if (isNaN(date.getTime())) return '2024';
    return date.getFullYear();
  };

  // Format joined date
  const getJoinedDate = () => {
    if (!user?.createdAt) {
      // Try alternative date fields
      if (user?.created_at) {
        const date = new Date(user.created_at);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
      }
      return 'Recently';
    }
    
    const date = new Date(user.createdAt);
    if (isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const stats = [
    { 
      label: 'Total Orders', 
      value: loading ? '...' : orders.length.toString(), 
      icon: ShoppingBag, 
      color: 'bg-blue-500',
      link: '/orders'
    },
    { 
      label: 'Wishlist Items', 
      value: wishlistItems?.length?.toString() || '0', 
      icon: Heart, 
      color: 'bg-red-500',
      link: '/wishlist'
    },
    { 
      label: 'Total Spent', 
      value: loading ? '...' : `$${totalSpent.toFixed(2)}`, 
      icon: CreditCard, 
      color: 'bg-green-500',
      link: '/orders'
    },
    { 
      label: 'Member Since', 
      value: getMemberSince(), 
      icon: Calendar, 
      color: 'bg-purple-500',
      link: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-2 md:pt-0 pb-20 md:pb-0">
      {/* Header/Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User') + '&size=200&background=4F46E5&color=fff&bold=true'}
                alt={user?.name}
                className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl object-cover"
              />
              <button className="absolute bottom-0 right-0 bg-white text-primary-600 p-2 rounded-full shadow-lg hover:bg-gray-100 transition">
                <Edit2 className="h-4 w-4" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                <h1 className="text-xl sm:text-3xl font-bold">{user?.name}</h1>
                {user?.role === 'admin' && (
                  <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-blue-100 mb-4">{user?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {getJoinedDate()}
                </span>
                {user?.phone && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => {
            const CardContent = (
              <div className="bg-white rounded-xl shadow-md p-3 sm:p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${stat.color} p-2 sm:p-3 rounded-lg`}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            );

            return stat.link ? (
              <Link key={index} to={stat.link}>
                {CardContent}
              </Link>
            ) : (
              <div key={index}>
                {CardContent}
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 sm:px-6 py-4 font-semibold transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
                      <p className="font-semibold text-gray-900">{user?.name}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 mb-1 block">Email Address</label>
                      <p className="font-semibold text-gray-900">{user?.email}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 mb-1 block">Phone Number</label>
                      <p className="font-semibold text-gray-900">{user?.phone || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 mb-1 block">Account Type</label>
                      <p className="font-semibold text-gray-900 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary-600" />
                    Saved Addresses
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No saved addresses yet</p>
                    <button className="mt-2 text-primary-600 hover:text-primary-700 font-semibold">
                      Add Address
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
                <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                <Link
                  to="/products"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Browse Products
                </Link>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Your Wishlist is Empty</h3>
                <p className="text-gray-600 mb-4">Save your favorite items for later</p>
                <Link
                  to="/products"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Explore Products
                </Link>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold">Notifications</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold">Privacy & Security</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold">Payment Methods</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition text-red-600">
                  <div className="flex items-center space-x-3">
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">Logout</span>
                  </div>
                  <span className="text-red-400">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
