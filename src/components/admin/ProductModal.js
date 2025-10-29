import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Star, Award, Package, Tag, Image as ImageIcon, TrendingUp, Settings, Search } from 'lucide-react';
import { productsAPI, categoriesAPI, uploadAPI } from '../../services/api';
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
    shipping: {
      weight: '',
      dimensions: { length: '', width: '', height: '' },
      freeShipping: false,
      freeShippingThreshold: 50,
      standardDelivery: '3-5 business days',
      expressDelivery: '1-2 business days (additional charges apply)',
      internationalShipping: true,
      shippingNotes: ''
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
  const [newKeyword, setNewKeyword] = useState('');
  const [newVariantName, setNewVariantName] = useState('');
  const [variantOptionInputs, setVariantOptionInputs] = useState({});
  const [imageColorInputs, setImageColorInputs] = useState({});

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
          isActive: product.isActive !== false,
          shipping: {
            weight: product.shipping?.weight || '',
            dimensions: {
              length: product.shipping?.dimensions?.length || '',
              width: product.shipping?.dimensions?.width || '',
              height: product.shipping?.dimensions?.height || ''
            },
            freeShipping: product.shipping?.freeShipping || false,
            freeShippingThreshold: product.shipping?.freeShippingThreshold || 50,
            standardDelivery: product.shipping?.standardDelivery || '3-5 business days',
            expressDelivery: product.shipping?.expressDelivery || '1-2 business days (additional charges apply)',
            internationalShipping: product.shipping?.internationalShipping !== false,
            shippingNotes: product.shipping?.shippingNotes || ''
          }
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
    const val = type === 'checkbox' ? checked : value;
    if (!name.includes('.')) {
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }
    setFormData(prev => {
      const keys = name.split('.');
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        cur[k] = typeof cur[k] === 'object' && cur[k] !== null ? { ...cur[k] } : {};
        cur = cur[k];
      }
      cur[keys[keys.length - 1]] = val;
      return next;
    });
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

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.seo.metaKeywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        seo: { ...prev.seo, metaKeywords: [...prev.seo.metaKeywords, newKeyword.trim()] }
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw) => {
    setFormData(prev => ({
      ...prev,
      seo: { ...prev.seo, metaKeywords: prev.seo.metaKeywords.filter(k => k !== kw) }
    }));
  };

  const addVariant = () => {
    if (newVariantName.trim()) {
      setFormData(prev => ({ ...prev, variants: [...prev.variants, { name: newVariantName.trim(), options: [] }] }));
      setNewVariantName('');
    }
  };

  const removeVariant = (index) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  };

  const addVariantOption = (index) => {
    const val = (variantOptionInputs[index] || '').trim();
    if (!val) return;
    setFormData(prev => {
      const variants = [...prev.variants];
      const opts = variants[index].options || [];
      if (!opts.includes(val)) {
        variants[index] = { ...variants[index], options: [...opts, val] };
      }
      return { ...prev, variants };
    });
    setVariantOptionInputs(prev => ({ ...prev, [index]: '' }));
  };

  const removeVariantOption = (index, opt) => {
    setFormData(prev => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], options: variants[index].options.filter(o => o !== opt) };
      return { ...prev, variants };
    });
  };

  // Ensure a 'Color' variant exists and optionally add a new color option
  const ensureColorVariant = (newColor) => {
    setFormData(prev => {
      const next = { ...prev };
      const variants = [...(next.variants || [])];
      let idx = variants.findIndex(v => String(v.name || '').toLowerCase() === 'color');
      if (idx === -1) {
        variants.push({ name: 'Color', options: [] });
        idx = variants.length - 1;
      }
      if (newColor) {
        const opt = String(newColor).trim();
        const opts = Array.from(new Set([...(variants[idx].options || []), opt]));
        variants[idx] = { ...variants[idx], options: opts };
      }
      next.variants = variants;
      return next;
    });
  };

  // Create a new color option from the images section and assign it to this image
  const addColorForImage = (index) => {
    const val = String(imageColorInputs[index] || '').trim();
    if (!val) return;
    ensureColorVariant(val);
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, color: val } : img))
    }));
    setImageColorInputs(prev => ({ ...prev, [index]: '' }));
    toast.success('Color added');
  };

  const handleImageFile = async (index, file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await uploadAPI.uploadImage(fd);
      const url = res.data.url;
      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => (i === index ? { ...img, url } : img))
      }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    }
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

  const moveImage = (from, to) => {
    setFormData(prev => {
      const imgs = [...prev.images];
      if (from < 0 || to < 0 || from >= imgs.length || to >= imgs.length) return prev;
      const [m] = imgs.splice(from, 1);
      imgs.splice(to, 0, m);
      return { ...prev, images: imgs };
    });
  };

  const setPrimaryImage = (index) => {
    if (index <= 0) return;
    moveImage(index, 0);
  };

  const moveImageUp = (index) => {
    if (index <= 0) return;
    moveImage(index, index - 1);
  };

  const moveImageDown = (index) => {
    if (index >= formData.images.length - 1) return;
    moveImage(index, index + 1);
  };

  const handleFormKeyDown = (e) => {
    // Prevent Enter key from submitting form when in textarea or input fields
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.type !== 'submit') {
      // Allow Enter in textarea
      if (e.target.tagName === 'TEXTAREA') {
        return;
      }
      // Prevent form submission for other inputs
      e.preventDefault();
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
        shipping: {
          weight: formData.shipping?.weight !== '' ? parseFloat(formData.shipping.weight) : undefined,
          dimensions: {
            length: formData.shipping?.dimensions?.length !== '' ? parseFloat(formData.shipping.dimensions.length) : undefined,
            width: formData.shipping?.dimensions?.width !== '' ? parseFloat(formData.shipping.dimensions.width) : undefined,
            height: formData.shipping?.dimensions?.height !== '' ? parseFloat(formData.shipping.dimensions.height) : undefined,
          },
          freeShipping: !!formData.shipping?.freeShipping,
          freeShippingThreshold: formData.shipping?.freeShippingThreshold ? parseFloat(formData.shipping.freeShippingThreshold) : 50,
          standardDelivery: formData.shipping?.standardDelivery || '3-5 business days',
          expressDelivery: formData.shipping?.expressDelivery || '1-2 business days (additional charges apply)',
          internationalShipping: !!formData.shipping?.internationalShipping,
          shippingNotes: formData.shipping?.shippingNotes || undefined
        },
        variants: (formData.variants || [])
          .filter(v => v && v.name && v.name.trim())
          .map(v => ({
            name: v.name.trim(),
            options: (v.options || []).filter(o => o && o.trim()).map(o => o.trim())
          })),
        seo: {
          ...formData.seo,
          metaKeywords: (formData.seo?.metaKeywords || []).filter(k => k && k.trim()).map(k => k.trim())
        },
        images: (formData.images || []).filter(img => img.url && img.url.trim()),
        tags: (formData.tags || []).filter(tag => tag && tag.trim())
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
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-opacity-90 transition-opacity backdrop-blur-sm" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-gradient-to-br from-white to-gray-50 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border border-gray-200">
          <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {product ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    <p className="text-blue-100 text-sm mt-0.5">Create amazing products with premium features</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="bg-white px-6 pt-6 pb-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Basic Information</h4>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter product name"
                      className="mt-1 block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-4 py-2.5 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      placeholder="Describe your product..."
                      className="mt-1 block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-4 py-2.5 transition-all"
                    />
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Pricing</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Price *</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="block w-full rounded-lg border-2 border-green-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-2 border-green-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 px-3 py-2 text-sm transition-all"
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
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Compare Price</label>
                        <input
                          type="number"
                          name="comparePrice"
                          value={formData.comparePrice}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="block w-full rounded-lg border-2 border-green-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-4 py-2.5 transition-all"
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
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Tag className="h-4 w-4 text-purple-600" />
                      <label className="text-sm font-semibold text-purple-800">Product Tags</label>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-all"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        className="flex-1 rounded-l-lg border-2 border-purple-200 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 px-3 py-2 text-sm transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-r-lg hover:from-purple-600 hover:to-pink-600 shadow-md transition-all"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Variants */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg shadow-md">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Product Variants</h4>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newVariantName}
                      onChange={(e) => setNewVariantName(e.target.value)}
                      placeholder="Variant name (e.g., Size)"
                      className="flex-1 rounded-lg border-2 border-gray-200 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 px-4 py-2.5 transition-all"
                    />
                    <button type="button" onClick={addVariant} className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 shadow-md transition-all">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {formData.variants.map((variant, vIndex) => (
                      <div key={vIndex} className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-orange-900">{variant.name}</span>
                          <button type="button" className="text-red-600 hover:text-red-800 font-semibold text-sm hover:bg-red-50 px-2 py-1 rounded-lg transition-all" onClick={() => removeVariant(vIndex)}>
                            Remove
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {variant.options.map((opt, i) => (
                            <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-sm hover:shadow-md transition-all">
                              {opt}
                              <button type="button" className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-all" onClick={() => removeVariantOption(vIndex, opt)}>
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={variantOptionInputs[vIndex] || ''}
                            onChange={(e) => setVariantOptionInputs(prev => ({ ...prev, [vIndex]: e.target.value }))}
                            placeholder="Add option (e.g., M)"
                            className="flex-1 rounded-lg border-2 border-orange-200 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 px-3 py-2 text-sm transition-all"
                          />
                          <button type="button" onClick={() => addVariantOption(vIndex)} className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-lg hover:from-orange-500 hover:to-amber-500 shadow-sm transition-all font-semibold text-sm">
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Images and Inventory */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-md">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Images & Inventory</h4>
                  </div>
                  
                  {/* Images */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-bold text-blue-900 flex items-center space-x-2">
                        <ImageIcon className="h-5 w-5 text-blue-600" />
                        <span>Product Images</span>
                      </label>
                      <span className="text-xs text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded-full">
                        {formData.images.length} {formData.images.length === 1 ? 'Image' : 'Images'}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.images.map((image, index) => (
                        <div key={index} className="bg-white rounded-lg border-2 border-blue-100 p-3 shadow-sm hover:shadow-md transition-all">
                          <div className="flex gap-3">
                            {/* Preview Section */}
                            <div className="relative flex-shrink-0">
                              {image.url ? (
                                <div className="relative group">
                                  <img
                                    src={image.url}
                                    alt={image.alt || 'preview'}
                                    className="w-20 h-20 rounded-lg object-cover border-2 border-blue-200 shadow-sm"
                                    onError={(e) => { 
                                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                                    }}
                                  />
                                  {index === 0 && (
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center space-x-1">
                                      <Star className="h-3 w-3 fill-white" />
                                      <span>Primary</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 flex flex-col items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-blue-400 mb-1" />
                                  <span className="text-[10px] text-blue-500 font-semibold">No Image</span>
                                </div>
                              )}
                            </div>

                            {/* Input Fields */}
                            <div className="flex-1 space-y-2">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <input
                                    type="url"
                                    placeholder="Image URL"
                                    value={image.url}
                                    onChange={(e) => updateImage(index, 'url', e.target.value)}
                                    className="w-full rounded-lg border-2 border-blue-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2 text-sm transition-all"
                                  />
                                </div>
                                <div className="w-32">
                                  <input
                                    type="text"
                                    placeholder="Alt text"
                                    value={image.alt}
                                    onChange={(e) => updateImage(index, 'alt', e.target.value)}
                                    className="w-full rounded-lg border-2 border-blue-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2 text-sm transition-all"
                                  />
                                </div>
                              </div>
                              
                              {/* Color Variant Section */}
                              {(((formData.variants || []).find(v => String(v.name || '').toLowerCase() === 'color')?.options) || []).length > 0 ? (
                                <div className="flex gap-2">
                                  <select
                                    value={image.color || ''}
                                    onChange={(e) => updateImage(index, 'color', e.target.value)}
                                    className="flex-1 rounded-lg border-2 border-blue-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-1.5 text-sm transition-all"
                                    title="Color variant for this image"
                                  >
                                    <option value="">Select Color (optional)</option>
                                    {((formData.variants || []).find(v => String(v.name || '').toLowerCase() === 'color')?.options || []).map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Color (optional)"
                                    value={image.color || ''}
                                    onChange={(e) => updateImage(index, 'color', e.target.value)}
                                    className="flex-1 rounded-lg border-2 border-blue-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-1.5 text-sm transition-all"
                                    title="Type a color and click Create to add as a Color variant"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const val = String(image.color || '').trim();
                                      if (!val) return;
                                      ensureColorVariant(val);
                                      toast.success('Color added');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 font-semibold shadow-sm transition-all"
                                  >
                                    Create
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-1">
                              <button 
                                type="button" 
                                onClick={() => setPrimaryImage(index)} 
                                disabled={index === 0} 
                                className="p-2 rounded-lg hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
                                title="Set as primary"
                              >
                                <Star className={`h-4 w-4 ${index === 0 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => moveImageUp(index)} 
                                disabled={index === 0} 
                                className="p-2 rounded-lg hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
                                title="Move up"
                              >
                                <ArrowUp className="h-4 w-4 text-blue-600" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => moveImageDown(index)} 
                                disabled={index === formData.images.length - 1} 
                                className="p-2 rounded-lg hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
                                title="Move down"
                              >
                                <ArrowDown className="h-4 w-4 text-blue-600" />
                              </button>
                              {formData.images.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-all"
                                  title="Remove image"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addImage}
                      className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 shadow-md transition-all font-semibold text-sm inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Image</span>
                    </button>
                  </div>

                  {/* Inventory */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Package className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-semibold text-indigo-800">Inventory Management</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Stock *</label>
                        <input
                          type="number"
                          name="inventory.stock"
                          value={formData.inventory.stock}
                          onChange={handleInputChange}
                          required
                          min="0"
                          placeholder="0"
                          className="block w-full rounded-lg border-2 border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">SKU</label>
                        <input
                          type="text"
                          name="inventory.sku"
                          value={formData.inventory.sku}
                          onChange={handleInputChange}
                          placeholder="SKU-001"
                          className="block w-full rounded-lg border-2 border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Low Stock Threshold</label>
                      <input
                        type="number"
                        name="inventory.lowStockThreshold"
                        value={formData.inventory.lowStockThreshold}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="10"
                        className="block w-full rounded-lg border-2 border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-3 py-2 text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Shipping */}
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-xl border-2 border-teal-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Package className="h-4 w-4 text-teal-600" />
                      <span className="text-sm font-semibold text-teal-800">Shipping Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          name="shipping.weight"
                          value={formData.shipping.weight}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.0"
                          className="block w-full rounded-lg border-2 border-teal-200 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Length (cm)</label>
                        <input
                          type="number"
                          name="shipping.dimensions.length"
                          value={formData.shipping.dimensions.length}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.0"
                          className="block w-full rounded-lg border-2 border-teal-200 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Width (cm)</label>
                        <input
                          type="number"
                          name="shipping.dimensions.width"
                          value={formData.shipping.dimensions.width}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.0"
                          className="block w-full rounded-lg border-2 border-teal-200 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Height (cm)</label>
                        <input
                          type="number"
                          name="shipping.dimensions.height"
                          value={formData.shipping.dimensions.height}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.0"
                          className="block w-full rounded-lg border-2 border-teal-200 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                    </div>
                    
                    {/* Shipping Information */}
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Free Shipping Threshold ($)</label>
                        <input
                          type="number"
                          name="shipping.freeShippingThreshold"
                          value={formData.shipping.freeShippingThreshold}
                          onChange={handleInputChange}
                          min="0"
                          step="1"
                          placeholder="50"
                          className="block w-full rounded-lg border-2 border-teal-200 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Standard Delivery</label>
                        <input
                          type="text"
                          name="shipping.standardDelivery"
                          value={formData.shipping.standardDelivery}
                          onChange={handleInputChange}
                          placeholder="3-5 business days"
                          className="block w-full rounded-lg border-2 border-teal-200 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Express Delivery</label>
                        <input
                          type="text"
                          name="shipping.expressDelivery"
                          value={formData.shipping.expressDelivery}
                          onChange={handleInputChange}
                          placeholder="1-2 business days (additional charges apply)"
                          className="block w-full rounded-lg border-2 border-teal-200 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Shipping Notes (optional)</label>
                        <textarea
                          name="shipping.shippingNotes"
                          value={formData.shipping.shippingNotes}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Additional shipping information..."
                          className="block w-full rounded-lg border-2 border-teal-200 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm transition-all"
                        />
                      </div>
                      <label className="flex items-center p-2 rounded-lg hover:bg-teal-100/50 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          name="shipping.internationalShipping"
                          checked={formData.shipping.internationalShipping}
                          onChange={handleInputChange}
                          className="rounded border-2 border-teal-300 text-teal-600 shadow-sm focus:border-teal-400 focus:ring focus:ring-teal-200 focus:ring-opacity-50 w-5 h-5"
                        />
                        <span className="ml-3 text-sm font-semibold text-gray-700">International Shipping Available</span>
                      </label>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border-2 border-yellow-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Award className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-800">Product Status</span>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center p-2 rounded-lg hover:bg-yellow-100/50 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          name="shipping.freeShipping"
                          checked={formData.shipping.freeShipping}
                          onChange={handleInputChange}
                          className="rounded border-2 border-yellow-300 text-yellow-600 shadow-sm focus:border-yellow-400 focus:ring focus:ring-yellow-200 focus:ring-opacity-50 w-5 h-5"
                        />
                        <span className="ml-3 text-sm font-semibold text-gray-700">Free Shipping</span>
                      </label>
                      <label className="flex items-center p-2 rounded-lg hover:bg-yellow-100/50 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          name="featured"
                          checked={formData.featured}
                          onChange={handleInputChange}
                          className="rounded border-2 border-yellow-300 text-yellow-600 shadow-sm focus:border-yellow-400 focus:ring focus:ring-yellow-200 focus:ring-opacity-50 w-5 h-5"
                        />
                        <div className="ml-3 flex items-center space-x-2">
                          <span className="text-sm font-semibold text-gray-700">Featured Product</span>
                          <Star className="h-4 w-4 text-yellow-500" />
                        </div>
                      </label>
                      <label className="flex items-center p-2 rounded-lg hover:bg-yellow-100/50 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="rounded border-2 border-yellow-300 text-yellow-600 shadow-sm focus:border-yellow-400 focus:ring focus:ring-yellow-200 focus:ring-opacity-50 w-5 h-5"
                        />
                        <span className="ml-3 text-sm font-semibold text-gray-700">Active Product</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="mt-6 bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-xl border-2 border-rose-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-2 rounded-lg shadow-md">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">SEO Optimization</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Title</label>
                  <input
                    type="text"
                    name="seo.metaTitle"
                    value={formData.seo.metaTitle}
                    onChange={handleInputChange}
                    placeholder="SEO optimized title"
                    className="mt-1 block w-full rounded-lg border-2 border-rose-200 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 px-4 py-2.5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Description</label>
                  <textarea
                    name="seo.metaDescription"
                    value={formData.seo.metaDescription}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="SEO meta description"
                    className="mt-1 block w-full rounded-lg border-2 border-rose-200 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 px-4 py-2.5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Keywords</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.seo.metaKeywords.map((kw, i) => (
                      <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-all">
                        {kw}
                        <button type="button" className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-all" onClick={() => removeKeyword(kw)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add keyword"
                      className="flex-1 rounded-l-lg border-2 border-rose-200 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 px-3 py-2 text-sm transition-all"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <button type="button" onClick={addKeyword} className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-r-lg hover:from-rose-600 hover:to-pink-600 shadow-md transition-all">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:flex sm:flex-row-reverse border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-base font-bold text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Award className="h-5 w-5 mr-2" />
                    {product ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:ml-3 sm:w-auto transition-all"
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
