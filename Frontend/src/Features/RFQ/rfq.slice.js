import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE = 'http://localhost:3000/api';

// ── Async: Search vendors by name/email
export const searchVendors = createAsyncThunk(
  'rfq/searchVendors',
  async (query, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE}/vendors/search?q=${encodeURIComponent(query)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      return res.data.vendors || res.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Search failed');
    }
  }
);

// ── Async: Submit RFQ
export const submitRFQ = createAsyncThunk(
  'rfq/submitRFQ',
  async (payload, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${BASE}/rfq/create`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Submission failed');
    }
  }
);

// ── Async: Save as draft
export const saveDraftRFQ = createAsyncThunk(
  'rfq/saveDraftRFQ',
  async (payload, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${BASE}/rfq/draft`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Draft save failed');
    }
  }
);

const rfqSlice = createSlice({
  name: 'rfq',
  initialState: {
    loading:        false,
    submitLoading:  false,
    draftLoading:   false,
    error:          null,
    success:        false,
    draftSaved:     false,
    vendorResults:  [],
    vendorSearching: false,
  },
  reducers: {
    resetRFQ: (state) => {
      state.loading        = false;
      state.submitLoading  = false;
      state.draftLoading   = false;
      state.error          = null;
      state.success        = false;
      state.draftSaved     = false;
      state.vendorResults  = [];
      state.vendorSearching = false;
    },
    clearRFQError: (state) => {
      state.error = null;
    },
    clearVendorResults: (state) => {
      state.vendorResults = [];
    },
  },
  extraReducers: (builder) => {
    // searchVendors
    builder
      .addCase(searchVendors.pending,   (state) => { state.vendorSearching = true; })
      .addCase(searchVendors.fulfilled, (state, action) => { state.vendorSearching = false; state.vendorResults = action.payload; })
      .addCase(searchVendors.rejected,  (state) => { state.vendorSearching = false; state.vendorResults = []; });

    // submitRFQ
    builder
      .addCase(submitRFQ.pending,   (state) => { state.submitLoading = true; state.error = null; })
      .addCase(submitRFQ.fulfilled, (state) => { state.submitLoading = false; state.success = true; })
      .addCase(submitRFQ.rejected,  (state, action) => { state.submitLoading = false; state.error = action.payload; });

    // saveDraftRFQ
    builder
      .addCase(saveDraftRFQ.pending,   (state) => { state.draftLoading = true; state.error = null; })
      .addCase(saveDraftRFQ.fulfilled, (state) => { state.draftLoading = false; state.draftSaved = true; })
      .addCase(saveDraftRFQ.rejected,  (state, action) => { state.draftLoading = false; state.error = action.payload; });
  },
});

export const { resetRFQ, clearRFQError, clearVendorResults } = rfqSlice.actions;
export default rfqSlice.reducer;
