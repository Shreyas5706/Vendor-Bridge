import React, { useEffect } from 'react'
import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes"
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../Features/auth/auth.slice';

const App = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <RouterProvider router={router}></RouterProvider>
  )
}

export default App