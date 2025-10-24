import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistAPI } from '../../services/api';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

// Get wishlist
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.get();
      console.log('Wishlist fetch response:', response.data);
      // Handle different response formats
      const wishlistData = response.data.wishlist || response.data.products || response.data.items || [];
      return Array.isArray(wishlistData) ? wishlistData : [];
    } catch (error) {
      console.error('Wishlist fetch error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

// Add to wishlist
export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.add(productId);
      console.log('Add to wishlist response:', response.data);
      // Handle different response formats
      const wishlistData = response.data.wishlist || response.data.products || response.data.items || [];
      return Array.isArray(wishlistData) ? wishlistData : [];
    } catch (error) {
      console.error('Add to wishlist error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

// Remove from wishlist
export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.remove(productId);
      console.log('Remove from wishlist response:', response.data);
      // Handle different response formats
      const wishlistData = response.data.wishlist || response.data.products || response.data.items || [];
      return Array.isArray(wishlistData) ? wishlistData : [];
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default wishlistSlice.reducer;
