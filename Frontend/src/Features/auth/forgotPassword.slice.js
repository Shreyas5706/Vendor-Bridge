import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE = 'http://localhost:3000/api/auth';

export const sendForgotPasswordOTP = createAsyncThunk(
  'forgotPassword/sendOTP',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE}/send-otp`, { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'forgotPassword/resetPassword',
  async ({ email, otp, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE}/reset-password`, { email, otp, newPassword });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error');
    }
  }
);

const forgotPasswordSlice = createSlice({
  name: 'forgotPassword',
  initialState: {
    loading: false,
    error: null,
    otpSent: false,
    resetSuccess: false,
  },
  reducers: {
    resetForgotPasswordState: (state) => {
      state.loading = false;
      state.error = null;
      state.otpSent = false;
      state.resetSuccess = false;
    },
    clearForgotPasswordError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendForgotPasswordOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetSuccess = false;
      })
      .addCase(sendForgotPasswordOTP.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(sendForgotPasswordOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetSuccess = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.resetSuccess = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetForgotPasswordState, clearForgotPasswordError } = forgotPasswordSlice.actions;
export default forgotPasswordSlice.reducer;
