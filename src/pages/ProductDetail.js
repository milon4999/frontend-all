import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, ShoppingCart, Heart, Share2, Shield, Truck, RotateCcw, ChevronRight, Plus, Minus, Check, Info, Tag, Package, X, ArrowLeft, ChevronLeft, Zap } from 'lucide-react';
import { fetchProductById } from '../store/slices/productSlice';
import { productsAPI } from '../services/api';
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
  
  const DESCRIPTION_CHAR_LIMIT = 300;

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
        setRecommendedProducts(response.data.products);
      } catch (error) {
        console.error('Error fetching recommended products:', error);
      } finally {
        setRecommendedLoading(false);
      }
    };
    
    fetchRecommended();
  }, [dispatch, id]);

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
                        i < Math.floor(product.ratings?.average || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 font-medium">
                  {product.ratings?.average?.toFixed(1) || '0.0'} ({product.ratings?.count || 0} reviews)
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
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-500">Be the first to review this product</p>
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
            <div className="text-center py-6">
              <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">No reviews yet</h3>
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
