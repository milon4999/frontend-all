import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Image as ImageIcon,
  Calendar,
  Link as LinkIcon,
  Type,
  Palette,
  X
} from 'lucide-react';
import { bannersAPI, uploadAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    image: '',
    bgColor: '',
    isActive: true,
    order: 0,
    startDate: '',
    endDate: ''
  });

  const bgColorOptions = [
    { value: '', label: 'None', preview: 'bg-gray-200 border-2 border-gray-400' },
    { value: 'from-blue-600 to-blue-800', label: 'Blue', preview: 'bg-gradient-to-r from-blue-600 to-blue-800' },
    { value: 'from-purple-600 to-purple-800', label: 'Purple', preview: 'bg-gradient-to-r from-purple-600 to-purple-800' },
    { value: 'from-green-600 to-green-800', label: 'Green', preview: 'bg-gradient-to-r from-green-600 to-green-800' },
    { value: 'from-red-600 to-red-800', label: 'Red', preview: 'bg-gradient-to-r from-red-600 to-red-800' },
    { value: 'from-orange-600 to-orange-800', label: 'Orange', preview: 'bg-gradient-to-r from-orange-600 to-orange-800' },
    { value: 'from-pink-600 to-pink-800', label: 'Pink', preview: 'bg-gradient-to-r from-pink-600 to-pink-800' },
    { value: 'from-indigo-600 to-indigo-800', label: 'Indigo', preview: 'bg-gradient-to-r from-indigo-600 to-indigo-800' },
    { value: 'from-teal-600 to-teal-800', label: 'Teal', preview: 'bg-gradient-to-r from-teal-600 to-teal-800' },
  ];

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await bannersAPI.getAllAdmin();
      setBanners(response.data.banners);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      
      const response = await uploadAPI.uploadImage(formDataUpload);
      setFormData({ ...formData, image: response.data.url });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingBanner) {
        await bannersAPI.update(editingBanner._id, formData);
      } else {
        await bannersAPI.create(formData);
      }
      
      fetchBanners();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert(error.response?.data?.message || 'Error saving banner');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink,
      image: banner.image,
      bgColor: banner.bgColor,
      isActive: banner.isActive,
      order: banner.order,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      await bannersAPI.delete(id);
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Error deleting banner');
    }
  };

  const handleToggle = async (id) => {
    try {
      await bannersAPI.toggle(id);
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      alert('Error toggling banner status');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      buttonText: 'Shop Now',
      buttonLink: '/products',
      image: '',
      bgColor: '',
      isActive: true,
      order: 0,
      startDate: '',
      endDate: ''
    });
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
            <p className="text-gray-600 mt-1">Manage homepage banners and sliders</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Banner
          </button>
        </div>

        {/* Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              {/* Banner Preview */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x300/4F46E5/ffffff?text=Banner';
                  }}
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor} opacity-80`}></div>
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    banner.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Order Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white text-gray-800">
                    Order: {banner.order}
                  </span>
                </div>
              </div>

              {/* Banner Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{banner.title}</h3>
                {banner.subtitle && (
                  <p className="text-sm text-gray-600 mb-2 truncate">{banner.subtitle}</p>
                )}
                {banner.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{banner.description}</p>
                )}

                {/* Date Range */}
                {(banner.startDate || banner.endDate) && (
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Calendar className="h-3 w-3 mr-1" />
                    {banner.startDate && new Date(banner.startDate).toLocaleDateString()}
                    {banner.startDate && banner.endDate && ' - '}
                    {banner.endDate && new Date(banner.endDate).toLocaleDateString()}
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleToggle(banner._id)}
                    className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                      banner.isActive
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {banner.isActive ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Show
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {banners.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No banners yet</h3>
            <p className="text-gray-500 mb-4">Create your first banner to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Banner
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Type className="inline h-4 w-4 mr-1" />
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Summer Collection 2025 (optional)"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="New Arrivals"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Discover the latest trends in fashion"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="inline h-4 w-4 mr-1" />
                    Banner Image *
                  </label>
                  
                  {/* File Upload */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Upload Image</label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
                    </div>
                  </div>

                  {/* OR Divider */}
                  <div className="relative mb-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                  </div>

                  {/* Image URL Input */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Image Preview */}
                  {formData.image && (
                    <div className="mt-2">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="h-32 w-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/1200x600/4F46E5/ffffff?text=Invalid+Image+URL';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Recommended size: 1200x600px</p>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="inline h-4 w-4 mr-1" />
                    Background Gradient
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {bgColorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, bgColor: option.value })}
                        className={`h-12 rounded-lg ${option.preview} ${
                          formData.bgColor === option.value ? 'ring-4 ring-blue-500' : ''
                        }`}
                        title={option.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Button Text & Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Shop Now"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <LinkIcon className="inline h-4 w-4 mr-1" />
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="/products"
                    />
                  </div>
                </div>

                {/* Order & Active Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.image || uploading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingBanner ? 'Update Banner' : 'Create Banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Banners;
