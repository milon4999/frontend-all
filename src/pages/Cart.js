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
  const shippingSelected = subtotalSelected > 50 ? 0 : 10;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-3 bg-white rounded-lg shadow p-3">
            <input type="checkbox" checked={selectedKeys.length === allKeys.length && allKeys.length > 0} onChange={toggleSelectAll} />
            <span className="text-sm text-gray-700">Select all ({cartItems.length})</span>
          </div>
          {cartItems.map((item) => (
            <div key={`${item.productId}-${item.variant}`} className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedKeys.includes(keyOf(item))}
                onChange={() => toggleSelect(item)}
              />
              <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                {item.variant && <p className="text-sm text-gray-600">{item.variant}</p>}
                <p className="text-lg font-bold text-primary-600">{formatPrice(item.price, item.currency || currency)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => checkoutSingle(item)}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Buy now
                </button>
                <button
                  onClick={() => handleRemove(item)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20 space-y-3">
            <h2 className="text-xl font-bold mb-2">Order Summary</h2>
            <div className="text-sm text-gray-600">Selected: {selectedKeys.length} of {cartItems.length}</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal (selected)</span>
                <span>{formatPrice(subtotalSelected, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping (selected)</span>
                <span>{shippingSelected === 0 ? 'Free' : formatPrice(shippingSelected, currency)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total (selected)</span>
                <span>{formatPrice(totalSelected, currency)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
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
