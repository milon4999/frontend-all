import React, { useEffect, useState } from 'react';
import { couponsAPI } from '../../services/api';
import { Plus, Trash2, Edit, Gift, Percent, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/admin/AdminLayout';
import CouponModal from '../../components/admin/CouponModal';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await couponsAPI.getAll();
      setCoupons(response.data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await couponsAPI.delete(id);
        toast.success('Coupon deleted successfully');
        fetchCoupons();
      } catch (error) {
        toast.error('Failed to delete coupon');
      }
    }
  };

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setShowCouponModal(true);
  };

  const handleEditCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setShowCouponModal(true);
  };

  const handleModalSuccess = () => {
    fetchCoupons();
    setShowCouponModal(false);
    setSelectedCoupon(null);
  };

  const handleCloseModal = () => {
    setShowCouponModal(false);
    setSelectedCoupon(null);
  };

  if (loading) {
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
            <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
            <p className="mt-2 text-sm text-gray-600">Manage discount codes and promotions</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={handleAddCoupon}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center transition-all shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Coupon
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Coupons</p>
                <p className="text-2xl font-semibold text-gray-900">{coupons.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Percent className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Coupons</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {coupons.filter(c => c.isActive).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Uses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Gift className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {coupons.filter(c => c.endDate && new Date(c.endDate) < new Date()).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-gray-900">{coupon.code}</div>
                      {coupon.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{coupon.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {coupon.discountType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="font-medium">{coupon.usedCount || 0}</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-gray-500">{coupon.usageLimit || '∞'}</span>
                      </div>
                      {coupon.usageLimit && (
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full" 
                            style={{ width: `${Math.min((coupon.usedCount || 0) / coupon.usageLimit * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        coupon.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditCoupon(coupon)}
                          className="text-indigo-600 hover:text-indigo-800 p-1 rounded-md hover:bg-indigo-50"
                          title="Edit Coupon"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                          title="Delete Coupon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {coupons.length === 0 && (
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No coupons found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first coupon.</p>
              <div className="mt-6">
                <button
                  onClick={handleAddCoupon}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Coupon
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <CouponModal
        isOpen={showCouponModal}
        onClose={handleCloseModal}
        coupon={selectedCoupon}
        onSuccess={handleModalSuccess}
      />
    </AdminLayout>
  );
};

export default Coupons;
