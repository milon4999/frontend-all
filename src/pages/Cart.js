import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Trash2, Plus, Minus } from 'lucide-react';
import { removeFromCart, updateQuantity } from '../store/slices/cartSlice';

const Cart = () => {
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Ensure items is always an array
  const cartItems = Array.isArray(items) ? items : [];
  
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 10;
  const total = subtotal + shipping;

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ productId: item.productId, variant: item.variant, quantity: newQuantity }));
  };

  const handleRemove = (item) => {
    dispatch(removeFromCart({ productId: item.productId, variant: item.variant }));
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
          {cartItems.map((item) => (
            <div key={`${item.productId}-${item.variant}`} className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
              <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded" />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                {item.variant && <p className="text-sm text-gray-600">{item.variant}</p>}
                <p className="text-lg font-bold text-primary-600">${item.price}</p>
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
              <button
                onClick={() => handleRemove(item)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              Proceed to Checkout
            </button>
            <Link to="/products" className="block text-center mt-4 text-primary-600 hover:text-primary-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
