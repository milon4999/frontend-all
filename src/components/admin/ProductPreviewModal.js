import React from 'react';
import { X, Star, Tag, Eye } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

const ProductPreviewModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Eye className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Product Preview</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Images */}
              <div>
                <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden mb-4">
                  <img
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/400'}
                    alt={product.images?.[0]?.alt || product.name}
                    className="w-full h-96 object-cover object-center"
                  />
                </div>
                {product.images?.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.slice(1, 5).map((image, index) => (
                      <div key={index} className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-md overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-20 object-cover object-center"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                {/* Title and Status */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                    <div className="flex items-center space-x-2">
                      {product.featured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </span>
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Category */}
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Tag className="h-4 w-4 mr-1" />
                    <span>{product.category?.name || 'Uncategorized'}</span>
                  </div>
                </div>

                {/* Shipping Info */}
                {product.shipping && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Shipping</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {typeof product.shipping.weight === 'number' && (
                        <div>
                          <span className="text-gray-500">Weight:</span>
                          <span className="ml-2 font-medium text-gray-900">{product.shipping.weight} kg</span>
                        </div>
                      )}
                      {product.shipping.dimensions && (
                        <div>
                          <span className="text-gray-500">Dimensions:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {product.shipping.dimensions.length} × {product.shipping.dimensions.width} × {product.shipping.dimensions.height} cm
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Free Shipping:</span>
                        <span className="ml-2 font-medium text-gray-900">{product.shipping.freeShipping ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center space-x-4">
                  <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price, product.currency)}</span>
                  {product.comparePrice && (
                    <span className="text-xl text-gray-500 line-through">{formatPrice(product.comparePrice, product.currency)}</span>
                  )}
                  {product.comparePrice && (
                    <span className="text-sm font-medium text-green-600">
                      Save {formatPrice(product.comparePrice - product.price, product.currency)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
                </div>

                {/* Variants */}
                {product.variants?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Available Options</h3>
                    <div className="space-y-3">
                      {product.variants.map((variant, index) => (
                        <div key={index}>
                          <label className="text-sm font-medium text-gray-700">{variant.name}</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {variant.options.map((option, optIndex) => (
                              <span
                                key={optIndex}
                                className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800 border"
                              >
                                {option}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {product.tags?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inventory Info */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Inventory Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Stock:</span>
                      <span className={`ml-2 font-medium ${
                        product.inventory?.stock <= product.inventory?.lowStockThreshold 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {product.inventory?.stock || 0} units
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">SKU:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {product.inventory?.sku || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Low Stock Alert:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {product.inventory?.lowStockThreshold || 0} units
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Track Inventory:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {product.inventory?.trackInventory ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                {product.ratings && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Customer Reviews</h3>
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(product.ratings.average)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {product.ratings.average?.toFixed(1) || '0.0'} ({product.ratings.count || 0} reviews)
                      </span>
                    </div>
                  </div>
                )}

                {/* SEO Information */}
                {product.seo && (product.seo.metaTitle || product.seo.metaDescription) && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">SEO Information</h3>
                    <div className="space-y-2 text-sm">
                      {product.seo.metaTitle && (
                        <div>
                          <span className="text-gray-500">Meta Title:</span>
                          <span className="ml-2 text-gray-900">{product.seo.metaTitle}</span>
                        </div>
                      )}
                      {product.seo.metaDescription && (
                        <div>
                          <span className="text-gray-500">Meta Description:</span>
                          <span className="ml-2 text-gray-900">{product.seo.metaDescription}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreviewModal;
