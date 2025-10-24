import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Tag,
  X,
  FolderTree
} from 'lucide-react';
import { categoriesAPI, uploadAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    parent: '',
    isActive: true,
    order: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
      const submitData = {
        ...formData,
        parent: formData.parent || null
      };

      if (editingCategory) {
        await categoriesAPI.update(editingCategory._id, submitData);
      } else {
        await categoriesAPI.create(submitData);
      }
      
      fetchCategories();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.message || 'Error saving category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      parent: category.parent?._id || '',
      isActive: category.isActive,
      order: category.order
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoriesAPI.delete(id);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      parent: '',
      isActive: true,
      order: 0
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
            <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
            <p className="text-gray-600 mt-1">Manage product categories and subcategories</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Category
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition"
            >
              {/* Category Image */}
              <div className="relative h-40 overflow-hidden bg-gray-100">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200/4F46E5/ffffff?text=' + category.name;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                    <Tag className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    category.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Order Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white text-gray-800">
                    #{category.order}
                  </span>
                </div>
              </div>

              {/* Category Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{category.name}</h3>
                <p className="text-xs text-gray-500 mb-2">Slug: {category.slug}</p>
                
                {category.parent && (
                  <div className="flex items-center text-xs text-blue-600 mb-2">
                    <FolderTree className="h-3 w-3 mr-1" />
                    Parent: {category.parent.name}
                  </div>
                )}
                
                {category.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
            <p className="text-gray-500 mb-4">Create your first category to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Category
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
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="inline h-4 w-4 mr-1" />
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Electronics, Fashion, etc."
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
                    rows="3"
                    placeholder="Category description..."
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="inline h-4 w-4 mr-1" />
                    Category Image
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
                          e.target.src = 'https://via.placeholder.com/300x200/4F46E5/ffffff?text=Invalid+Image';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Parent Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FolderTree className="inline h-4 w-4 mr-1" />
                    Parent Category
                  </label>
                  <select
                    value={formData.parent}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">None (Top Level)</option>
                    {categories
                      .filter(cat => !editingCategory || cat._id !== editingCategory._id)
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select a parent category to create a subcategory</p>
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
                    disabled={uploading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
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

export default Categories;
