import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Trash2, Plus, Minus } from 'lucide-react';
import { removeFromCart, updateQuantity } from '../store/slices/cartSlice';
import { formatPrice } from '../utils/currency';

const Cart = () => {
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const keyOf = (i) => `${i.productId}-${i.variant || ''}`;
  const allKeys = useMemo(() => cartItems.map(keyOf), [cartItems]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  
  const selectedItems = useMemo(
    () => cartItems.filter((i) => selectedKeys.includes(keyOf(i))),
    [cartItems, selectedKeys]
  );
  const subtotalAll = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalSelected = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingAll = subtotalAll > 50 ? 0 : 10;
  // Only charge shipping if items are selected
  const shippingSelected = selectedItems.length === 0 ? 0 : (subtotalSelected > 50 ? 0 : 10);
  const totalAll = subtotalAll + shippingAll;
  const totalSelected = subtotalSelected + shippingSelected;
  const currency = selectedItems[0]?.currency || cartItems[0]?.currency || 'USD';

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ productId: item.productId, variant: item.variant, quantity: newQuantity }));
  };

  const handleRemove = (item) => {
    dispatch(removeFromCart({ productId: item.productId, variant: item.variant }));
  };

  const toggleSelect = (item) => {
    const k = keyOf(item);
    setSelectedKeys((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const toggleSelectAll = () => {
    setSelectedKeys((prev) => (prev.length === allKeys.length ? [] : allKeys));
  };

  const checkoutSelected = () => {
    if (selectedKeys.length === 0) return;
    navigate('/checkout', { state: { selectedKeys } });
  };

  const checkoutSingle = (item) => {
    navigate('/checkout', { state: { selectedKeys: [keyOf(item)] } });
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24 md:pb-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link to="/products" className="text-primary-600 hover:text-primary-700">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 px-1">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-3 bg-white rounded-lg shadow p-3 sm:p-4">
            <input type="checkbox" checked={selectedKeys.length === allKeys.length && allKeys.length > 0} onChange={toggleSelectAll} className="w-4 h-4" />
            <span className="text-sm text-gray-700">Select all ({cartItems.length})</span>
          </div>
          {cartItems.map((item) => (
            <div key={`${item.productId}-${item.variant}`} className="bg-white rounded-lg shadow-md p-3 sm:p-4 flex items-center space-x-2 sm:space-x-4">
              <input
                type="checkbox"
                checked={selectedKeys.includes(keyOf(item))}
                onChange={() => toggleSelect(item)}
                className="w-4 h-4 flex-shrink-0"
              />
              <img src={item.image} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                {item.variant && <p className="text-xs sm:text-sm text-gray-600 truncate">{item.variant}</p>}
                <p className="text-base sm:text-xl font-extrabold text-primary-600">{formatPrice(item.price, item.currency || currency)}</p>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <button
                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <span className="w-8 sm:w-12 text-center text-sm sm:text-base">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                <button
                  onClick={() => checkoutSingle(item)}
                  className="px-2 sm:px-3 py-1 sm:py-2 border rounded-lg text-xs sm:text-sm hover:bg-gray-50 whitespace-nowrap"
                >
                  Buy now
                </button>
                <button
                  onClick={() => handleRemove(item)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-20">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Order Summary</h2>
            <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Selected: {selectedKeys.length} of {cartItems.length}</div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Subtotal (selected)</span>
                <span className="font-semibold">{formatPrice(subtotalSelected, currency)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Shipping (selected)</span>
                <span className="font-semibold">{shippingSelected === 0 ? 'Free' : formatPrice(shippingSelected, currency)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-base sm:text-lg">
                <span className="font-bold">Total (selected)</span>
                <span className="font-extrabold text-pink-600">{formatPrice(totalSelected, currency)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              <button
                onClick={checkoutSelected}
                disabled={selectedKeys.length === 0}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50"
              >
                Checkout Selected
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full border text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Checkout All ({formatPrice(totalAll, currency)})
              </button>
              <button
                onClick={() => selectedItems.forEach((it) => handleRemove(it))}
                disabled={selectedKeys.length === 0}
                className="w-full text-red-600 py-2 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-50"
              >
                Remove Selected
              </button>
            </div>
            <Link to="/products" className="block text-center mt-2 text-primary-600 hover:text-primary-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
