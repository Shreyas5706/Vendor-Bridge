import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE = 'http://localhost:3000/api/auth';

// ─── Async Thunks ────────────────────────────────────────────────────────────

/** Send OTP to an email address (user email for COMPANY/VENDOR, company email for MANAGER/PO) */
export const sendOTP = createAsyncThunk(
  'register/sendOTP',
  async (email, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE}/send-otp`, { email });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Network error');
    }
  }
);

/** Find a company by email — used by MANAGER / PO registrants */
export const findCompanyByEmail = createAsyncThunk(
  'register/findCompany',
  async (email, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/find-company?email=${encodeURIComponent(email)}`);
      return res.data.data; // { _id, name, email }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Network error');
    }
  }
);

/** Submit the final registration payload */
export const registerUser = createAsyncThunk(
  'register/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE}/register`, payload);
      if (res.data.token) localStorage.setItem('token', res.data.token);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Network error');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const registerSlice = createSlice({
  name: 'register',
  initialState: {
    loading:    false,
    error:      null,
    otpSent:    false,
    company:    null,   // populated after findCompanyByEmail for MANAGER/PO
    registered: false,
  },
  reducers: {
    resetRegister: (state) => {
      state.loading    = false;
      state.error      = null;
      state.otpSent    = false;
      state.company    = null;
      state.registered = false;
    },
    clearRegisterError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // sendOTP
    builder
      .addCase(sendOTP.pending,   (state)          => { state.loading = true;  state.error = null; })
      .addCase(sendOTP.fulfilled, (state)          => { state.loading = false; state.otpSent = true; })
      .addCase(sendOTP.rejected,  (state, action)  => { state.loading = false; state.error = action.payload; });

    // findCompanyByEmail
    builder
      .addCase(findCompanyByEmail.pending,   (state)         => { state.loading = true;  state.error = null; state.company = null; })
      .addCase(findCompanyByEmail.fulfilled, (state, action) => { state.loading = false; state.company = action.payload; })
      .addCase(findCompanyByEmail.rejected,  (state, action) => { state.loading = false; state.error = action.payload; });

    // registerUser
    builder
      .addCase(registerUser.pending,   (state)        => { state.loading = true;  state.error = null; })
      .addCase(registerUser.fulfilled, (state)        => { state.loading = false; state.registered = true; })
      .addCase(registerUser.rejected,  (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { resetRegister, clearRegisterError } = registerSlice.actions;
export default registerSlice.reducer;
