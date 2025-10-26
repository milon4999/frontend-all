import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Truck, Tag } from 'lucide-react';
import { categoriesAPI } from '../services/api';

const CategorySlider = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
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
    fetchCategories();
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-4 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-2 sm:py-6 border-t border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h2 className="text-base sm:text-xl font-bold text-gray-900">Categories</h2>
          <Link 
            to="/products" 
            className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-semibold flex items-center"
          >
            See more <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
          </Link>
        </div>

        {/* Categories Slider */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex space-x-3 sm:space-x-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-1 sm:pb-2 -mx-3 px-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[{ _id: 'all', name: 'All' }, ...categories].map((category) => (
              <Link
                key={category._id}
                to={category._id === 'all' ? '/products' : `/products?category=${category._id}`}
                className="flex-shrink-0 group snap-start"
                aria-label={`Browse ${category.name}`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-1 ring-gray-200 bg-white flex items-center justify-center mb-1 sm:mb-2 transition-all duration-300 group-hover:ring-primary-300 group-hover:shadow-md overflow-hidden">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                        className="w-full h-full object-contain object-center p-2 select-none"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 items-center justify-center text-primary-600 hidden"
                      style={{ display: category.image ? 'none' : 'flex' }}
                    >
                      <span className="text-lg sm:text-2xl font-bold">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] sm:text-sm font-medium text-gray-700 text-center max-w-[70px] sm:max-w-[90px] truncate">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent md:hidden"></div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent md:hidden"></div>

          {/* Scroll Buttons - Hidden on mobile, visible on desktop */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition z-10"
            aria-label="Scroll left"
          >
            <ChevronRight className="h-5 w-5 rotate-180 text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition z-10"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Features Row */}
        <div className="flex items-center justify-around mt-2 sm:mt-6 pt-2 sm:pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-1 sm:space-x-2 group cursor-pointer">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-2 rounded-xl ring-1 ring-orange-100 group-hover:ring-orange-300 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:animate-pulse">
              <Truck className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <span className="text-[10px] sm:text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors duration-300">Free Delivery</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 group cursor-pointer">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-xl ring-1 ring-blue-100 group-hover:ring-blue-300 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:animate-pulse">
              <Tag className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
            </div>
            <span className="text-[10px] sm:text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300">Best Discount</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySlider;
