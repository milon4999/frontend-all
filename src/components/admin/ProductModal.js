import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ProductModal = ({ isOpen, onClose, product = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    currency: 'USD',
    category: '',
    tags: [],
    images: [{ url: '', alt: '' }],
    variants: [],
    inventory: {
      stock: '',
      sku: '',
      lowStockThreshold: 10,
      trackInventory: true
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: []
    },
    featured: false,
    isActive: true
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (product) {
        // Edit mode - populate form with existing product data
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          comparePrice: product.comparePrice || '',
          currency: product.currency || 'USD',
          category: product.category?._id || '',
          tags: product.tags || [],
          images: product.images?.length ? product.images : [{ url: '', alt: '' }],
          variants: product.variants || [],
          inventory: {
            stock: product.inventory?.stock || '',
            sku: product.inventory?.sku || '',
            lowStockThreshold: product.inventory?.lowStockThreshold || 10,
            trackInventory: product.inventory?.trackInventory !== false
          },
          seo: {
            metaTitle: product.seo?.metaTitle || '',
            metaDescription: product.seo?.metaDescription || '',
            metaKeywords: product.seo?.metaKeywords || []
          },
          featured: product.featured || false,
          isActive: product.isActive !== false
        });
      }
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '' }]
    }));
  };

  const updateImage = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      )
    }));
  };

  const removeImage = (index) => {
    if (formData.images.length > 1) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };





  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up data
      const cleanData = {
        ...formData,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        inventory: {
          ...formData.inventory,
          stock: parseInt(formData.inventory.stock),
          lowStockThreshold: parseInt(formData.inventory.lowStockThreshold)
        },
        images: formData.images.filter(img => img.url.trim()),
        tags: formData.tags.filter(tag => tag.trim())
      };

      if (product) {
        // Edit existing product
        await productsAPI.update(product._id, cleanData);
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        await productsAPI.create(cleanData);
        toast.success('Product created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {product ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="BDT">BDT (৳)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="CNY">CNY (¥)</option>
                        <option value="AUD">AUD (A$)</option>
                        <option value="CAD">CAD (C$)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Compare Price</label>
                      <input
                        type="number"
                        name="comparePrice"
                        value={formData.comparePrice}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex mt-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Images and Inventory */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Images & Inventory</h4>
                  
                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Images</label>
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex gap-2 mt-2">
                        <input
                          type="url"
                          placeholder="Image URL"
                          value={image.url}
                          onChange={(e) => updateImage(index, 'url', e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Alt text"
                          value={image.alt}
                          onChange={(e) => updateImage(index, 'alt', e.target.value)}
                          className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="px-2 py-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImage}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Image
                    </button>
                  </div>

                  {/* Inventory */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock *</label>
                      <input
                        type="number"
                        name="inventory.stock"
                        value={formData.inventory.stock}
                        onChange={handleInputChange}
                        required
                        min="0"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SKU</label>
                      <input
                        type="text"
                        name="inventory.sku"
                        value={formData.inventory.sku}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
                    <input
                      type="number"
                      name="inventory.lowStockThreshold"
                      value={formData.inventory.lowStockThreshold}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active Product</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
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

export default ProductModal;
