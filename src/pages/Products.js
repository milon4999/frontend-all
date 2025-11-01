import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Filter } from 'lucide-react';
import { fetchProducts, fetchMoreProducts } from '../store/slices/productSlice';
import { categoriesAPI } from '../services/api';
import { formatPrice } from '../utils/currency';
import { buildCacheKey } from '../utils/cache';
import { setScrollPosition } from '../store/slices/productSlice';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, totalPages, currentPage, listCache, scrollYByKey } = useSelector((state) => state.products);

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
    // Reset to page 1 when filters change, but use cache if fresh to avoid flicker and extra requests
    const key = buildCacheKey({ ...filters, page: 1 });
    const cached = listCache[key];
    const CACHE_TTL_MS = 1000 * 60 * 5;
    const fresh = cached && Date.now() - cached.timestamp < CACHE_TTL_MS;

    if (!fresh) {
      dispatch(fetchProducts({ ...filters, page: 1 }));
    } else {
      // If fresh, restore scroll position asynchronously
      const y = scrollYByKey[key] || 0;
      if (y > 0) {
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.search, filters.category, filters.minPrice, filters.maxPrice, filters.sort, filters.featured]);

  // Save scroll position on unmount
  useEffect(() => {
    const key = buildCacheKey({ ...filters, page: 1 });
    return () => {
      try {
        dispatch(setScrollPosition({ key, y: window.scrollY }));
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.category, filters.minPrice, filters.maxPrice, filters.sort, filters.featured]);

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
    <div className="max-w-full mx-auto px-1 sm:px-4 lg:px-6 py-6 lg:py-10">
      <div className="flex justify-between items-center mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-1">Products</h1>
          <p className="text-sm sm:text-base text-gray-600">Discover our latest collection</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center space-x-2 px-4 py-2.5 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors shadow-md"
        >
          <Filter className="h-5 w-5" />
          <span className="font-medium">Filters</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
        {/* Filters Sidebar */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 lg:w-72 space-y-6`}>
          <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">Filters</h2>
              <button onClick={clearFilters} className="text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors">
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3 text-sm lg:text-base">Category</h3>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all bg-gray-50 hover:bg-white font-medium text-sm"
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
              <h3 className="font-bold text-gray-900 mb-3 text-sm lg:text-base">Price Range</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all bg-gray-50 hover:bg-white font-medium text-sm"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all bg-gray-50 hover:bg-white font-medium text-sm"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm lg:text-base">Sort By</h3>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all bg-gray-50 hover:bg-white font-medium text-sm"
              >
                <option value="-createdAt">Newest First</option>
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-3 lg:gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-80 sm:h-96 animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-3 lg:gap-3">
                {products.map((product) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-pink-200 hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                  >
                    <div className="relative h-48 sm:h-56 lg:h-72 xl:h-80 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                      <img
                        src={product.images[0]?.url || 'https://via.placeholder.com/300'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      {product.comparePrice && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-sm sm:text-base font-extrabold shadow-xl">
                          {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                        </div>
                      )}
                      {product.inventory.stock === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white font-bold text-base sm:text-lg bg-red-600 px-5 py-2.5 rounded-xl shadow-lg">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 lg:p-5 flex flex-col flex-grow bg-white">
                      <h3 className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] leading-tight mb-0 sm:mb-3">{product.name}</h3>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center">
                          <div className="flex items-center bg-yellow-50 border border-yellow-100 px-2.5 py-1 rounded-lg">
                            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500" />
                            <span className="ml-1.5 text-xs sm:text-sm font-bold text-gray-800">
                              {product.ratings.average.toFixed(1)}
                            </span>
                          </div>
                          <span className="ml-2 text-xs sm:text-sm text-gray-500 font-medium">
                            ({product.ratings.count})
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          {product.sales || 0} sold
                        </span>
                      </div>
                      
                      <div className="mt-auto pt-2 border-t border-gray-100">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-pink-600">{formatPrice(product.price, product.currency)}</span>
                          {product.comparePrice && (
                            <span className="text-xs sm:text-sm text-gray-400 line-through font-medium">
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
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-3 lg:gap-3 mt-3 sm:mt-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-xl h-80 sm:h-96 animate-pulse"></div>
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
