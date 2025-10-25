import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI } from '../../services/api';
import { buildCacheKey } from '../../utils/cache';

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

const initialState = {
  products: [],
  currentProduct: null,
  loading: false,
  error: null,
  total: 0,
  totalPages: 0,
  currentPage: 1,
  // Caches
  listCache: {}, // key -> { data, timestamp }
  productCache: {}, // id -> { product, timestamp }
  // Scroll preservation for product list pages by key
  scrollYByKey: {}, // key -> number
  activeListKey: '',
};

// Get all products
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (params, { rejectWithValue, getState }) => {
    try {
      const key = buildCacheKey(params);
      const { listCache } = getState().products;
      const cached = listCache[key];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
      const response = await productsAPI.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

// Fetch more products for infinite scroll
export const fetchMoreProducts = createAsyncThunk(
  'products/fetchMore',
  async (params, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch more products');
    }
  }
);

// Get single product
export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { productCache } = getState().products;
      const cached = productCache[id];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.product;
      }
      const response = await productsAPI.getById(id);
      return response.data.product;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    setScrollPosition: (state, action) => {
      const { key, y } = action.payload || {};
      if (key) state.scrollYByKey[key] = y || 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all products
      .addCase(fetchProducts.pending, (state, action) => {
        const key = buildCacheKey(action.meta.arg);
        const cached = state.listCache[key];
        const fresh = cached && Date.now() - cached.timestamp < CACHE_TTL_MS;
        state.loading = !fresh; // avoid flicker if we already have fresh cache
        state.error = null;
        state.activeListKey = key;
        if (fresh) {
          state.products = cached.data.products;
          state.total = cached.data.total;
          state.totalPages = cached.data.totalPages;
          state.currentPage = cached.data.currentPage;
        }
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        const key = buildCacheKey(action.meta.arg);
        state.listCache[key] = { data: action.payload, timestamp: Date.now() };
        state.activeListKey = key;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch more products (infinite scroll)
      .addCase(fetchMoreProducts.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchMoreProducts.fulfilled, (state, action) => {
        state.products = [...state.products, ...action.payload.products];
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchMoreProducts.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch single product
      .addCase(fetchProductById.pending, (state, action) => {
        const id = action.meta.arg;
        const cached = state.productCache[id];
        const fresh = cached && Date.now() - cached.timestamp < CACHE_TTL_MS;
        state.loading = !fresh;
        state.error = null;
        if (fresh) {
          state.currentProduct = cached.product;
        }
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
        const id = action.meta.arg;
        state.productCache[id] = { product: action.payload, timestamp: Date.now() };
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentProduct, setScrollPosition } = productSlice.actions;
export default productSlice.reducer;
