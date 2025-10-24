import React, { useEffect, useState, useCallback } from 'react';
import { productsAPI, categoriesAPI } from '../../services/api';
import { Plus, Edit, Trash2, Search, Eye, Star, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/admin/AdminLayout';
import ProductModal from '../../components/admin/ProductModal';
import ProductPreviewModal from '../../components/admin/ProductPreviewModal';
import { formatPrice } from '../../utils/currency';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        category: selectedCategory,
        sort: sortBy
      };
      console.log('Fetching products with params:', params);
      const response = await productsAPI.getAll(params);
      console.log('Products response:', response.data);
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const toggleFeatured = async (productId, currentFeatured) => {
    try {
      await productsAPI.toggleFeatured(productId);
      toast.success(`Product ${currentFeatured ? 'removed from' : 'added to'} featured`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handlePreviewProduct = (product) => {
    setSelectedProduct(product);
    setShowPreviewModal(true);
  };

  const handleModalSuccess = () => {
    fetchProducts();
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const handleCloseModal = () => {
    setShowProductModal(false);
    setShowPreviewModal(false);
    setSelectedProduct(null);
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
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-2 text-sm text-gray-600">Manage your product catalog</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={handleAddProduct}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 flex items-center transition-all shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt">Newest First</option>
              <option value="-createdAt">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="-name">Name Z-A</option>
              <option value="price">Price Low-High</option>
              <option value="-price">Price High-Low</option>
            </select>
            <div className="flex items-center text-sm text-gray-600">
              <Package className="h-4 w-4 mr-1" />
              {products.length} products
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <img
                            src={product.images[0]?.url || 'https://via.placeholder.com/64'}
                            alt={product.name}
                            className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                          {product.featured && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      <div className="font-semibold">{formatPrice(product.price, product.currency)}</div>
                      {product.comparePrice && (
                        <div className="text-xs text-gray-500 line-through">{formatPrice(product.comparePrice, product.currency)}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      <div className={`font-medium ${
                        product.inventory.stock <= product.inventory.lowStockThreshold 
                          ? 'text-red-600' 
                          : product.inventory.stock <= 20 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                      }`}>
                        {product.inventory.stock}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.inventory.stock <= product.inventory.lowStockThreshold 
                          ? 'Low Stock' 
                          : product.inventory.stock <= 20 
                          ? 'Medium Stock' 
                          : 'In Stock'
                        }
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handlePreviewProduct(product)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"
                          title="Preview Product"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="text-indigo-600 hover:text-indigo-800 p-1 rounded-md hover:bg-indigo-50"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleFeatured(product._id, product.featured)}
                          className={`p-1 rounded-md ${
                            product.featured 
                              ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50' 
                              : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                          }`}
                          title={product.featured ? 'Remove from Featured' : 'Add to Featured'}
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                          title="Delete Product"
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={showProductModal}
        onClose={handleCloseModal}
        product={selectedProduct}
        onSuccess={handleModalSuccess}
      />

      <ProductPreviewModal
        isOpen={showPreviewModal}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </AdminLayout>
  );
};

export default Products;
