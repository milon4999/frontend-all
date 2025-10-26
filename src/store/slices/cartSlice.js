import { createSlice } from '@reduxjs/toolkit';

// Get cart from localStorage with error handling
const getCartFromStorage = () => {
  try {
    const stored = localStorage.getItem('cart');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse cart from localStorage:', error);
    return [];
  }
};

const cartItems = getCartFromStorage();

const initialState = {
  items: cartItems,
  total: 0,
};

// Calculate total with safety check
const calculateTotal = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { productId, name, price, image, quantity = 1, variant, comparePrice, currency } = action.payload;
      
      // Ensure items is always an array
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      
      const existingItem = state.items.find(
        (item) => item.productId === productId && item.variant === variant
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ productId, name, price, comparePrice, image, quantity, variant, currency });
      }

      state.total = calculateTotal(state.items);
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      const { productId, variant } = action.payload;
      
      // Ensure items is always an array
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      
      state.items = state.items.filter(
        (item) => !(item.productId === productId && item.variant === variant)
      );
      state.total = calculateTotal(state.items);
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action) => {
      const { productId, variant, quantity } = action.payload;
      
      // Ensure items is always an array
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      
      const item = state.items.find(
        (item) => item.productId === productId && item.variant === variant
      );
      if (item) {
        item.quantity = quantity;
        state.total = calculateTotal(state.items);
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      localStorage.removeItem('cart');
    },
    // Reset cart state if corrupted
    resetCart: (state) => {
      state.items = [];
      state.total = 0;
      localStorage.removeItem('cart');
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
