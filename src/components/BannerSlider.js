import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bannersAPI } from '../services/api';

const BannerSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [banners, setBanners] = useState([]);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await bannersAPI.getAll();
        if (response.data.banners && response.data.banners.length > 0) {
          setBanners(response.data.banners);
        } else {
          // Fallback to default banners if none exist
          setBanners([
            {
              _id: 1,
              title: "Summer Collection 2025",
              subtitle: "New Arrivals",
              description: "Discover the latest trends in fashion",
              buttonText: "Shop Now",
              buttonLink: "/products",
              bgColor: "from-blue-600 to-blue-800",
              image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"
            },
            {
              _id: 2,
              title: "Special Offer",
              subtitle: "Up to 50% Off",
              description: "Limited time deals on selected items",
              buttonText: "View Deals",
              buttonLink: "/products?sort=-comparePrice",
              bgColor: "from-purple-600 to-purple-800",
              image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=600&fit=crop"
            },
            {
              _id: 3,
              title: "Men's Collection",
              subtitle: "Style & Comfort",
              description: "Premium quality t-shirts and more",
              buttonText: "Explore",
              buttonLink: "/products?category=man",
              bgColor: "from-green-600 to-green-800",
              image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&h=600&fit=crop"
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
        // Fallback to default banners on error
        setBanners([
          {
            _id: 1,
            title: "Summer Collection 2025",
            subtitle: "New Arrivals",
            description: "Discover the latest trends in fashion",
            buttonText: "Shop Now",
            buttonLink: "/products",
            bgColor: "from-blue-600 to-blue-800",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"
          }
        ]);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, banners.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  return (
    <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden -mx-2 sm:mx-0">
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={banner._id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide
              ? 'opacity-100 translate-x-0'
              : index < currentSlide
              ? 'opacity-0 -translate-x-full'
              : 'opacity-0 translate-x-full'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0 bg-gray-100">
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/1200x600/4F46E5/ffffff?text=Banner';
              }}
            />
            {/* Only show overlay if there's text content */}
            {(banner.title || banner.subtitle || banner.description) && (
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor} opacity-80`}></div>
            )}
          </div>

          {/* Content - Only show if there's text */}
          {(banner.title || banner.subtitle || banner.description) && (
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl text-white">
                  {banner.subtitle && (
                    <p className="text-xs sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 uppercase tracking-wide animate-fade-in">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.title && (
                    <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 animate-slide-up">
                      {banner.title}
                    </h1>
                  )}
                  {banner.description && (
                    <p className="text-sm sm:text-lg md:text-xl mb-3 sm:mb-6 md:mb-8 animate-fade-in-delay">
                      {banner.description}
                    </p>
                  )}
                  {banner.buttonText && banner.buttonLink && (
                    <Link
                      to={banner.buttonLink}
                      className="inline-block bg-white text-gray-900 px-4 sm:px-8 py-2 sm:py-3 md:py-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-100 transition transform hover:scale-105 animate-fade-in-delay-2"
                    >
                      {banner.buttonText}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Dots Indicator */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 sm:space-x-3 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white w-6 sm:w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
