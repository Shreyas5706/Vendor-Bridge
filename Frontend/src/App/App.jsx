import React, { useEffect } from 'react'
import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes"
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../Features/auth/auth.slice';
import BridgeLoader from '../components/BridgeLoader';

const App = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Show the cinematic bridge loader while checking session auth
  if (loading) {
    return <BridgeLoader fullscreen message="Verifying Session…" />;
  }

  return (
    <RouterProvider router={router}></RouterProvider>
  )
}

export default App