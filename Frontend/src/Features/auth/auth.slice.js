import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 1. Async Thunk for API Login Integration
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (loginPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', loginPayload);

      const data = response.data;

      // Store token safely if needed
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data.user; // Expected user data payload from API backend
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network connection error.');
    }
  }
);

// 2. Async Thunk for Checking Session Auth
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      // Send token if present in localStorage, and include credentials for cookies
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      };
      const response = await axios.get('http://localhost:3000/api/auth/check', config);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Session invalid');
    }
  }
);

// 3. Async Thunk for Logging Out (Blacklisting token)
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      };
      await axios.post('http://localhost:3000/api/auth/logout', {}, config);
      localStorage.removeItem('token');
      return true;
    } catch (error) {
      // Even if API fails, clear local storage
      localStorage.removeItem('token');
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

// 4. Initial State Parameters Definitions
const initialState = {
  user: null,
  loading: true, // Start as true so app can wait for checkAuth on mount
  error: null,
};

// 3. Main Auth Slice Structure Map
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Pending State
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Fulfilled Success State
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      // Rejected Failure Error State
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        localStorage.removeItem('token');
      })
      // Logout User
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;