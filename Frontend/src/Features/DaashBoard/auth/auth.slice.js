import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 1. Async Thunk for API Login Integration
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (loginPayload, { rejectWithValue }) => {
    try {
      const response = await fetch('https://api.vendorbridge.com/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Authorization failed.');
      }

      // Store token safely if needed
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data.user; // Expected user data payload from API backend
    } catch (error) {
      return rejectWithValue(error.message || 'Network connection error.');
    }
  }
);

// 2. Initial State Parameters Definitions
const initialState = {
  user: null,
  loading: false,
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
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;