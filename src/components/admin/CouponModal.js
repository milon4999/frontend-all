import React, { useState, useEffect } from 'react';
import { X, Percent, DollarSign, Gift } from 'lucide-react';
import { couponsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CouponModal = ({ isOpen, onClose, coupon = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    description: '',
    minPurchase: '',
    maxDiscount: '',
    usageLimit: '',
    usedCount: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    applicableProducts: [],
    applicableCategories: []
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        // Edit mode - populate form with existing coupon data
        setFormData({
          code: coupon.code || '',
          discountType: coupon.discountType || 'percentage',
          discountValue: coupon.discountValue || '',
          description: coupon.description || '',
          minPurchase: coupon.minPurchase || '',
          maxDiscount: coupon.maxDiscount || '',
          usageLimit: coupon.usageLimit || '',
          usedCount: coupon.usedCount || 0,
          startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
          endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
          isActive: coupon.isActive !== false,
          applicableProducts: coupon.applicableProducts || [],
          applicableCategories: coupon.applicableCategories || []
        });
      } else {
        // Reset form for new coupon
        setFormData({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          description: '',
          minPurchase: '',
          maxDiscount: '',
          usageLimit: '',
          usedCount: 0,
          startDate: '',
          endDate: '',
          isActive: true,
          applicableProducts: [],
          applicableCategories: []
        });
      }
    }
  }, [isOpen, coupon]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up data
      const cleanData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined
      };

      if (coupon) {
        // Edit existing coupon
        await couponsAPI.update(coupon._id, cleanData);
        toast.success('Coupon updated successfully!');
      } else {
        // Create new coupon
        await couponsAPI.create(cleanData);
        toast.success('Coupon created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Gift className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {coupon ? 'Edit Coupon' : 'Create New Coupon'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Coupon Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Coupon Code *</label>
                  <div className="flex mt-1">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter coupon code"
                      className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 uppercase"
                      style={{ textTransform: 'uppercase' }}
                    />
                    <button
                      type="button"
                      onClick={generateCouponCode}
                      className="px-4 py-2 bg-gray-100 text-gray-700 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 text-sm"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Use uppercase letters and numbers only</p>
                </div>

                {/* Coupon Type and Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Discount Type *</label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Discount Value *</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {formData.discountType === 'percentage' ? (
                          <Percent className="h-4 w-4 text-gray-400" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        required
                        min="0"
                        max={formData.discountType === 'percentage' ? '100' : undefined}
                        step={formData.discountType === 'percentage' ? '1' : '0.01'}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Brief description of the coupon"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Conditions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Purchase Amount</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="minPurchase"
                        value={formData.minPurchase}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maximum Discount</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="maxDiscount"
                        value={formData.maxDiscount}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="No limit"
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Usage Limits and Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maximum Uses</label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      min="1"
                      placeholder="Unlimited"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Usage Stats (Edit mode only) */}
                {coupon && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Times Used:</span>
                        <span className="ml-2 font-medium text-gray-900">{formData.usedCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Remaining Uses:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formData.usageLimit ? (formData.usageLimit - formData.usedCount) : 'Unlimited'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Status */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active Coupon</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">Inactive coupons cannot be used by customers</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Saving...' : (coupon ? 'Update Coupon' : 'Create Coupon')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CouponModal;
