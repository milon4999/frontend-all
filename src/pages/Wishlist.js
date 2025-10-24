import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Trash2, ShoppingCart, Star } from 'lucide-react';
import { fetchWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { formatPrice } from '../utils/currency';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRemove = (productId) => {
    dispatch(removeFromWishlist(productId));
    toast.success('Removed from wishlist');
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url,
      quantity: 1,
      variant: ''
    }));
    toast.success('Added to cart!');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Wishlist</h1>
          <p className="text-sm text-gray-600 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        <Heart className="h-6 w-6 md:h-8 md:w-8 text-pink-500 fill-current" />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Heart className="h-12 w-12 md:h-16 md:w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg md:text-xl font-semibold mb-2">Your Wishlist is Empty</h3>
          <p className="text-sm md:text-base text-gray-600 mb-4">Save your favorite items for later</p>
          <Link
            to="/products"
            className="inline-block bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {items.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              <Link to={`/products/${product._id}`} className="block relative">
                <img
                  src={product.images[0]?.url || 'https://via.placeholder.com/300'}
                  alt={product.name}
                  className="w-full h-32 sm:h-40 md:h-48 object-cover"
                />
                {product.comparePrice && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                  </div>
                )}
              </Link>
              <div className="p-2 sm:p-3 md:p-4">
                <Link to={`/products/${product._id}`}>
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2 line-clamp-2 hover:text-pink-600 transition">{product.name}</h3>
                </Link>
                
                {/* Rating */}
                <div className="flex items-center mb-1 sm:mb-2">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-xs text-gray-600">
                    {product.ratings?.average?.toFixed(1) || '0.0'}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-2 sm:mb-3">
                  <span className="text-sm sm:text-lg md:text-xl font-bold text-pink-600">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {product.comparePrice && (
                    <span className="ml-2 text-xs sm:text-sm text-gray-500 line-through">
                      {formatPrice(product.comparePrice, product.currency)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-1.5 sm:py-2 px-2 rounded text-xs sm:text-sm font-medium hover:from-pink-600 hover:to-pink-700 transition flex items-center justify-center"
                  >
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Add to Cart</span>
                    <span className="sm:hidden">Cart</span>
                  </button>
                  <button
                    onClick={() => handleRemove(product._id)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded hover:bg-red-50 hover:border-red-300 transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
