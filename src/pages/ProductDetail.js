import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, ShoppingCart, Heart, Share2, Shield, Truck, RotateCcw, ChevronRight, Plus, Minus, Check, Info, Tag, Package, X, ArrowLeft, ChevronLeft, Zap } from 'lucide-react';
import { fetchProductById } from '../store/slices/productSlice';
import { productsAPI, reviewsAPI } from '../services/api';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist } from '../store/slices/wishlistSlice';
import { toast } from 'react-toastify';
import { formatPrice } from '../utils/currency';
import { useSwipe } from '../hooks/useSwipe';
import CollapsibleSection from '../components/common/CollapsibleSection';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentProduct: product, loading } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [openSection, setOpenSection] = useState('description');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [eligibility, setEligibility] = useState({ canReview: false, reason: '' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const DESCRIPTION_CHAR_LIMIT = 300;
  const REVIEW_PAGE_LIMIT = 6;

  const displayedAverage = Number(reviewStats.average || product?.ratings?.average || 0);
  const displayedCount = Number(reviewStats.count || product?.ratings?.count || 0);
  const roundedAverage = Math.floor(displayedAverage);

  const { 
    currentIndex: currentImageIndex, 
    setCurrentIndex: setSelectedImageIndex, 
    ...swipeHandlers 
  } = useSwipe(product?.images?.length || 0);

  useEffect(() => {
    // Scroll to top immediately when component mounts or product ID changes
    window.scrollTo(0, 0);
    
    dispatch(fetchProductById(id));
    
    // Fetch recommended products
    const fetchRecommended = async () => {
      try {
        setRecommendedLoading(true);
        const response = await productsAPI.getAll({ 
          sort: '-ratings.average',
          limit: 10 
        });
        const uniqueProducts = [];
        const seenIds = new Set();
        (response.data.products || []).forEach((item) => {
          const itemId = String(item?._id || '').trim();
          if (!itemId || itemId === String(id) || seenIds.has(itemId)) return;
          seenIds.add(itemId);
          uniqueProducts.push(item);
        });
        setRecommendedProducts(uniqueProducts);
      } catch (error) {
        console.error('Error fetching recommended products:', error);
      } finally {
        setRecommendedLoading(false);
      }
    };
    
    fetchRecommended();
  }, [dispatch, id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      setReviewsLoading(true);
      try {
        const [reviewsRes, eligibilityRes] = await Promise.all([
          reviewsAPI.getByProduct(id, { limit: REVIEW_PAGE_LIMIT }),
          isAuthenticated ? reviewsAPI.checkEligibility(id) : Promise.resolve({ data: { success: false, canReview: false } })
        ]);

        if (reviewsRes?.data?.success) {
          setReviews(reviewsRes.data.reviews || []);
          setReviewStats((prev) => ({
            average: prev.average,
            count: typeof reviewsRes.data.total === 'number' ? reviewsRes.data.total : prev.count
          }));
        }

        if (eligibilityRes?.data) {
          setEligibility({
            canReview: Boolean(eligibilityRes.data.canReview),
            reason: eligibilityRes.data.message || ''
          });
        } else {
          setEligibility({ canReview: false, reason: '' });
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id, isAuthenticated, product?.ratings?.average]);

  const ratingBreakdown = useMemo(() => {
    if (!reviews?.length) return [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const index = Math.max(1, Math.min(5, Math.round(r.rating))) - 1;
      counts[index] += 1;
    });
    return counts.reverse();
  }, [reviews]);

  useEffect(() => {
    if (product?.ratings) {
      setReviewStats((prev) => ({
        average: typeof product.ratings.average === 'number' ? product.ratings.average : prev.average,
        count: typeof product.ratings.count === 'number' ? product.ratings.count : prev.count
      }));
    }
  }, [product?.ratings?.average, product?.ratings?.count]);

  const handleReviewInputChange = (field, value) => {
    setReviewForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!product || !eligibility.canReview) {
      toast.error(eligibility.reason || 'You are not eligible to review this product.');
      return;
    }

    if (!reviewForm.comment.trim()) {
      toast.error('Please add your review comments.');
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewsAPI.create({
        product: product._id,
        rating: Number(reviewForm.rating),
        title: reviewForm.title,
        comment: reviewForm.comment
      });
      toast.success('Review submitted successfully!');
      setReviewForm({ rating: 5, title: '', comment: '' });

      setEligibility({ canReview: false, reason: 'You have already reviewed this product.' });

      await dispatch(fetchProductById(id));

      const updatedReviews = await reviewsAPI.getByProduct(product._id, { limit: REVIEW_PAGE_LIMIT });
      if (updatedReviews?.data?.success) {
        setReviews(updatedReviews.data.reviews || []);
        setReviewStats((prev) => ({
          average: prev.average,
          count: typeof updatedReviews.data.total === 'number' ? updatedReviews.data.total : prev.count
        }));
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to submit review. Please try again.';
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    setSelectedImage(currentImageIndex);
  }, [currentImageIndex]);

  // Additional scroll to top on component mount to ensure it always works
  useEffect(() => {
    // Force scroll to top with multiple methods for better compatibility
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  const isVariantSelectionIncomplete = () => {
    if (!product?.variants || product.variants.length === 0) {
      return false;
    }
    return product.variants.some((variant) => !selectedVariants[variant.name]);
  };

  const executeAddToCart = () => {
    if (!product) return;

    const variantString = Object.entries(selectedVariants)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const selectedColor = (selectedVariants['Color'] || selectedVariants['color'] || '').toLowerCase();
    const colorImage = (product.images || []).find((img) => String(img.color || '').toLowerCase() === selectedColor)?.url;
    const chosenImage = colorImage || product.images[0]?.url;

    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      currency: product.currency,
      image: chosenImage,
      quantity,
      variant: variantString
    }));
    toast.success('Added to cart!');
  };

  const executeBuyNow = () => {
    if (!product) return;
    const variantString = Object.entries(selectedVariants)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const selectedColor = (selectedVariants['Color'] || selectedVariants['color'] || '').toLowerCase();
    const colorImage = (product.images || []).find((img) => String(img.color || '').toLowerCase() === selectedColor)?.url;
    const chosenImage = colorImage || product.images[0]?.url;

    const buyNowItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      currency: product.currency,
      image: chosenImage,
      quantity,
      variant: variantString
    };
    navigate('/checkout', { state: { buyNowItem } });
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (isVariantSelectionIncomplete()) {
      setPendingAction('cart');
      setIsVariantModalOpen(true);
      return;
    }
    executeAddToCart();
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (isVariantSelectionIncomplete()) {
      setPendingAction('buy');
      setIsVariantModalOpen(true);
      return;
    }
    executeBuyNow();
  };

  const handleAddToWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    dispatch(addToWishlist(product._id));
    toast.success('Added to wishlist!');
  };

  // Mobile header handlers
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: product.description,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    }
  };

  const handleVariantModalClose = () => {
    setIsVariantModalOpen(false);
    setPendingAction(null);
  };

  const handleVariantModalConfirm = () => {
    if (!product) return;
    if (isVariantSelectionIncomplete()) {
      toast.error('Please select all required options.');
      return;
    }
    const action = pendingAction;
    handleVariantModalClose();
    if (action === 'cart') {
      executeAddToCart();
    } else if (action === 'buy') {
      executeBuyNow();
    }
  };

  // Scroll function for recommended products
  const scrollRecommended = (direction) => {
    const container = document.getElementById('recommended-products-container');
    const scrollAmount = 300;
    
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

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-200 h-96 rounded-lg"></div>
            <div className="space-y-4">
              <div className="bg-gray-200 h-8 rounded"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              <div className="bg-gray-200 h-24 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>

          {/* Product Name - Truncated */}
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 truncate mx-4">
            {product.name}
          </h1>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Wishlist Button */}
            <button
              onClick={handleAddToWishlist}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                isWishlisted 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Breadcrumb - Only visible on desktop */}
      <div className="hidden md:block bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link to="/products" className="text-gray-500 hover:text-gray-700">Products</Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-12">
          {/* Product Images */}
          <div className="relative overflow-hidden">
            {/* Swipeable Image Carousel */}
            <div 
              className="flex transition-transform duration-300 ease-in-out" 
              style={{ transform: `translateX(-${selectedImage * 100}%)` }}
              {...swipeHandlers}
            >
              {product.images.map((img, idx) => (
                <div key={idx} className="flex-shrink-0 w-full">
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src={img.url || 'https://via.placeholder.com/600'}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-96 lg:h-[500px] object-cover cursor-zoom-in"
                      onClick={() => setShowImageModal(true)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Badges */}
            {product.featured && (
              <div className="absolute top-4 left-4">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Featured
                </span>
              </div>
            )}
            {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
              <div className="absolute top-4 right-4">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Save {formatPrice(product.comparePrice - product.price, product.currency)}
                </span>
              </div>
            )}

            {/* Carousel Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {product.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    selectedImage === idx ? 'bg-blue-500 scale-125' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-3 md:space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Package className="h-4 w-4 mr-1" />
                  {product.category?.name || 'Product'}
                </span>
                <button 
                  onClick={handleAddToWishlist}
                  className={`hidden md:flex p-2 rounded-full transition-all ${
                    isWishlisted 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-4">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center space-x-2 md:space-x-4 mb-2 md:mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < roundedAverage
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 font-medium">
                  {displayedAverage.toFixed(1)} ({displayedCount} review{displayedCount === 1 ? '' : 's'})
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-white rounded-xl p-3 md:p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-pink-600">{formatPrice(product.price, product.currency)}</span>
                    {product.comparePrice && (
                      <span className="text-lg md:text-xl text-gray-500 line-through font-medium">
                        {formatPrice(product.comparePrice, product.currency)}
                      </span>
                    )}
                  </div>
                  {product.comparePrice && (
                    <div className="flex items-center mt-1">
                      <span className="text-green-600 font-semibold">
                        {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                      </span>
                    </div>
                  )}
                </div>
                <button className="hidden md:inline-flex p-2 text-gray-500 hover:text-gray-700">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              {product.inventory?.stock > 0 ? (
                <>
                  <div className="flex items-center text-green-600">
                    <Check className="h-5 w-5 mr-2" />
                    <span className="font-semibold">In Stock</span>
                  </div>
                  <span className="text-gray-500">({product.inventory.stock} available)</span>
                </>
              ) : (
                <div className="flex items-center text-red-600">
                  <Info className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                {product.variants.map((variant) => (
                  <div key={variant.name} className="bg-white rounded-xl p-3 md:p-4 shadow-sm border">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      {variant.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedVariants({ ...selectedVariants, [variant.name]: option })}
                          className={`px-4 py-2 border rounded-lg font-medium transition-all ${
                            selectedVariants[variant.name] === option
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400 text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="bg-white rounded-xl p-3 md:p-6 shadow-sm border space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Quantity</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-xl font-semibold min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleBuyNow}
                  disabled={product.inventory?.stock === 0}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-4 rounded-xl hover:from-pink-700 hover:to-rose-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                >
                  <Zap className="h-6 w-6 mr-2" />
                  {product.inventory?.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={product.inventory?.stock === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                >
                  <ShoppingCart className="h-6 w-6 mr-2" />
                  {product.inventory?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
              <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 bg-white rounded-lg shadow-sm border">
                <Truck className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                <div>
                  <div className="font-semibold text-xs md:text-sm">Free Shipping</div>
                  <div className="text-[10px] md:text-xs text-gray-500">On orders over {formatPrice(product.shipping?.freeShippingThreshold || 50, product.currency || 'USD')}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 bg-white rounded-lg shadow-sm border">
                <RotateCcw className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                <div>
                  <div className="font-semibold text-xs md:text-sm">Easy Returns</div>
                  <div className="text-[10px] md:text-xs text-gray-500">30-day policy</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-4 bg-white rounded-lg shadow-sm border">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                <div>
                  <div className="font-semibold text-xs md:text-sm">Secure Payment</div>
                  <div className="text-[10px] md:text-xs text-gray-500">SSL encrypted</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs for Desktop */}
        <div className="hidden md:block mt-16">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b overflow-x-auto">
              <nav className="flex">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'specifications', label: 'Specifications' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'shipping', label: 'Shipping' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                    {product.description && product.description.length > DESCRIPTION_CHAR_LIMIT && !isDescriptionExpanded
                      ? `${product.description.substring(0, DESCRIPTION_CHAR_LIMIT)}...`
                      : product.description}
                  </p>
                  {product.description && product.description.length > DESCRIPTION_CHAR_LIMIT && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-semibold flex items-center transition-colors"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          <span>See Less</span>
                          <ChevronRight className="h-4 w-4 ml-1 rotate-90" />
                        </>
                      ) : (
                        <>
                          <span>See More</span>
                          <ChevronRight className="h-4 w-4 ml-1 -rotate-90" />
                        </>
                      )}
                    </button>
                  )}
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specifications' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Product Details</h4>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">SKU</dt>
                        <dd className="font-medium">{product.inventory?.sku || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Category</dt>
                        <dd className="font-medium">{product.category?.name || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Stock</dt>
                        <dd className="font-medium">{product.inventory?.stock || 0} units</dd>
                      </div>
                      {product.shipping?.weight && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Weight</dt>
                          <dd className="font-medium">{product.shipping.weight} kg</dd>
                        </div>
                      )}
                      {product.shipping?.dimensions && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Dimensions</dt>
                          <dd className="font-medium">{product.shipping.dimensions.length} x {product.shipping.dimensions.width} x {product.shipping.dimensions.height} cm</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Customer Reviews</h3>
                      <p className="text-sm text-gray-500">Average rating based on customer feedback</p>
                      <div className="mt-3 flex items-center">
                        <span className="text-4xl font-extrabold text-yellow-500">{displayedAverage.toFixed(1)}</span>
                        <div className="ml-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < Math.round(displayedAverage || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">{displayedCount} review{displayedCount === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 max-w-md">
                      <div className="space-y-2">
                        {ratingBreakdown.map((count, idx) => {
                          const starLevel = 5 - idx;
                          const percentage = reviewStats.count ? Math.round((count / reviewStats.count) * 100) : 0;
                          return (
                            <div key={starLevel} className="flex items-center space-x-3">
                              <span className="w-8 text-sm font-medium text-gray-700">{starLevel}★</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-400"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="w-10 text-sm text-gray-500 text-right">{percentage}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {isAuthenticated && (
                    <div className="bg-white border rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Share your experience</h4>
                        {eligibility.canReview ? (
                          <span className="inline-flex items-center text-sm text-green-600 font-medium">
                            <Check className="h-4 w-4 mr-1" /> Verified Purchase
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">{eligibility.reason || 'Only verified buyers can submit reviews.'}</span>
                        )}
                      </div>

                      <form className="space-y-4" onSubmit={handleSubmitReview}>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                          <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleReviewInputChange('rating', star)}
                                className={`p-2 rounded-full ${reviewForm.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                              >
                                <Star className="h-6 w-6" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Title (optional)</label>
                          <input
                            type="text"
                            value={reviewForm.title}
                            onChange={(e) => handleReviewInputChange('title', e.target.value)}
                            placeholder="Great quality!"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Share your thoughts</label>
                          <textarea
                            value={reviewForm.comment}
                            onChange={(e) => handleReviewInputChange('comment', e.target.value)}
                            rows={4}
                            placeholder="Tell us about the product quality, delivery, fit, etc."
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!eligibility.canReview || submittingReview}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="space-y-4">
                    {reviewsLoading ? (
                      <div className="py-8 text-center text-gray-500">Loading reviews...</div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                        <p className="text-gray-500">Be the first to share your thoughts on this product.</p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review._id} className="bg-white border rounded-2xl p-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-gray-900">{review.user?.name || 'Customer'}</span>
                                {review.verified && (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                    <Check className="h-3 w-3 mr-1" /> Verified Buyer
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.title && (
                            <h4 className="mt-4 text-lg font-semibold text-gray-900">{review.title}</h4>
                          )}
                          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Shipping Information</h4>
                    <ul className="space-y-3 text-gray-700 list-none">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Free shipping on orders over {formatPrice(product.shipping?.freeShippingThreshold || 50, product.currency || 'USD')}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Standard delivery: {product.shipping?.standardDelivery || '3-5 business days'}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Express delivery: {product.shipping?.expressDelivery || '1-2 business days (additional charges apply)'}</span>
                      </li>
                      {product.shipping?.internationalShipping !== false && (
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>International shipping available</span>
                        </li>
                      )}
                      {product.shipping?.shippingNotes && (
                        <li className="flex items-start mt-4 pt-4 border-t border-gray-200">
                          <span className="mr-2">ℹ️</span>
                          <span className="whitespace-pre-wrap">{product.shipping.shippingNotes}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Sections for Mobile */}
        <div className="md:hidden mt-6 space-y-2">
          <CollapsibleSection
            title="Description"
            isOpen={openSection === 'description'}
            onToggle={() => setOpenSection(openSection === 'description' ? null : 'description')}
          >
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {product.description && product.description.length > DESCRIPTION_CHAR_LIMIT && !isDescriptionExpanded
                  ? `${product.description.substring(0, DESCRIPTION_CHAR_LIMIT)}...`
                  : product.description}
              </p>
              {product.description && product.description.length > DESCRIPTION_CHAR_LIMIT && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-3 text-blue-600 hover:text-blue-700 font-semibold flex items-center transition-colors text-sm"
                >
                  {isDescriptionExpanded ? (
                    <>
                      <span>See Less</span>
                      <ChevronRight className="h-4 w-4 ml-1 rotate-90" />
                    </>
                  ) : (
                    <>
                      <span>See More</span>
                      <ChevronRight className="h-4 w-4 ml-1 -rotate-90" />
                    </>
                  )}
                </button>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Specifications"
            isOpen={openSection === 'specifications'}
            onToggle={() => setOpenSection(openSection === 'specifications' ? null : 'specifications')}
          >
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">SKU</dt><dd className="font-medium">{product.inventory?.sku || 'N/A'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Category</dt><dd className="font-medium">{product.category?.name || 'N/A'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Stock</dt><dd className="font-medium">{product.inventory?.stock || 0} units</dd></div>
              {product.shipping?.weight && (
                <div className="flex justify-between"><dt className="text-gray-500">Weight</dt><dd className="font-medium">{product.shipping.weight} kg</dd></div>
              )}
              {product.shipping?.dimensions && (
                <div className="flex justify-between"><dt className="text-gray-500">Dimensions</dt><dd className="font-medium">{product.shipping.dimensions.length} x {product.shipping.dimensions.width} x {product.shipping.dimensions.height} cm</dd></div>
              )}
            </dl>
          </CollapsibleSection>

          <CollapsibleSection
            title="Reviews"
            isOpen={openSection === 'reviews'}
            onToggle={() => setOpenSection(openSection === 'reviews' ? null : 'reviews')}
          >
            <div className="space-y-6">
              <div className="bg-white border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Customer Reviews</h4>
                    <p className="text-xs text-gray-500">Average rating from verified buyers</p>
                  </div>
                  <span className="text-3xl font-bold text-yellow-500">{displayedAverage.toFixed(1)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(displayedAverage || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{displayedCount} review{displayedCount === 1 ? '' : 's'}</span>
                </div>

                <div className="mt-4 space-y-2">
                  {ratingBreakdown.map((count, idx) => {
                    const starLevel = 5 - idx;
                    const percentage = reviewStats.count ? Math.round((count / reviewStats.count) * 100) : 0;
                    return (
                      <div key={starLevel} className="flex items-center space-x-2">
                        <span className="w-8 text-xs font-medium text-gray-700">{starLevel}★</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="w-10 text-xs text-gray-500 text-right">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isAuthenticated && (
                <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-gray-900">Share your review</h4>
                    {eligibility.canReview ? (
                      <span className="inline-flex items-center text-xs font-semibold text-green-600">
                        <Check className="h-3.5 w-3.5 mr-1" /> Verified Purchase
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 text-right">{eligibility.reason || 'Only verified buyers can submit reviews.'}</span>
                    )}
                  </div>

                  <form className="space-y-3" onSubmit={handleSubmitReview}>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Rating</label>
                      <div className="flex items-center space-x-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleReviewInputChange('rating', star)}
                            className={`p-1.5 rounded-full ${reviewForm.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                          >
                            <Star className="h-5 w-5" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Title (optional)</label>
                      <input
                        type="text"
                        value={reviewForm.title}
                        onChange={(e) => handleReviewInputChange('title', e.target.value)}
                        placeholder="Great product!"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Your review</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => handleReviewInputChange('comment', e.target.value)}
                        rows={3}
                        placeholder="Tell us about fit, quality, delivery ..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!eligibility.canReview || submittingReview}
                      className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                {reviewsLoading ? (
                  <div className="py-6 text-center text-gray-500 text-sm">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-6">
                    <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900">No reviews yet</h3>
                    <p className="text-sm text-gray-500">Be the first to share your thoughts.</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.user?.name || 'Customer'}</p>
                          <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.title && <p className="text-sm font-semibold text-gray-900">{review.title}</p>}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                      {review.verified && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-green-100 text-green-700">
                          <Check className="h-3 w-3 mr-1" /> Verified Buyer
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Shipping"
            isOpen={openSection === 'shipping'}
            onToggle={() => setOpenSection(openSection === 'shipping' ? null : 'shipping')}
          >
            <ul className="space-y-2 text-sm text-gray-700 list-none">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Free shipping over {formatPrice(product.shipping?.freeShippingThreshold || 50, product.currency || 'USD')}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Standard: {product.shipping?.standardDelivery || '3-5 business days'}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Express: {product.shipping?.expressDelivery || '1-2 business days'}</span>
              </li>
              {product.shipping?.internationalShipping !== false && (
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>International shipping available</span>
                </li>
              )}
              {product.shipping?.shippingNotes && (
                <li className="flex items-start mt-3 pt-3 border-t border-gray-200">
                  <span className="mr-2">ℹ️</span>
                  <span className="whitespace-pre-wrap text-xs">{product.shipping.shippingNotes}</span>
                </li>
              )}
            </ul>
          </CollapsibleSection>
        </div>
      </div>

      {/* Recommended Products Section */}
      <section className="py-4 md:py-12 bg-white pb-24 md:pb-12">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-primary-500 rounded-full mr-2 md:mr-3">
                <Star className="h-4 w-4 md:h-6 md:w-6 text-white fill-current" />
              </div>
              <div>
                <h2 className="text-lg md:text-3xl font-bold text-gray-900">Recommended for you</h2>
                <p className="text-xs md:text-sm text-gray-600">Based on your interests</p>
              </div>
            </div>
            
            {/* Navigation Buttons - Hidden on mobile */}
            <div className="hidden md:flex space-x-2">
              <button
                onClick={() => scrollRecommended('left')}
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow border border-gray-200"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => scrollRecommended('right')}
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow border border-gray-200"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Products Horizontal Scroll Container */}
          {recommendedLoading ? (
            <div className="flex space-x-1 md:space-x-3 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-36 sm:w-64 bg-gray-200 rounded-lg md:rounded-xl h-52 sm:h-80 animate-pulse"></div>
              ))}
            </div>
          ) : recommendedProducts.length > 0 ? (
            <div 
              id="recommended-products-container"
              className="flex space-x-1 md:space-x-3 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {recommendedProducts.map((recProduct) => (
                <Link
                  key={recProduct._id}
                  to={`/products/${recProduct._id}`}
                  className="flex-shrink-0 w-36 sm:w-64 bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group border border-gray-100"
                >
                  <div className="relative h-36 sm:h-48 overflow-hidden bg-gray-100">
                    <img
                      src={recProduct.images[0]?.url || 'https://via.placeholder.com/300'}
                      alt={recProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Sale Badge */}
                    {recProduct.comparePrice && (
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[8px] sm:text-xs font-bold shadow-lg">
                        -{Math.round(((recProduct.comparePrice - recProduct.price) / recProduct.comparePrice) * 100)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="p-1.5 sm:p-4 flex flex-col flex-grow bg-white">
                    {/* Product Name */}
                    <h3 className="font-bold text-gray-800 mb-0 sm:mb-2 text-xs sm:text-base leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[1.1rem] sm:min-h-0">
                      {recProduct.name}
                    </h3>
                    
                    {/* Rating & Sales */}
                    <div className="flex items-center justify-between mb-0 sm:mb-3">
                      <div className="flex items-center gap-0.5 sm:gap-1 bg-yellow-50 px-0.5 sm:px-1.5 py-0.5 rounded">
                        <Star className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-yellow-500 fill-current flex-shrink-0" />
                        <span className="text-[9px] sm:text-xs font-semibold text-gray-700">
                          {recProduct.ratings.average.toFixed(1)} <span className="text-gray-500">({recProduct.ratings.count})</span>
                        </span>
                      </div>
                      <span className="text-[9px] sm:text-xs text-gray-500 font-medium">
                        {recProduct.sales || 0} sold
                      </span>
                    </div>
                    
                    {/* Price Section */}
                    <div className="mt-auto pt-0.5 sm:pt-2 border-t border-gray-100">
                      <div className="flex items-baseline gap-0.5 sm:gap-2 flex-wrap">
                        <span className="text-base sm:text-xl lg:text-2xl font-extrabold text-pink-600 leading-none">{formatPrice(recProduct.price, recProduct.currency)}</span>
                        {recProduct.comparePrice && (
                          <span className="text-[9px] sm:text-sm text-gray-400 line-through font-medium leading-none">
                            {formatPrice(recProduct.comparePrice, recProduct.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
          
          {/* End Message */}
          {!recommendedLoading && recommendedProducts.length > 0 && (
            <div className="text-center py-6 md:py-8">
              <p className="text-gray-500 text-sm">You've reached the end</p>
            </div>
          )}
        </div>
      </section>

      {isVariantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
            <button
              onClick={handleVariantModalClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-3 pr-8">
              <Info className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select product options</h3>
                <p className="text-sm text-gray-600">Choose the available size, color, or other variants to continue.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {product.variants?.map((variant) => (
                <div key={variant.name}>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">{variant.name}</h4>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedVariants({ ...selectedVariants, [variant.name]: option })}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedVariants[variant.name] === option
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400 text-gray-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
              <button
                onClick={handleVariantModalClose}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVariantModalConfirm}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative w-full max-w-6xl max-h-[90vh] flex items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 md:top-4 md:right-4 text-white bg-gray-800 hover:bg-gray-700 rounded-full p-3 transition-colors shadow-lg z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Navigation Arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((selectedImage - 1 + product.images.length) % product.images.length);
                  }}
                  className="absolute left-2 md:left-4 text-white bg-gray-800 hover:bg-gray-700 rounded-full p-3 transition-colors shadow-lg z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((selectedImage + 1) % product.images.length);
                  }}
                  className="absolute right-2 md:right-4 text-white bg-gray-800 hover:bg-gray-700 rounded-full p-3 transition-colors shadow-lg z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            <img
              src={product.images[selectedImage]?.url || 'https://via.placeholder.com/800'}
              alt={`${product.name} - View ${selectedImage + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium">
              {selectedImage + 1} / {product.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
