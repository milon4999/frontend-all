import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Filter } from 'lucide-react';
import { fetchProducts, fetchMoreProducts } from '../store/slices/productSlice';
import { categoriesAPI } from '../services/api';
import { formatPrice } from '../utils/currency';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, totalPages, currentPage } = useSelector((state) => state.products);

  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || '-createdAt',
    page: searchParams.get('page') || 1,
    featured: searchParams.get('featured') || ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll();
        setCategories(response.data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset to page 1 when filters change
    dispatch(fetchProducts({ ...filters, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.search, filters.category, filters.minPrice, filters.maxPrice, filters.sort, filters.featured]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // Load more when user is 300px from bottom
      if (scrollHeight - scrollTop - clientHeight < 300 && !loading && !loadingMore && currentPage < totalPages) {
        setLoadingMore(true);
        dispatch(fetchMoreProducts({ ...filters, page: currentPage + 1 }))
          .finally(() => setLoadingMore(false));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, currentPage, totalPages, filters, dispatch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    const params = {};
    Object.keys(newFilters).forEach(k => {
      if (newFilters[k]) params[k] = newFilters[k];
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: '-createdAt',
      page: 1
    });
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center space-x-2 px-4 py-2 border rounded-lg"
        >
          <Filter className="h-5 w-5" />
          <span>Filters</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 space-y-6`}>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700">
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Category</h3>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Price Range</h3>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="font-semibold mb-3">Sort By</h3>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="-createdAt">Newest</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-ratings.average">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {loading && currentPage === 1 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-96 animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {products.map((product) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group"
                  >
                    <div className="relative h-48 sm:h-64 overflow-hidden">
                      <img
                        src={product.images[0]?.url || 'https://via.placeholder.com/300'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                      {product.comparePrice && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                          Sale
                        </span>
                      )}
                      {product.inventory.stock === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2 sm:p-4">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 sm:mb-2 truncate">{product.name}</h3>
                      <p className="hidden sm:block text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center mb-1 sm:mb-2">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-xs sm:text-sm text-gray-600">
                          {product.ratings.average.toFixed(1)} ({product.ratings.count})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-base sm:text-xl font-bold text-pink-600">{formatPrice(product.price, product.currency)}</span>
                          {product.comparePrice && (
                            <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500 line-through">
                              {formatPrice(product.comparePrice, product.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mt-3 sm:mt-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-96 animate-pulse"></div>
                  ))}
                </div>
              )}

              {/* End of Products Message */}
              {!loading && !loadingMore && currentPage >= totalPages && products.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">You've reached the end</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
