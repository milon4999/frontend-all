import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  TrendingUp, 
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatPrice } from '../../utils/currency';
import { getAdminSettings } from '../../utils/settings';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        console.log('Fetching analytics...');
        const response = await analyticsAPI.getDashboard();
        console.log('Analytics response:', response.data);
        setAnalytics(response.data.analytics || response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Set default analytics if API fails
        setAnalytics({
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalUsers: 0,
          recentOrders: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Welcome back! Here's what's happening with your store.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatPrice(
                  analytics.totalRevenue || 0,
                  getAdminSettings()?.currency || 'USD'
                )}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+12.5%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalOrders || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600 font-medium">+8.2%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalProducts || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">+5.1%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalUsers || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">+15.3%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link 
                  to="/admin/products" 
                  className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900">Manage Products</h3>
                      <p className="text-sm text-gray-500">Add, edit, or remove products</p>
                    </div>
                  </div>
                </Link>
                
                <Link 
                  to="/admin/orders" 
                  className="group p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                      <ShoppingBag className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900">Manage Orders</h3>
                      <p className="text-sm text-gray-500">Process and track orders</p>
                    </div>
                  </div>
                </Link>
                
                <Link 
                  to="/admin/users" 
                  className="group p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900">Manage Users</h3>
                      <p className="text-sm text-gray-500">View and manage accounts</p>
                    </div>
                  </div>
                </Link>
                
                <Link 
                  to="/admin/coupons" 
                  className="group p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                      <Star className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900">Manage Coupons</h3>
                      <p className="text-sm text-gray-500">Create discount codes</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Order Status Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Pending</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Processing</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">8</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Completed</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">156</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Cancelled</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link 
              to="/admin/orders" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all orders →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.recentOrders?.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">#{order.orderNumber}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{order.user?.name || 'Guest'}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900">{formatPrice(
                      order.pricing?.total || 0,
                      order.currency || order.items?.[0]?.currency || order.items?.[0]?.product?.currency || getAdminSettings()?.currency || 'USD'
                    )}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      No recent orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
