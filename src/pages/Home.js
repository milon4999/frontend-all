import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Shield, Truck, ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';
import { productsAPI } from '../services/api';
import BannerSlider from '../components/BannerSlider';
import CategorySlider from '../components/CategorySlider';
import { formatPrice } from '../utils/currency';
import { getAdminSettings } from '../utils/settings';
import '../debug'; // Import debug logging

const HOME_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
const homeCacheStore = {
  data: null,
  timestamp: 0,
};

const getHomeCache = () => {
  if (!homeCacheStore.data) return null;
  if (Date.now() - homeCacheStore.timestamp > HOME_CACHE_TTL_MS) {
    homeCacheStore.data = null;
    return null;
  }
  return homeCacheStore.data;
};

const updateHomeCache = (data) => {
  homeCacheStore.data = {
    featuredProducts: [],
    topSaleProducts: [],
    latestProducts: [],
    latestPage: 1,
    hasMoreLatest: true,
    ...(homeCacheStore.data || {}),
    ...data,
  };
  homeCacheStore.timestamp = Date.now();
};

const Home = () => {
  const storeCurrency = getAdminSettings()?.currency || 'USD';
  const cachedHome = getHomeCache();
  const [featuredProducts, setFeaturedProducts] = useState(cachedHome?.featuredProducts || []);
  const [topSaleProducts, setTopSaleProducts] = useState(cachedHome?.topSaleProducts || []);
  const [latestProducts, setLatestProducts] = useState(cachedHome?.latestProducts || []);
  const [loading, setLoading] = useState(!cachedHome);
  const [saleLoading, setSaleLoading] = useState(!cachedHome);
  const [latestLoading, setLatestLoading] = useState(!cachedHome);
  const [latestPage, setLatestPage] = useState(cachedHome?.latestPage || 1);
  const [hasMoreLatest, setHasMoreLatest] = useState(
    cachedHome?.hasMoreLatest !== undefined ? cachedHome.hasMoreLatest : true
  );
  const [loadingMore, setLoadingMore] = useState(false);

  const initialCacheRef = useRef(cachedHome);

  useEffect(() => {
    let active = true;

    const fetchData = async (showSkeleton) => {
      if (showSkeleton) {
        setLoading(true);
        setSaleLoading(true);
        setLatestLoading(true);
      }

      try {
        console.log('Fetching products from:', process.env.REACT_APP_API_URL);

        const productsRes = await productsAPI.getAll({ featured: true, limit: 8 });
        console.log('API Response:', productsRes);
        console.log('Products data:', productsRes.data);
        const featured = productsRes.data.products;

        // Fetch products sorted by sales count for Top Sale section
        const saleProductsRes = await productsAPI.getAll({ sort: '-sales', limit: 50 });
        const saleFiltered = saleProductsRes.data.products.filter(
          (product) => product.comparePrice && Number(product.comparePrice) > Number(product.price)
        );
        const topSale = saleFiltered.slice(0, 10);

        const latestProductsRes = await productsAPI.getAll({ sort: '-createdAt', limit: 10, page: 1 });
        const latest = latestProductsRes.data.products;
        const hasMore = latest.length === 10;

        if (!active) return;

        setFeaturedProducts(featured);
        setTopSaleProducts(topSale);
        setLatestProducts(latest);
        setHasMoreLatest(hasMore);
        setLatestPage(1);

        updateHomeCache({
          featuredProducts: featured,
          topSaleProducts: topSale,
          latestProducts: latest,
          latestPage: 1,
          hasMoreLatest: hasMore,
        });
      } catch (error) {
        if (!active) return;
        console.error('Error fetching data:', error);
        console.error('Error details:', error.response?.data);
      } finally {
        if (!active) return;
        setLoading(false);
        setSaleLoading(false);
        setLatestLoading(false);
      }
    };

    fetchData(!initialCacheRef.current);

    return () => {
      active = false;
    };
  }, []);

  // Scroll functions for top sale products
  const scrollSaleProducts = (direction) => {
    const container = document.getElementById('sale-products-container');
    const scrollAmount = 300; // Adjust scroll distance
    
    if (container) {
      const newScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Scroll functions for featured products
  const scrollFeaturedProducts = (direction) => {
    const container = document.getElementById('featured-products-container');
    const scrollAmount = 300; // Adjust scroll distance
    
    if (container) {
      const newScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Load more latest products
  const loadMoreLatestProducts = useCallback(async () => {
    if (loadingMore || !hasMoreLatest) return;
    
    setLoadingMore(true);
    try {
      const nextPage = latestPage + 1;
      const response = await productsAPI.getAll({ 
        sort: '-createdAt',
        limit: 10,
        page: nextPage
      });
      
      if (response.data.products.length > 0) {
        setLatestProducts((prev) => {
          const merged = [...prev, ...response.data.products];
          updateHomeCache({
            latestProducts: merged,
            latestPage: nextPage,
            hasMoreLatest: response.data.products.length === 10,
          });
          return merged;
        });
        setLatestPage(nextPage);
        setHasMoreLatest(response.data.products.length === 10);
      } else {
        setHasMoreLatest(false);
        updateHomeCache({ hasMoreLatest: false });
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreLatest, latestPage, loadingMore]);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // Load more when user is 300px from bottom
      if (scrollHeight - scrollTop - clientHeight < 300 && hasMoreLatest && !loadingMore) {
        loadMoreLatestProducts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMoreLatest, loadingMore, latestPage, loadMoreLatestProducts]);

  return (
    <div>
      {/* Hero Banner Slider */}
      <BannerSlider />

      {/* Category Slider - Below Banner */}
      <CategorySlider />

      {/* Top Sale Products Section */}
      <section className="py-4 md:py-12 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-full mr-3">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top Sale</h2>
                <p className="text-sm text-gray-600">Limited time offers</p>
              </div>
            </div>
            
            {/* Navigation Buttons - Hidden on mobile */}
            <div className="hidden md:flex space-x-2">
              <button
                onClick={() => scrollSaleProducts('left')}
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => scrollSaleProducts('right')}
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Products Horizontal Scroll Container */}
          {saleLoading ? (
            <div className="flex space-x-1 md:space-x-3 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-32 sm:w-64 bg-gray-200 rounded-lg h-52 sm:h-80 animate-pulse"></div>
              ))}
            </div>
          ) : topSaleProducts.length > 0 ? (
            <div 
              id="sale-products-container"
              className="flex space-x-1 md:space-x-3 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {topSaleProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="flex-shrink-0 w-32 sm:w-64 bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group border border-gray-100"
                >
                  <div className="relative h-24 sm:h-48 overflow-hidden bg-gray-100">
                    <img
                      src={product.images[0]?.url || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Sale Badge */}
                    {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[8px] sm:text-xs font-bold shadow-lg">
                        -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                      </div>
                    )}
                    
                    {/* Hot Sale Badge */}
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[8px] sm:text-xs font-bold flex items-center shadow-lg animate-pulse">
                        <Flame className="h-2 w-2 sm:h-3 sm:w-3" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 sm:p-4 flex flex-col h-[90px] sm:h-auto">
                    {/* Product Name */}
                    <h3 className="font-bold text-gray-800 mb-1 sm:mb-2 text-[10px] sm:text-base leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    {/* Rating & Sales */}
                    <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                      <div className="flex items-center gap-0.5 sm:gap-1 bg-yellow-50 px-1 sm:px-1.5 py-0.5 rounded">
                        <Star className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-yellow-500 fill-current flex-shrink-0" />
                        <span className="text-[8px] sm:text-xs font-semibold text-gray-700">
                          {product.ratings.average.toFixed(1)} <span className="text-gray-500">({product.ratings.count})</span>
                        </span>
                      </div>
                      <span className="text-[8px] sm:text-xs text-gray-500 font-medium">
                        {product.sales || 0} sold
                      </span>
                    </div>
                    
                    {/* Price Section */}
                    <div className="mt-auto pt-1 sm:pt-2 border-t border-gray-100">
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-sm sm:text-2xl font-bold text-pink-600 leading-none">{formatPrice(product.price, product.currency)}</span>
                        <span className="text-[8px] sm:text-sm text-gray-400 line-through leading-none">
                          {formatPrice(product.comparePrice, product.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No sale products available</p>
            </div>
          )}
        </div>
      </section>

      {/* Features - Hidden on mobile, shown on desktop */}
      <section className="hidden md:block py-12 bg-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Truck className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Shipping</h3>
              <p className="text-gray-600">On orders over {formatPrice(50, storeCurrency)}</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">100% secure transactions</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <TrendingUp className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Quality</h3>
              <p className="text-gray-600">Top-rated products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-4 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-3 md:mb-12">
            <div className="flex items-center">
              <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
              <div className="hidden md:flex ml-4 space-x-2">
                <button
                  onClick={() => scrollFeaturedProducts('left')}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full shadow-md hover:shadow-lg hover:bg-gray-200 transition-all"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => scrollFeaturedProducts('right')}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full shadow-md hover:shadow-lg hover:bg-gray-200 transition-all"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            <Link to="/products?featured=true" className="text-primary-600 hover:text-primary-700 font-semibold">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="flex space-x-1 md:space-x-3 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-32 sm:w-64 bg-gray-200 rounded-lg h-52 sm:h-80 animate-pulse"></div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div 
              id="featured-products-container"
              className="flex space-x-1 md:space-x-3 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {featuredProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="flex-shrink-0 w-32 sm:w-64 bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group border border-gray-100"
                >
                  <div className="relative h-24 sm:h-48 overflow-hidden bg-gray-100">
                    <img
                      src={product.images[0]?.url || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {product.comparePrice && Number(product.comparePrice) > Number(product.price) && Number(product.comparePrice) > 0 && (
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[8px] sm:text-xs font-bold shadow-lg">
                        -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2 sm:p-4 flex flex-col h-[90px] sm:h-auto">
                    {/* Product Name */}
                    <h3 className="font-bold text-gray-800 mb-1 sm:mb-2 text-[10px] sm:text-base leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    {/* Rating & Sales */}
                    <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                      <div className="flex items-center gap-0.5 sm:gap-1 bg-yellow-50 px-1 sm:px-1.5 py-0.5 rounded">
                        <Star className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-yellow-500 fill-current flex-shrink-0" />
                        <span className="text-[8px] sm:text-xs font-semibold text-gray-700">
                          {product.ratings.average.toFixed(1)} <span className="text-gray-500">({product.ratings.count})</span>
                        </span>
                      </div>
                      <span className="text-[8px] sm:text-xs text-gray-500 font-medium">
                        {product.sales || 0} sold
                      </span>
                    </div>
                    
                    {/* Price Section */}
                    <div className="mt-auto pt-1 sm:pt-2 border-t border-gray-100">
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-sm sm:text-2xl font-bold text-pink-600 leading-none">{formatPrice(product.price, product.currency)}</span>
                        {product.comparePrice && (
                          <span className="text-[8px] sm:text-sm text-gray-400 line-through leading-none">
                            {formatPrice(product.comparePrice, product.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No featured products available</p>
              <p className="text-gray-400 text-sm mt-2">Check console for API errors</p>
            </div>
          )}
        </div>
      </section>

      {/* Latest Products */}
      <section className="py-4 md:py-16 bg-gradient-to-r from-blue-50 to-indigo-50 pb-8">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-3 md:mb-12">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full mr-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Latest Products</h2>
                <p className="text-sm text-gray-600">Just arrived</p>
              </div>
            </div>
            <Link to="/products?sort=-createdAt" className="text-blue-600 hover:text-blue-700 font-semibold text-sm md:text-base">
              View All →
            </Link>
          </div>

          {/* Products Grid Container */}
          {latestLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 md:h-80 animate-pulse"></div>
              ))}
            </div>
          ) : latestProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {latestProducts.map((product) => (
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
                    {product.comparePrice && Number(product.comparePrice) > Number(product.price) && Number(product.comparePrice) > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                        -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="p-2 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 sm:mb-2 truncate">{product.name}</h3>
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <div className="flex items-center">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-xs sm:text-sm text-gray-600">
                          {product.ratings.average.toFixed(1)} ({product.ratings.count})
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-500">{product.sales || 0} sold</span>
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
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mt-3 md:mt-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-64 md:h-80 animate-pulse"></div>
                  ))}
                </div>
              )}
              
              {/* End of Products Message */}
              {!hasMoreLatest && latestProducts.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">You've reached the end</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No latest products available</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Hidden on mobile */}
      <section className="hidden md:block bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-xl mb-8">Join thousands of satisfied customers</p>
          <Link
            to="/register"
            className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
